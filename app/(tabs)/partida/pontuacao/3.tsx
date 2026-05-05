import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
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
  roundBonusByRound?: Record<string, number>[];
};

type CurrentMatch = {
  id: string;
  date: string;
  players: Player[];
  roundBonusModel: RoundBonusModel;
  scores: MatchScores;
};

type RoundSlot = {
  playerId?: string;
  rank: number;
};

type PickerState = {
  slotIndex: number;
} | null;

const CURRENT_MATCH_STORAGE_KEY = "@marvel_wingspan_score_current_match";

// Rodada 1
const ROUND_POINTS = [4, 1, 0, 0, 0, 0];

export default function Etapa3Rodada1Screen() {
  const [currentMatch, setCurrentMatch] = useState<CurrentMatch | null>(null);

  const [manualScores, setManualScores] = useState<Record<string, number>>({});
  const [slots, setSlots] = useState<RoundSlot[]>([]);
  const [pickerState, setPickerState] = useState<PickerState>(null);

  useEffect(() => {
    loadMatch();
  }, []);

  async function loadMatch() {
    try {
      const stored = await AsyncStorage.getItem(CURRENT_MATCH_STORAGE_KEY);

      if (!stored) {
        Alert.alert("Erro", "Partida não encontrada");
        router.replace("/");
        return;
      }

      const parsed: CurrentMatch = JSON.parse(stored);

      setCurrentMatch(parsed);

      // inicializa slots
      setSlots(
        parsed.players.map((_, index) => ({
          rank: index + 1,
        })),
      );
    } catch {
      Alert.alert("Erro", "Falha ao carregar partida");
    }
  }

  function updateManual(playerId: string, value: number) {
    setManualScores((prev) => ({
      ...prev,
      [playerId]: Math.max(0, value),
    }));
  }

  function handleManual(playerId: string, text: string) {
    const numeric = text.replace(/[^0-9]/g, "");
    updateManual(playerId, numeric ? Number(numeric) : 0);
  }

  function toggleTie(index: number) {
    if (index === 0) return;

    setSlots((prev) => {
      const updated = [...prev];
      const current = updated[index];
      const above = updated[index - 1];

      if (current.rank === above.rank) {
        current.rank = index + 1;
      } else {
        current.rank = above.rank;
      }

      return [...updated];
    });
  }

  function selectPlayer(playerId: string) {
    if (!pickerState) return;

    setSlots((prev) => {
      const updated = [...prev];
      updated[pickerState.slotIndex].playerId = playerId;
      return updated;
    });

    setPickerState(null);
  }

  function clearPlayer(index: number) {
    setSlots((prev) => {
      const updated = [...prev];
      updated[index].playerId = undefined;
      return updated;
    });
  }

  function getAvailablePlayers() {
    if (!currentMatch || !pickerState) return [];

    const selected = slots
      .map((s, i) => (i === pickerState.slotIndex ? undefined : s.playerId))
      .filter(Boolean);

    return currentMatch.players.filter((p) => !selected.includes(p.id));
  }

  function getPlayerName(id?: string) {
    if (!id || !currentMatch) return "Selecionar jogador";

    return (
      currentMatch.players.find((p) => p.id === id)?.name ??
      "Selecionar jogador"
    );
  }

  const bestScores = useMemo(() => {
    if (!currentMatch) return {};

    const totals: Record<string, number> = {};

    currentMatch.players.forEach((p) => {
      totals[p.id] = 0;
    });

    const grouped: Record<number, string[]> = {};

    slots.forEach((slot) => {
      if (!slot.playerId) return;

      if (!grouped[slot.rank]) grouped[slot.rank] = [];
      grouped[slot.rank].push(slot.playerId);
    });

    Object.entries(grouped).forEach(([rankText, ids]) => {
      const rank = Number(rankText);
      const start = rank - 1;
      const count = ids.length;

      let total = 0;

      for (let i = 0; i < count; i++) {
        total += ROUND_POINTS[start + i] ?? 0;
      }

      const value = Math.floor(total / count);

      ids.forEach((id) => {
        totals[id] += value;
      });
    });

    return totals;
  }, [slots, currentMatch]);

  async function saveAndContinue() {
    if (!currentMatch) return;

    const isBest = currentMatch.roundBonusModel === "best";

    const roundScore = isBest ? bestScores : manualScores;

    const updated: CurrentMatch = {
      ...currentMatch,
      scores: {
        ...currentMatch.scores,
        roundBonusByRound: [
          roundScore, // rodada 1
        ],
      },
    };

    await AsyncStorage.setItem(
      CURRENT_MATCH_STORAGE_KEY,
      JSON.stringify(updated),
    );

    router.push("/partida/pontuacao/4");
  }

  if (!currentMatch) {
    return (
      <ThemedView style={styles.loading}>
        <ThemedText>Carregando...</ThemedText>
      </ThemedView>
    );
  }

  const isBest = currentMatch.roundBonusModel === "best";
  const available = getAvailablePlayers();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ThemedView style={styles.container}>
          <ThemedText type="title">Rodada 1</ThemedText>

          {isBest ? (
            <>
              <ThemedText style={styles.rules}>
                1º: 4 pts | 2º: 1 pt | resto: 0
              </ThemedText>
              {slots.map((slot, index) => (
                <ThemedView key={index} style={styles.row}>
                  <Pressable
                    style={[
                      styles.rankBtn,
                      index > 0 &&
                        slot.rank === slots[index - 1].rank &&
                        styles.rankTie,
                    ]}
                    onPress={() => toggleTie(index)}
                  >
                    <ThemedText style={styles.rankText}>
                      {slot.rank}º
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    style={styles.playerBtn}
                    onPress={() => setPickerState({ slotIndex: index })}
                  >
                    <ThemedText>{getPlayerName(slot.playerId)}</ThemedText>
                  </Pressable>

                  {slot.playerId && (
                    <Pressable
                      style={styles.clear}
                      onPress={() => clearPlayer(index)}
                    >
                      <ThemedText style={{ color: "#fff" }}>×</ThemedText>
                    </Pressable>
                  )}
                </ThemedView>
              ))}

              <ThemedView style={styles.totalBox}>
                <ThemedText type="subtitle">Total da rodada</ThemedText>

                {currentMatch.players.map((p) => (
                  <ThemedView key={p.id} style={styles.totalRow}>
                    <ThemedText>{p.name}</ThemedText>
                    <ThemedText>{bestScores[p.id] ?? 0} pts</ThemedText>
                  </ThemedView>
                ))}
              </ThemedView>
            </>
          ) : (
            <ThemedView style={styles.playersList}>
              {currentMatch.players.map((p) => {
                const playerScore = manualScores[p.id] ?? 0;

                return (
                  <ThemedView key={p.id} style={styles.scoreCard}>
                    <ThemedText style={styles.playerName}>{p.name}</ThemedText>

                    <ThemedView style={styles.scoreControls}>
                      <Pressable
                        style={styles.smallButton}
                        onPress={() => updateManual(p.id, playerScore - 1)}
                      >
                        <ThemedText style={styles.smallButtonText}>
                          −
                        </ThemedText>
                      </Pressable>

                      <TextInput
                        style={styles.scoreInput}
                        value={String(playerScore)}
                        onChangeText={(text) => handleManual(p.id, text)}
                        keyboardType="number-pad"
                        selectTextOnFocus
                      />

                      <Pressable
                        style={styles.smallButton}
                        onPress={() => updateManual(p.id, playerScore + 1)}
                      >
                        <ThemedText style={styles.smallButtonText}>
                          +
                        </ThemedText>
                      </Pressable>
                    </ThemedView>
                  </ThemedView>
                );
              })}
            </ThemedView>
          )}

          <Pressable style={styles.next} onPress={saveAndContinue}>
            <ThemedText style={{ color: "#fff" }}>Avançar</ThemedText>
          </Pressable>
        </ThemedView>

        <Modal visible={!!pickerState} transparent animationType="fade">
          <Pressable
            style={styles.modalBg}
            onPress={() => setPickerState(null)}
          >
            <ThemedView style={styles.modal}>
              {available.map((p) => (
                <Pressable
                  key={p.id}
                  style={styles.option}
                  onPress={() => selectPlayer(p.id)}
                >
                  <ThemedText>{p.name}</ThemedText>
                </Pressable>
              ))}
            </ThemedView>
          </Pressable>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  container: { padding: 20, gap: 16 },
  loading: { flex: 1, justifyContent: "center", padding: 20 },
  rules: { opacity: 0.7 },
  row: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  rankBtn: {
    width: 50,
    height: 42,
    backgroundColor: "#37474F",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  rankTie: {
    backgroundColor: "#2E7D32",
  },
  rankText: { color: "#fff", fontWeight: "800" },
  playerBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
  },
  clear: {
    width: 34,
    height: 34,
    backgroundColor: "#C62828",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  totalBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  manualCard: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  input: {
    width: 80,
    borderWidth: 1,
    borderColor: "#ccc",
    textAlign: "center",
  },
  next: {
    backgroundColor: "#C62828",
    padding: 14,
    alignItems: "center",
    borderRadius: 10,
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  option: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
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
});
