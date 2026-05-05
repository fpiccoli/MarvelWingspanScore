import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet } from "react-native";

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

type CurrentMatch = {
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

const CURRENT_MATCH_STORAGE_KEY = "@marvel_wingspan_score_current_match";
const MATCH_HISTORY_STORAGE_KEY = "@marvel_wingspan_score_matches";

export default function ResultadoScreen() {
  const [currentMatch, setCurrentMatch] = useState<CurrentMatch | null>(null);
  const [expandedPlayerIds, setExpandedPlayerIds] = useState<string[]>([]);

  useEffect(() => {
    loadCurrentMatch();
  }, []);

  async function loadCurrentMatch() {
    try {
      const storedMatch = await AsyncStorage.getItem(CURRENT_MATCH_STORAGE_KEY);

      if (!storedMatch) {
        Alert.alert("Erro", "Nenhuma partida em andamento encontrada.");
        router.replace("/");
        return;
      }

      setCurrentMatch(JSON.parse(storedMatch));
    } catch {
      Alert.alert("Erro", "Não foi possível carregar o resultado.");
    }
  }

  function getScore(
    scoreMap: Record<string, number> | undefined,
    playerId: string,
  ) {
    return scoreMap?.[playerId] ?? 0;
  }

  function getRoundBonusTotal(playerId: string) {
    const rounds = currentMatch?.scores.roundBonusByRound ?? [];

    return rounds.reduce((total, round) => {
      return total + (round[playerId] ?? 0);
    }, 0);
  }

  function toggleExpanded(playerId: string) {
    setExpandedPlayerIds((current) =>
      current.includes(playerId)
        ? current.filter((id) => id !== playerId)
        : [...current, playerId],
    );
  }

  const results = useMemo<PlayerResult[]>(() => {
    const match = currentMatch;

    if (match === null) {
      return [];
    }

    return match.players
      .map((player) => {
        const rounds = match.scores.roundBonusByRound ?? [];

        const roundBonus = rounds.reduce((total, round) => {
          return total + (round[player.id] ?? 0);
        }, 0);

        const agentsCards = getScore(match.scores.agentsCards, player.id);
        const successfulOperations = getScore(
          match.scores.successfulOperations,
          player.id,
        );
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
  }, [currentMatch]);

  async function saveMatch() {
    if (!currentMatch) return;

    try {
      const storedHistory = await AsyncStorage.getItem(
        MATCH_HISTORY_STORAGE_KEY,
      );
      const history: CurrentMatch[] = storedHistory
        ? JSON.parse(storedHistory)
        : [];

      const finishedMatch: CurrentMatch = {
        ...currentMatch,
        scores: {
          ...currentMatch.scores,
          roundBonus: Object.fromEntries(
            currentMatch.players.map((player) => [
              player.id,
              getRoundBonusTotal(player.id),
            ]),
          ),
        },
      };

      await AsyncStorage.setItem(
        MATCH_HISTORY_STORAGE_KEY,
        JSON.stringify([finishedMatch, ...history]),
      );

      await AsyncStorage.removeItem(CURRENT_MATCH_STORAGE_KEY);

      Alert.alert("Partida salva", "O resultado foi salvo no histórico.");
      router.replace("/");
    } catch {
      Alert.alert("Erro", "Não foi possível salvar a partida.");
    }
  }

  function exitWithoutSaving() {
    Alert.alert(
      "Sair sem salvar",
      "Tem certeza que deseja sair sem salvar a partida?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem(CURRENT_MATCH_STORAGE_KEY);
            router.replace("/");
          },
        },
      ],
    );
  }

  if (!currentMatch) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Carregando resultado...</ThemedText>
      </ThemedView>
    );
  }

  const winner = results[0];

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Resultado final</ThemedText>

          {winner && (
            <ThemedText type="subtitle">
              Vencedor: {winner.player.name} — {winner.total} pts
            </ThemedText>
          )}
        </ThemedView>

        {results.map((result, index) => {
          const isExpanded = expandedPlayerIds.includes(result.player.id);

          return (
            <Pressable
              key={result.player.id}
              style={styles.resultCard}
              onPress={() => toggleExpanded(result.player.id)}
            >
              <ThemedView style={styles.resultHeader}>
                <ThemedText style={styles.position}>{index + 1}º</ThemedText>

                <ThemedText style={styles.playerName}>
                  {result.player.name}
                </ThemedText>

                <ThemedText style={styles.total}>{result.total} pts</ThemedText>
              </ThemedView>

              <ThemedText style={styles.expandHint}>
                {isExpanded
                  ? "Toque para ocultar detalhes"
                  : "Toque para ver detalhes"}
              </ThemedText>

              {isExpanded && (
                <ThemedView style={styles.details}>
                  <ScoreRow label="Agentes" value={result.agentsCards} />
                  <ScoreRow
                    label="Operações"
                    value={result.successfulOperations}
                  />
                  <ScoreRow
                    label="Bônus por rodada"
                    value={result.roundBonus}
                  />
                  <ScoreRow label="Moedas" value={result.coinsOnAgents} />
                  <ScoreRow label="Recursos" value={result.storedResources} />
                  <ScoreRow label="Capturas" value={result.capturedAgents} />
                  <ScoreRow label="Bônus por equipe" value={result.teamBonus} />
                </ThemedView>
              )}
            </Pressable>
          );
        })}

        <Pressable style={styles.saveButton} onPress={saveMatch}>
          <ThemedText style={styles.saveButtonText}>Salvar partida</ThemedText>
        </Pressable>

        <Pressable style={styles.exitButton} onPress={exitWithoutSaving}>
          <ThemedText style={styles.exitButtonText}>Sair sem salvar</ThemedText>
        </Pressable>
      </ThemedView>
    </ScrollView>
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
  loadingContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  header: {
    gap: 6,
  },
  resultCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    gap: 8,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  position: {
    fontSize: 18,
    fontWeight: "900",
    width: 34,
  },
  playerName: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
  },
  total: {
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
  saveButton: {
    backgroundColor: "#C62828",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  exitButton: {
    backgroundColor: "#455A64",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  exitButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
