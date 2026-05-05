import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

type Player = {
  id: string;
  name: string;
};

type RoundBonusModel = "best" | "perItem";

type CurrentMatch = {
  id: string;
  date: string;
  players: Player[];
  roundBonusModel: RoundBonusModel;
  scores: {};
};

const PLAYERS_STORAGE_KEY = "@marvel_wingspan_score_players";
const CURRENT_MATCH_STORAGE_KEY = "@marvel_wingspan_score_current_match";

export default function NovaPartidaScreen() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [roundBonusModel, setRoundBonusModel] =
    useState<RoundBonusModel>("best");

  const isValidPlayerCount =
    selectedPlayerIds.length >= 2 && selectedPlayerIds.length <= 6;

  useFocusEffect(
    useCallback(() => {
      loadPlayers();
    }, []),
  );

  async function loadPlayers() {
    try {
      const storedPlayers = await AsyncStorage.getItem(PLAYERS_STORAGE_KEY);

      if (storedPlayers) {
        setPlayers(JSON.parse(storedPlayers));
      }
    } catch {
      Alert.alert("Erro", "Não foi possível carregar os jogadores.");
    }
  }

  function togglePlayer(playerId: string) {
    const isSelected = selectedPlayerIds.includes(playerId);

    if (isSelected) {
      setSelectedPlayerIds((current) =>
        current.filter((id) => id !== playerId),
      );
      return;
    }

    if (selectedPlayerIds.length >= 6) {
      Alert.alert("Limite atingido", "Máximo de 6 jogadores.");
      return;
    }

    setSelectedPlayerIds((current) => [...current, playerId]);
  }

  async function startMatch() {
    if (!isValidPlayerCount) {
      Alert.alert("Atenção", "Selecione de 2 a 6 jogadores.");
      return;
    }

    const selectedPlayers = players.filter((player) =>
      selectedPlayerIds.includes(player.id),
    );

    const currentMatch: CurrentMatch = {
      id: String(Date.now()),
      date: new Date().toISOString(),
      players: selectedPlayers,
      roundBonusModel,
      scores: {},
    };

    try {
      await AsyncStorage.setItem(
        CURRENT_MATCH_STORAGE_KEY,
        JSON.stringify(currentMatch),
      );

      router.push("/partida/pontuacao/1");
    } catch {
      Alert.alert("Erro", "Não foi possível iniciar a partida.");
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedView style={styles.container}>
          <ThemedText type="title">Nova partida</ThemedText>

          <ThemedText style={styles.helperText}>
            Selecione de 2 a 6 jogadores.
          </ThemedText>

          <ThemedView style={styles.list}>
            {players.length === 0 ? (
              <ThemedText style={styles.emptyText}>
                Nenhum jogador cadastrado ainda.
              </ThemedText>
            ) : (
              players.map((item) => {
                const isSelected = selectedPlayerIds.includes(item.id);

                return (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.playerCard,
                      isSelected && styles.playerCardSelected,
                    ]}
                    onPress={() => togglePlayer(item.id)}
                  >
                    <ThemedText style={styles.playerName}>
                      {item.name}
                    </ThemedText>

                    <ThemedText
                      style={[
                        styles.selectionText,
                        isSelected && styles.selectionTextSelected,
                      ]}
                    >
                      {isSelected ? "Selecionado" : "Selecionar"}
                    </ThemedText>
                  </Pressable>
                );
              })
            )}
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Modelo de bônus por rodada</ThemedText>

            <Pressable
              style={[
                styles.bonusOption,
                roundBonusModel === "best" && styles.bonusOptionSelected,
              ]}
              onPress={() => setRoundBonusModel("best")}
            >
              <ThemedText style={styles.bonusTitle}>
                Pontos para o melhor
              </ThemedText>
              <ThemedText style={styles.bonusDescription}>
                Pontua conforme a posição de cada jogador: primeiro, segundo,
                terceiro, empates, etc.
              </ThemedText>
            </Pressable>

            <Pressable
              style={[
                styles.bonusOption,
                roundBonusModel === "perItem" && styles.bonusOptionSelected,
              ]}
              onPress={() => setRoundBonusModel("perItem")}
            >
              <ThemedText style={styles.bonusTitle}>Pontos por item</ThemedText>
              <ThemedText style={styles.bonusDescription}>
                Cada jogador recebe pontos pelo próprio resultado, sem comparar
                com os outros jogadores.
              </ThemedText>
            </Pressable>
          </ThemedView>

          <Pressable
            style={[
              styles.startButton,
              !isValidPlayerCount && styles.startButtonDisabled,
            ]}
            onPress={startMatch}
            disabled={!isValidPlayerCount}
          >
            <ThemedText style={styles.startButtonText}>
              Iniciar contagem
            </ThemedText>
          </Pressable>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 24,
  },
  helperText: {
    opacity: 0.7,
  },
  section: {
    gap: 12,
  },
  list: {
    gap: 8,
  },
  emptyText: {
    opacity: 0.7,
    textAlign: "center",
    marginTop: 12,
  },
  playerCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  playerCardSelected: {
    borderColor: "#2E7D32",
    backgroundColor: "rgba(46, 125, 50, 0.1)",
  },
  playerName: {
    fontSize: 16,
    fontWeight: "700",
  },
  selectionText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#B71C1C",
    opacity: 0.8,
  },
  selectionTextSelected: {
    color: "#1B5E20",
    opacity: 1,
  },
  bonusOption: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    gap: 4,
  },
  bonusOptionSelected: {
    borderColor: "#2E7D32",
    backgroundColor: "rgba(46, 125, 50, 0.1)",
  },
  bonusTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  bonusDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  startButton: {
    backgroundColor: "#C62828",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  startButtonDisabled: {
    backgroundColor: "#B0BEC5",
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  scrollContainer: {
    flexGrow: 1,
  },
});
