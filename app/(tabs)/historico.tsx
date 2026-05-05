import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

type Player = {
  id: string;
  name: string;
};

type TeamBonusCounts = {
  duo: number;
  trio: number;
  quartet: number;
  quintet: number;
};

type MatchScores = {
  agentsCards?: Record<string, number>;
  successfulOperations?: Record<string, number>;
  roundBonusByRound?: Record<string, number>[];
  roundBonus?: Record<string, number>;
  coinsOnAgents?: Record<string, number>;
  storedResources?: Record<string, number>;
  capturedAgents?: Record<string, number>;
  teamBonusCounts?: Record<string, TeamBonusCounts>;
  teamBonus?: Record<string, number>;
};

type SavedMatch = {
  id: string;
  date: string;
  players: Player[];
  roundBonusModel: "best" | "perItem";
  scores: MatchScores;
};

type PlayerResult = {
  player: Player;
  agentsCards: number;
  successfulOperations: number;
  roundBonus: number;
  coinsOnAgents: number;
  storedResources: number;
  capturedAgents: number;
  teamBonus: number;
  total: number;
};

const MATCH_HISTORY_STORAGE_KEY = "@marvel_wingspan_score_matches";

export default function HistoricoScreen() {
  const [matches, setMatches] = useState<SavedMatch[]>([]);
  const [expandedMatchIds, setExpandedMatchIds] = useState<string[]>([]);
  const [expandedPlayerKeys, setExpandedPlayerKeys] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadMatches();
    }, []),
  );

  async function loadMatches() {
    try {
      const storedHistory = await AsyncStorage.getItem(
        MATCH_HISTORY_STORAGE_KEY,
      );

      setMatches(storedHistory ? JSON.parse(storedHistory) : []);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar o histórico.");
    }
  }

  async function saveMatches(updatedMatches: SavedMatch[]) {
    try {
      await AsyncStorage.setItem(
        MATCH_HISTORY_STORAGE_KEY,
        JSON.stringify(updatedMatches),
      );

      setMatches(updatedMatches);
    } catch {
      Alert.alert("Erro", "Não foi possível atualizar o histórico.");
    }
  }

  function removeMatch(matchId: string) {
    Alert.alert(
      "Remover partida",
      "Tem certeza que deseja remover esta partida do histórico?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => {
            const updatedMatches = matches.filter(
              (match) => match.id !== matchId,
            );
            saveMatches(updatedMatches);
          },
        },
      ],
    );
  }

  function toggleMatchExpanded(matchId: string) {
    setExpandedMatchIds((current) =>
      current.includes(matchId)
        ? current.filter((id) => id !== matchId)
        : [...current, matchId],
    );
  }

  function togglePlayerExpanded(matchId: string, playerId: string) {
    const key = `${matchId}-${playerId}`;

    setExpandedPlayerKeys((current) =>
      current.includes(key)
        ? current.filter((id) => id !== key)
        : [...current, key],
    );
  }

  function getScore(
    scoreMap: Record<string, number> | undefined,
    playerId: string,
  ) {
    return scoreMap?.[playerId] ?? 0;
  }

  function getRoundBonus(match: SavedMatch, playerId: string) {
    if (match.scores.roundBonus) {
      return match.scores.roundBonus[playerId] ?? 0;
    }

    const rounds = match.scores.roundBonusByRound ?? [];

    return rounds.reduce((total, round) => total + (round[playerId] ?? 0), 0);
  }

  function getMatchResults(match: SavedMatch): PlayerResult[] {
    return match.players
      .map((player) => {
        const agentsCards = getScore(match.scores.agentsCards, player.id);
        const successfulOperations = getScore(
          match.scores.successfulOperations,
          player.id,
        );
        const roundBonus = getRoundBonus(match, player.id);
        const coinsOnAgents = getScore(match.scores.coinsOnAgents, player.id);
        const storedResources = getScore(
          match.scores.storedResources,
          player.id,
        );
        const capturedAgents = getScore(match.scores.capturedAgents, player.id);
        const teamBonus = getScore(match.scores.teamBonus, player.id);

        return {
          player,
          agentsCards,
          successfulOperations,
          roundBonus,
          coinsOnAgents,
          storedResources,
          capturedAgents,
          teamBonus,
          total:
            agentsCards +
            successfulOperations +
            roundBonus +
            coinsOnAgents +
            storedResources +
            capturedAgents +
            teamBonus,
        };
      })
      .sort((a, b) => b.total - a.total);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const totalMatches = useMemo(() => matches.length, [matches]);

  async function copyMatchToClipboard(match: SavedMatch) {
    const rows = match.players.map((player) => {
      const teamCounts = match.scores.teamBonusCounts?.[player.id];

      return [
        player.name,
        match.scores.successfulOperations?.[player.id] ?? 0,
        match.scores.roundBonusByRound?.[0]?.[player.id] ?? 0,
        match.scores.roundBonusByRound?.[1]?.[player.id] ?? 0,
        match.scores.roundBonusByRound?.[2]?.[player.id] ?? 0,
        match.scores.roundBonusByRound?.[3]?.[player.id] ?? 0,
        teamCounts?.duo ?? 0,
        teamCounts?.trio ?? 0,
        teamCounts?.quartet ?? 0,
        teamCounts?.quintet ?? 0,
        match.scores.agentsCards?.[player.id] ?? 0,
        match.scores.coinsOnAgents?.[player.id] ?? 0,
        match.scores.storedResources?.[player.id] ?? 0,
        match.scores.capturedAgents?.[player.id] ?? 0,
      ].join("\t");
    });

    await Clipboard.setStringAsync(rows.join("\n"));

    Alert.alert("Copiado", "Valores copiados para colar na planilha.");
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedView style={styles.container}>
          <ThemedView style={styles.header}>
            <ThemedText type="title">Histórico</ThemedText>

            <ThemedText style={styles.description}>
              {totalMatches === 0
                ? "Nenhuma partida salva ainda."
                : `${totalMatches} partida${totalMatches > 1 ? "s" : ""} salva${
                    totalMatches > 1 ? "s" : ""
                  }.`}
            </ThemedText>
          </ThemedView>

          {matches.length === 0 ? (
            <ThemedView style={styles.emptyCard}>
              <ThemedText style={styles.emptyText}>
                Quando você salvar uma partida, ela aparecerá aqui.
              </ThemedText>
            </ThemedView>
          ) : (
            matches.map((match) => {
              const results = getMatchResults(match);
              const winner = results[0];
              const isMatchExpanded = expandedMatchIds.includes(match.id);

              return (
                <ThemedView key={match.id} style={styles.matchCard}>
                  <Pressable onPress={() => toggleMatchExpanded(match.id)}>
                    <ThemedView style={styles.matchHeader}>
                      <ThemedView style={styles.matchInfo}>
                        <ThemedText style={styles.matchTitle}>
                          {winner
                            ? `Vencedor: ${winner.player.name}`
                            : "Partida sem resultado"}
                        </ThemedText>

                        <ThemedText style={styles.matchDate}>
                          {formatDate(match.date)}
                        </ThemedText>
                      </ThemedView>

                      {winner && (
                        <ThemedText style={styles.winnerScore}>
                          {winner.total} pts
                        </ThemedText>
                      )}
                    </ThemedView>

                    <ThemedText style={styles.expandHint}>
                      {isMatchExpanded
                        ? "Toque para ocultar partida"
                        : "Toque para ver jogadores"}
                    </ThemedText>
                  </Pressable>

                  {isMatchExpanded && (
                    <ThemedView style={styles.details}>
                      {results.map((result, index) => {
                        const playerKey = `${match.id}-${result.player.id}`;
                        const isPlayerExpanded =
                          expandedPlayerKeys.includes(playerKey);

                        return (
                          <Pressable
                            key={result.player.id}
                            style={styles.resultCard}
                            onPress={() =>
                              togglePlayerExpanded(match.id, result.player.id)
                            }
                          >
                            <ThemedView style={styles.resultHeader}>
                              <ThemedText style={styles.position}>
                                {index + 1}º
                              </ThemedText>

                              <ThemedText style={styles.playerName}>
                                {result.player.name}
                              </ThemedText>

                              <ThemedText style={styles.total}>
                                {result.total} pts
                              </ThemedText>
                            </ThemedView>

                            <ThemedText style={styles.expandHint}>
                              {isPlayerExpanded
                                ? "Toque para ocultar detalhes"
                                : "Toque para ver detalhes"}
                            </ThemedText>

                            {isPlayerExpanded && (
                              <ThemedView style={styles.playerDetails}>
                                <ScoreRow
                                  label="Agentes"
                                  value={result.agentsCards}
                                />
                                <ScoreRow
                                  label="Operações"
                                  value={result.successfulOperations}
                                />
                                <ScoreRow
                                  label="Bônus por rodada"
                                  value={result.roundBonus}
                                />
                                <ScoreRow
                                  label="Moedas"
                                  value={result.coinsOnAgents}
                                />
                                <ScoreRow
                                  label="Recursos"
                                  value={result.storedResources}
                                />
                                <ScoreRow
                                  label="Capturas"
                                  value={result.capturedAgents}
                                />
                                <ScoreRow
                                  label="Bônus por equipe"
                                  value={result.teamBonus}
                                />
                              </ThemedView>
                            )}
                          </Pressable>
                        );
                      })}

                      <Pressable
                        style={styles.copyButton}
                        onPress={() => copyMatchToClipboard(match)}
                      >
                        <ThemedText style={styles.copyButtonText}>
                          Copiar para planilha
                        </ThemedText>
                      </Pressable>

                      <Pressable
                        style={styles.removeButton}
                        onPress={() => removeMatch(match.id)}
                      >
                        <ThemedText style={styles.removeButtonText}>
                          Remover do histórico
                        </ThemedText>
                      </Pressable>
                    </ThemedView>
                  )}
                </ThemedView>
              );
            })
          )}
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

type ScoreRowProps = {
  label: string;
  value: number;
};

function ScoreRow({ label, value }: ScoreRowProps) {
  return (
    <ThemedView style={styles.scoreRow}>
      <ThemedText style={styles.scoreLabel}>{label}</ThemedText>
      <ThemedText style={styles.scoreValue}>{value} pts</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  header: {
    gap: 6,
  },
  description: {
    opacity: 0.7,
  },
  emptyCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDDDDD",
  },
  emptyText: {
    opacity: 0.75,
    textAlign: "center",
  },
  matchCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    gap: 8,
  },
  matchHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  matchInfo: {
    flex: 1,
    gap: 4,
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  matchDate: {
    fontSize: 13,
    opacity: 0.65,
  },
  winnerScore: {
    fontSize: 17,
    fontWeight: "900",
  },
  expandHint: {
    fontSize: 13,
    opacity: 0.65,
  },
  details: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#DDDDDD",
    paddingTop: 8,
    marginTop: 4,
  },
  resultCard: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    gap: 6,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  position: {
    width: 34,
    fontSize: 16,
    fontWeight: "900",
  },
  playerName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  total: {
    fontSize: 15,
    fontWeight: "800",
  },
  playerDetails: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#DDDDDD",
    paddingTop: 8,
    marginTop: 4,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  scoreLabel: {
    fontSize: 14,
    opacity: 0.8,
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  removeButton: {
    backgroundColor: "#C62828",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  removeButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  copyButton: {
    backgroundColor: "#37474F",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  copyButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
