import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

// Type pour un médecin
type Medecin = {
  numed: number;
  nom: string;
  nbre_jours: number;
  taux_journalier: number;
};

// Calcul de la prestation
const calcPrestation = (taux: number, jours: number) => taux * jours;

// Format monétaire
const formatMontant = (val: number) => val.toLocaleString("fr-FR") + " FCFA";

// ─── En-tête du tableau ────────────────────────────────────────────────────
const TableHeader = () => (
  <View style={styles.row}>
    <Text style={[styles.cell, styles.header, styles.colId]}>N° MED</Text>
    <Text style={[styles.cell, styles.header, styles.colNom]}>Nom</Text>
    <Text style={[styles.cell, styles.header, styles.colJours]}>Jours</Text>
    <Text style={[styles.cell, styles.header, styles.colTaux]}>Taux/jour</Text>
    <Text style={[styles.cell, styles.header, styles.colPrest]}>
      Prestation
    </Text>
  </View>
);

// ─── Ligne d'un médecin ────────────────────────────────────────────────────
const MedecinRow = ({ item }: { item: Medecin }) => {
  const prestation = calcPrestation(item.taux_journalier, item.nbre_jours);
  return (
    <View style={styles.row}>
      <Text style={[styles.cell, styles.colId, styles.numed]}>
        #{String(item.numed).padStart(3, "0")}
      </Text>
      <Text style={[styles.cell, styles.colNom]} numberOfLines={1}>
        {item.nom}
      </Text>
      <Text style={[styles.cell, styles.colJours, styles.center]}>
        {item.nbre_jours}
      </Text>
      <Text style={[styles.cell, styles.colTaux, styles.right]}>
        {formatMontant(item.taux_journalier)}
      </Text>
      <Text
        style={[styles.cell, styles.colPrest, styles.right, styles.prestation]}
      >
        {formatMontant(prestation)}
      </Text>
    </View>
  );
};

// ─── Composant principal ───────────────────────────────────────────────────
export default function MedecinsList() {
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMedecins();
  }, []);

  const fetchMedecins = async () => {
    try {
      setLoading(true);
      // 👇 Remplace cette URL par ton endpoint API réel
      //const response = await fetch("http://localhost:4000/");
      const response = await fetch("http://192.168.1.120:4000/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
          {
            medecins {
              numed
              nom
              nbre_jours
              taux_journalier
            }
          }
        `,
        }),
      });
      if (!response.ok) throw new Error("Erreur serveur");
      const responseJson = await response.json();
      const data: Medecin[] = responseJson.data.medecins;
      setMedecins(data);
    } catch (err) {
      setError("Impossible de charger les médecins.");
    } finally {
      setLoading(false);
    }
  };

  const totalPrestation = medecins.reduce(
    (sum, m) => sum + calcPrestation(m.taux_journalier, m.nbre_jours),
    0,
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#185FA5" />
        <Text style={styles.loadingText}>Chargement des médecins...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Liste des médecins</Text>

      {/* ScrollView horizontal pour les petits écrans */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <TableHeader />
          <FlatList
            data={medecins}
            keyExtractor={(item) => item.numed.toString()}
            renderItem={({ item }) => <MedecinRow item={item} />}
            ListEmptyComponent={
              <Text style={styles.empty}>Aucun médecin trouvé.</Text>
            }
            scrollEnabled={false} // Le scroll est géré par FlatList parente
          />
          {/* Ligne total */}
          {medecins.length > 0 && (
            <View style={[styles.row, styles.totalRow]}>
              <Text style={[styles.cell, styles.totalLabel]}>
                TOTAL PRESTATIONS
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.colPrest,
                  styles.right,
                  styles.prestation,
                ]}
              >
                {formatMontant(totalPrestation)}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#1a1a1a",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: { marginTop: 10, color: "#666" },
  errorText: { color: "#E24B4A", fontSize: 15, textAlign: "center" },
  empty: { padding: 20, textAlign: "center", color: "#888" },

  // Ligne du tableau
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e0e0e0",
    alignItems: "center",
  },
  header: {
    backgroundColor: "#f5f5f5",
    fontWeight: "600",
    fontSize: 11,
    color: "#666",
    textTransform: "uppercase",
  },
  totalRow: {
    backgroundColor: "#f5f5f5",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  totalLabel: {
    flex: 1,
    textAlign: "right",
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },

  // Cellule générique
  cell: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 13,
    color: "#1a1a1a",
  },

  // Colonnes
  colId: { width: 60 },
  colNom: { width: 150 },
  colJours: { width: 60 },
  colTaux: { width: 110 },
  colPrest: { width: 120 },

  // Styles spéciaux
  numed: { color: "#185FA5", fontWeight: "600", fontSize: 12 },
  prestation: { color: "#3B6D11", fontWeight: "600" },
  center: { textAlign: "center" },
  right: { textAlign: "right" },
});
