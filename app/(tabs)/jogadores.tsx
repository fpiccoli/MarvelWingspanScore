import AsyncStorage from "@react-native-async-storage/async-storage";
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

const STORAGE_KEY = "@marvel_wingspan_score_players";

export default function JogadoresScreen() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerName, setPlayerName] = useState("");

  useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    try {
      const storedPlayers = await AsyncStorage.getItem(STORAGE_KEY);

      if (storedPlayers) {
        setPlayers(JSON.parse(storedPlayers));
      }
    } catch {
      Alert.alert("Erro", "Não foi possível carregar os jogadores.");
    }
  }

  async function savePlayers(updatedPlayers: Player[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlayers));
      setPlayers(updatedPlayers);
    } catch {
      Alert.alert("Erro", "Não foi possível salvar os jogadores.");
    }
  }

  function addPlayer() {
    const trimmedName = playerName.trim();

    if (!trimmedName) {
      Alert.alert("Atenção", "Digite o nome do jogador.");
      return;
    }

    const newPlayer: Player = {
      id: String(Date.now()),
      name: trimmedName,
    };

    savePlayers([...players, newPlayer]);
    setPlayerName("");
  }

  function removePlayer(playerId: string) {
    const updatedPlayers = players.filter((player) => player.id !== playerId);
    savePlayers(updatedPlayers);
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedView style={styles.container}>
          <ThemedText type="title">Jogadores</ThemedText>

          <ThemedView style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Nome do jogador"
              value={playerName}
              onChangeText={setPlayerName}
            />

            <Pressable style={styles.button} onPress={addPlayer}>
              <ThemedText style={styles.buttonText}>Adicionar</ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedView style={styles.list}>
            {players.length === 0 ? (
              <ThemedText style={styles.emptyText}>
                Nenhum jogador cadastrado ainda.
              </ThemedText>
            ) : (
              players.map((player) => (
                <ThemedView key={player.id} style={styles.playerCard}>
                  <ThemedText style={styles.playerName}>
                    {player.name}
                  </ThemedText>

                  <Pressable onPress={() => removePlayer(player.id)}>
                    <ThemedText style={styles.removeText}>Remover</ThemedText>
                  </Pressable>
                </ThemedView>
              ))
            )}
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CCCCCC",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#C62828",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  list: {
    gap: 8,
    paddingTop: 8,
  },
  emptyText: {
    opacity: 0.7,
    textAlign: "center",
    marginTop: 24,
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
  playerName: {
    fontSize: 16,
    fontWeight: "600",
  },
  removeText: {
    color: "#C62828",
    fontWeight: "700",
  },
  link: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "700",
  },
});
