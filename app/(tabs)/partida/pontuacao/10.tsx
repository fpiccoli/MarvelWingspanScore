import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

type Player = {
  id: string;
  name: string;
};

type RoundBonusModel = "best" | "perItem";

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
  roundBonusModel: RoundBonusModel;
  scores: MatchScores;
};

const CURRENT_MATCH_STORAGE_KEY = "@marvel_wingspan_score_current_match";

const TEAM_BONUS_POINTS = {
  duo: 4,
  trio: 8,
  quartet: 12,
  quintet: 15,
};

function createEmptyCounts(): TeamBonusCounts {
  return {
    duo: 0,
    trio: 0,
    quartet: 0,
    quintet: 0,
  };
}

export default function PontuacaoEtapa10Screen() {
  const [currentMatch, setCurrentMatch] = useState<CurrentMatch | null>(null);
  const [counts, setCounts] = useState<Record<string, TeamBonusCounts>>({});

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

      const parsedMatch: CurrentMatch = JSON.parse(storedMatch);
      const initialCounts: Record<string, TeamBonusCounts> = {};

      parsedMatch.players.forEach((player) => {
        initialCounts[player.id] =
          parsedMatch.scores.teamBonusCounts?.[player.id] ??
          createEmptyCounts();
      });

      setCurrentMatch(parsedMatch);
      setCounts(initialCounts);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar a partida.");
    }
  }

  function updateCount(
    playerId: string,
    key: keyof TeamBonusCounts,
    value: number,
  ) {
    setCounts((current) => ({
      ...current,
      [playerId]: {
        ...(current[playerId] ?? createEmptyCounts()),
        [key]: Math.max(0, value),
      },
    }));
  }

  function handleManualCount(
    playerId: string,
    key: keyof TeamBonusCounts,
    text: string,
  ) {
    const numericText = text.replace(/[^0-9]/g, "");
    updateCount(playerId, key, numericText ? Number(numericText) : 0);
  }

  function calculatePlayerBonus(playerCounts: TeamBonusCounts) {
    return (
      playerCounts.duo * TEAM_BONUS_POINTS.duo +
      playerCounts.trio * TEAM_BONUS_POINTS.trio +
      playerCounts.quartet * TEAM_BONUS_POINTS.quartet +
      playerCounts.quintet * TEAM_BONUS_POINTS.quintet
    );
  }

  const teamBonusScores = useMemo(() => {
    if (!currentMatch) return {};

    const totals: Record<string, number> = {};

    currentMatch.players.forEach((player) => {
      totals[player.id] = calculatePlayerBonus(
        counts[player.id] ?? createEmptyCounts(),
      );
    });

    return totals;
  }, [counts, currentMatch]);

  async function saveAndContinue() {
    if (!currentMatch) return;

    const updatedMatch: CurrentMatch = {
      ...currentMatch,
      scores: {
        ...currentMatch.scores,
        teamBonusCounts: counts,
        teamBonus: teamBonusScores,
      },
    };

    try {
      await AsyncStorage.setItem(
        CURRENT_MATCH_STORAGE_KEY,
        JSON.stringify(updatedMatch),
      );

      router.push("/partida/resultado");
    } catch {
      Alert.alert("Erro", "Não foi possível salvar a pontuação.");
    }
  }

  if (!currentMatch) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Carregando partida...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedView style={styles.container}>
          <ThemedView style={styles.header}>
            <ThemedText type="title">Bônus de equipe</ThemedText>

            <ThemedText style={styles.description}>
              Agentes recrutados que sejam da mesma equipe.
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.playersList}>
            {currentMatch.players.map((player) => {
              const playerCounts = counts[player.id] ?? createEmptyCounts();

              return (
                <ThemedView key={player.id} style={styles.playerCard}>
                  <ThemedText style={styles.playerName}>
                    {player.name}
                  </ThemedText>

                  <ScoreCounter
                    label="Dupla"
                    points={4}
                    value={playerCounts.duo}
                    onDecrease={() =>
                      updateCount(player.id, "duo", playerCounts.duo - 1)
                    }
                    onIncrease={() =>
                      updateCount(player.id, "duo", playerCounts.duo + 1)
                    }
                    onChangeText={(text) =>
                      handleManualCount(player.id, "duo", text)
                    }
                  />

                  <ScoreCounter
                    label="Trio"
                    points={8}
                    value={playerCounts.trio}
                    onDecrease={() =>
                      updateCount(player.id, "trio", playerCounts.trio - 1)
                    }
                    onIncrease={() =>
                      updateCount(player.id, "trio", playerCounts.trio + 1)
                    }
                    onChangeText={(text) =>
                      handleManualCount(player.id, "trio", text)
                    }
                  />

                  <ScoreCounter
                    label="Quarteto"
                    points={12}
                    value={playerCounts.quartet}
                    onDecrease={() =>
                      updateCount(
                        player.id,
                        "quartet",
                        playerCounts.quartet - 1,
                      )
                    }
                    onIncrease={() =>
                      updateCount(
                        player.id,
                        "quartet",
                        playerCounts.quartet + 1,
                      )
                    }
                    onChangeText={(text) =>
                      handleManualCount(player.id, "quartet", text)
                    }
                  />

                  <ScoreCounter
                    label="Quinteto"
                    points={15}
                    value={playerCounts.quintet}
                    onDecrease={() =>
                      updateCount(
                        player.id,
                        "quintet",
                        playerCounts.quintet - 1,
                      )
                    }
                    onIncrease={() =>
                      updateCount(
                        player.id,
                        "quintet",
                        playerCounts.quintet + 1,
                      )
                    }
                    onChangeText={(text) =>
                      handleManualCount(player.id, "quintet", text)
                    }
                  />

                  <ThemedView style={styles.playerTotalRow}>
                    <ThemedText style={styles.playerTotalLabel}>
                      Total do jogador
                    </ThemedText>
                    <ThemedText style={styles.playerTotalPoints}>
                      {teamBonusScores[player.id] ?? 0} pts
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
              );
            })}
          </ThemedView>

          <ThemedView style={styles.totalBox}>
            <ThemedText type="subtitle">Total da etapa</ThemedText>

            {currentMatch.players.map((player) => (
              <ThemedView key={player.id} style={styles.totalRow}>
                <ThemedText style={styles.playerName}>{player.name}</ThemedText>
                <ThemedText style={styles.totalPoints}>
                  {teamBonusScores[player.id] ?? 0} pts
                </ThemedText>
              </ThemedView>
            ))}
          </ThemedView>

          <Pressable style={styles.nextButton} onPress={saveAndContinue}>
            <ThemedText style={styles.nextButtonText}>Resultado</ThemedText>
          </Pressable>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

type ScoreCounterProps = {
  label: string;
  points: number;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  onChangeText: (text: string) => void;
};

function ScoreCounter({
  label,
  points,
  value,
  onDecrease,
  onIncrease,
  onChangeText,
}: ScoreCounterProps) {
  return (
    <ThemedView style={styles.counterBlock}>
      <ThemedView style={styles.counterHeader}>
        <ThemedText style={styles.counterLabel}>{label}</ThemedText>
        <ThemedText style={styles.counterPoints}>{points} pts cada</ThemedText>
      </ThemedView>

      <ThemedView style={styles.scoreControls}>
        <Pressable style={styles.smallButton} onPress={onDecrease}>
          <ThemedText style={styles.smallButtonText}>−</ThemedText>
        </Pressable>

        <TextInput
          style={styles.scoreInput}
          value={String(value)}
          onChangeText={onChangeText}
          keyboardType="number-pad"
          selectTextOnFocus
        />

        <Pressable style={styles.smallButton} onPress={onIncrease}>
          <ThemedText style={styles.smallButtonText}>+</ThemedText>
        </Pressable>
      </ThemedView>
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
    gap: 18,
  },
  header: {
    gap: 6,
  },
  description: {
    opacity: 0.7,
    lineHeight: 20,
  },
  playersList: {
    gap: 10,
  },
  playerCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    gap: 10,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "700",
  },
  counterBlock: {
    gap: 6,
  },
  counterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  counterLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  counterPoints: {
    fontSize: 13,
    opacity: 0.7,
    fontWeight: "700",
  },
  scoreControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  smallButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#37474F",
    alignItems: "center",
    justifyContent: "center",
  },
  smallButtonText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },
  scoreInput: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    backgroundColor: "#FFFFFF",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
  },
  playerTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#DDDDDD",
    paddingTop: 10,
  },
  playerTotalLabel: {
    fontSize: 15,
    fontWeight: "800",
  },
  playerTotalPoints: {
    fontSize: 15,
    fontWeight: "800",
  },
  totalBox: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalPoints: {
    fontSize: 15,
    fontWeight: "800",
  },
  nextButton: {
    backgroundColor: "#C62828",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
