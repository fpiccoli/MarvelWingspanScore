import { Link } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Marvel Wingspan
      </ThemedText>

      <ThemedText style={styles.subtitle}>Cálculo de Pontuação</ThemedText>

      <ThemedView style={styles.menu}>
        <Link href="/nova-partida" asChild>
          <Pressable style={styles.button}>
            <ThemedText style={styles.buttonText}>Nova partida</ThemedText>
          </Pressable>
        </Link>

        <Link href="/historico" asChild>
          <Pressable style={styles.buttonSecondary}>
            <ThemedText style={styles.buttonText}>
              Histórico de partidas
            </ThemedText>
          </Pressable>
        </Link>

        <Link href="/jogadores" asChild>
          <Pressable style={styles.buttonSecondary}>
            <ThemedText style={styles.buttonText}>
              Cadastrar jogadores
            </ThemedText>
          </Pressable>
        </Link>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    gap: 16,
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 24,
  },
  menu: {
    gap: 12,
  },
  button: {
    backgroundColor: "#C62828",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonSecondary: {
    backgroundColor: "#37474F",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
