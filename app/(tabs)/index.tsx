import React from "react";
import { StyleSheet } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Image } from "expo-image";

// 👇 IMPORT DE TON COMPOSANT
import MedecinsList from "@/components/myComponents/MedecinList";

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={{ width: "100%", height: 200 }}
        />
      }
    >
      <ThemedView style={styles.container}>
        <ThemedText type="title">Liste des médecins</ThemedText>

        {/* 👇 TON COMPOSANT */}
        <MedecinsList />
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
});
