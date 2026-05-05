import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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

type MatchScores = {
  agentsCards?: Record<string, number>;
};

type CurrentMatch = {
  id: string;
  date: string;
  players: Player[];
  roundBonusModel: RoundBonusModel;
  scores: MatchScores;
};

const CURRENT_MATCH_STORAGE_KEY = "@marvel_wingspan_score_current_match";

export default function PontuacaoEtapaScreen() {
  const { etapa } = useLocalSearchParams<{ etapa: string }>();

  const [currentMatch, setCurrentMatch] = useState<CurrentMatch | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});

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

      setCurrentMatch(parsedMatch);
      setScores(parsedMatch.scores.agentsCards ?? {});
    } catch {
      Alert.alert("Erro", "Não foi possível carregar a partida.");
    }
  }

  function updateScore(playerId: string, value: number) {
    const safeValue = Math.max(0, value);

    setScores((current) => ({
      ...current,
      [playerId]: safeValue,
    }));
  }

  function incrementScore(playerId: string) {
    updateScore(playerId, (scores[playerId] ?? 0) + 1);
  }

  function decrementScore(playerId: string) {
    updateScore(playerId, (scores[playerId] ?? 0) - 1);
  }

  function handleManualScore(playerId: string, text: string) {
    const numericText = text.replace(/[^0-9]/g, "");
    const value = numericText ? Number(numericText) : 0;

    updateScore(playerId, value);
  }

  async function saveAndContinue() {
    if (!currentMatch) return;

    const updatedMatch: CurrentMatch = {
      ...currentMatch,
      scores: {
        ...currentMatch.scores,
        agentsCards: scores,
      },
    };

    try {
      await AsyncStorage.setItem(
        CURRENT_MATCH_STORAGE_KEY,
        JSON.stringify(updatedMatch),
      );

      router.push("/partida/pontuacao/2");
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
            <ThemedText type="title">Etapa {etapa}</ThemedText>

            <ThemedText type="subtitle">Agentes recrutados</ThemedText>

            <ThemedText style={styles.description}>
              Some os pontos impressos em todos os agentes recrutados por cada
              jogador.
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.playersList}>
            {currentMatch.players.map((player) => {
              const playerScore = scores[player.id] ?? 0;

              return (
                <ThemedView key={player.id} style={styles.scoreCard}>
                  <ThemedText style={styles.playerName}>
                    {player.name}
                  </ThemedText>

                  <ThemedView style={styles.scoreControls}>
                    <Pressable
                      style={styles.smallButton}
                      onPress={() => decrementScore(player.id)}
                    >
                      <ThemedText style={styles.smallButtonText}>−</ThemedText>
                    </Pressable>

                    <TextInput
                      style={styles.scoreInput}
                      value={String(playerScore)}
                      onChangeText={(text) =>
                        handleManualScore(player.id, text)
                      }
                      keyboardType="number-pad"
                      selectTextOnFocus
                    />

                    <Pressable
                      style={styles.smallButton}
                      onPress={() => incrementScore(player.id)}
                    >
                      <ThemedText style={styles.smallButtonText}>+</ThemedText>
                    </Pressable>
                  </ThemedView>
                </ThemedView>
              );
            })}
          </ThemedView>

          <Pressable style={styles.nextButton} onPress={saveAndContinue}>
            <ThemedText style={styles.nextButtonText}>
              Salvar e avançar
            </ThemedText>
          </Pressable>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
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
    gap: 8,
  },
  scoreCard: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    gap: 8,
  },
  playerName: {
    fontSize: 16,
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
