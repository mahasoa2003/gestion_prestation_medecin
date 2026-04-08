import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type Medecin = {
  numed: number;
  nom: string;
  nbre_jours: number;
  taux_journalier: number;
};

const calcPrestation = (taux: number, jours: number) => taux * jours;
const formatMontant = (val: number) => val.toLocaleString("fr-FR") + " FCFA";

export default function MedecinsList() {
  const router = useRouter();

  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [filteredMedecins, setFilteredMedecins] = useState<Medecin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // États du formulaire d'ajout
  const [modalVisible, setModalVisible] = useState(false);
  const [formNom, setFormNom] = useState("");
  const [formJours, setFormJours] = useState("");
  const [formTaux, setFormTaux] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    nom?: string;
    jours?: string;
    taux?: string;
  }>({});

  useEffect(() => {
    fetchMedecins();
  }, []);

  const fetchMedecins = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://192.168.1.120:4000/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      const json = await response.json();
      const data: Medecin[] = json.data?.medecins || [];
      setMedecins(data);
      setFilteredMedecins(data);
    } catch (err) {
      Alert.alert("Erreur", "Impossible de charger les médecins");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text.trim()) {
      setFilteredMedecins(medecins);
    } else {
      const filtered = medecins.filter((m) =>
        m.nom.toLowerCase().includes(text.toLowerCase()),
      );
      setFilteredMedecins(filtered);
    }
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormNom("");
    setFormJours("");
    setFormTaux("");
    setFormErrors({});
  };

  // Ouvrir le modal
  const handleAdd = () => {
    resetForm();
    setModalVisible(true);
  };

  // Valider les champs
  const validateForm = (): boolean => {
    const errors: { nom?: string; jours?: string; taux?: string } = {};

    if (!formNom.trim()) {
      errors.nom = "Le nom est obligatoire";
    }
    if (
      !formJours.trim() ||
      isNaN(Number(formJours)) ||
      Number(formJours) <= 0
    ) {
      errors.jours = "Veuillez entrer un nombre de jours valide";
    }
    if (!formTaux.trim() || isNaN(Number(formTaux)) || Number(formTaux) <= 0) {
      errors.taux = "Veuillez entrer un taux journalier valide";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Soumettre le formulaire
  const handleSubmitAdd = async () => {
    if (!validateForm()) return;

    try {
      setFormLoading(true);

      const response = await fetch("http://192.168.1.120:4000/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
    mutation {
      createMedecin(
        nom: "${formNom.trim()}",
        nbre_jours: ${Number(formJours)},
        taux_journalier: ${Number(formTaux)}
      ) {
        numed
        nom
        nbre_jours
        taux_journalier
      }
    }
  `,
        }),
      });

      const json = await response.json();

      if (json.errors) {
        Alert.alert(
          "Erreur",
          json.errors[0]?.message || "Erreur lors de l'ajout",
        );
        return;
      }

      // Rafraîchir la liste
      await fetchMedecins();
      setModalVisible(false);
      resetForm();
      Alert.alert("Succès", "Médecin ajouté avec succès !");
    } catch (err) {
      Alert.alert("Erreur", "Impossible d'ajouter le médecin");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (medecin: Medecin) => {
    Alert.alert("Modifier", `Modifier ${medecin.nom}`);
  };

  const handleDelete = (medecin: Medecin) => {
    Alert.alert(
      "Supprimer",
      `Voulez-vous vraiment supprimer ${medecin.nom} ?`,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive" },
      ],
    );
  };

  const totalPrestation = medecins.reduce(
    (sum, m) => sum + calcPrestation(m.taux_journalier, m.nbre_jours),
    0,
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement des médecins...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* En-tête bleu */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Médecins</Text>
        <TouchableOpacity onPress={handleAdd} style={styles.addHeaderButton}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#888"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un médecin..."
          value={search}
          onChangeText={handleSearch}
          placeholderTextColor="#888"
        />
      </View>

      {/* Tableau */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        <View>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.colId]}>N° MED</Text>
            <Text style={[styles.headerCell, styles.colNom]}>Nom</Text>
            <Text style={[styles.headerCell, styles.colJours]}>Jours</Text>
            <Text style={[styles.headerCell, styles.colTaux]}>Taux/jour</Text>
            <Text style={[styles.headerCell, styles.colPrestation]}>
              Prestation
            </Text>
            <Text style={[styles.headerCell, styles.colActions]}>Actions</Text>
          </View>

          <FlatList
            data={filteredMedecins}
            keyExtractor={(item) => item.numed.toString()}
            renderItem={({ item }) => {
              const prestation = calcPrestation(
                item.taux_journalier,
                item.nbre_jours,
              );
              return (
                <View style={styles.row}>
                  <Text style={[styles.cell, styles.colId]}>
                    #{String(item.numed).padStart(3, "0")}
                  </Text>
                  <Text style={[styles.cell, styles.colNom]} numberOfLines={1}>
                    {item.nom}
                  </Text>
                  <Text
                    style={[styles.cell, styles.colJours, styles.centerText]}
                  >
                    {item.nbre_jours}
                  </Text>
                  <Text style={[styles.cell, styles.colTaux, styles.right]}>
                    {formatMontant(item.taux_journalier)}
                  </Text>
                  <Text
                    style={[
                      styles.cell,
                      styles.colPrestation,
                      styles.right,
                      styles.prestation,
                    ]}
                  >
                    {formatMontant(prestation)}
                  </Text>
                  <View style={styles.actions}>
                    <TouchableOpacity
                      onPress={() => handleEdit(item)}
                      style={styles.actionBtn}
                    >
                      <Ionicons name="pencil" size={18} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(item)}
                      style={styles.actionBtn}
                    >
                      <Ionicons name="trash" size={18} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Aucun médecin trouvé</Text>
            }
            scrollEnabled={false}
          />

          {medecins.length > 0 && (
            <View style={[styles.row, styles.totalRow]}>
              <Text style={[styles.cell, styles.totalLabel]}>
                TOTAL PRESTATIONS
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.colPrestation,
                  styles.right,
                  styles.prestation,
                ]}
              >
                {formatMontant(totalPrestation)}
              </Text>
              <View style={styles.colActions} />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bouton FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleAdd}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* ===================== MODAL FORMULAIRE D'AJOUT ===================== */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalContainer}>
            {/* Header du modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un médecin</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              keyboardShouldPersistTaps="handled"
            >
              {/* Champ Nom */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  <Ionicons name="person-outline" size={14} color="#555" /> Nom
                  du médecin *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    formErrors.nom ? styles.inputError : null,
                  ]}
                  placeholder="Ex: Dr. Martin"
                  placeholderTextColor="#aaa"
                  value={formNom}
                  onChangeText={(t) => {
                    setFormNom(t);
                    if (formErrors.nom)
                      setFormErrors((e) => ({ ...e, nom: undefined }));
                  }}
                  autoCapitalize="words"
                />
                {formErrors.nom && (
                  <Text style={styles.errorText}>{formErrors.nom}</Text>
                )}
              </View>

              {/* Champ Nombre de jours */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  <Ionicons name="calendar-outline" size={14} color="#555" />{" "}
                  Nombre de jours *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    formErrors.jours ? styles.inputError : null,
                  ]}
                  placeholder="Ex: 10"
                  placeholderTextColor="#aaa"
                  value={formJours}
                  onChangeText={(t) => {
                    setFormJours(t);
                    if (formErrors.jours)
                      setFormErrors((e) => ({ ...e, jours: undefined }));
                  }}
                  keyboardType="numeric"
                />
                {formErrors.jours && (
                  <Text style={styles.errorText}>{formErrors.jours}</Text>
                )}
              </View>

              {/* Champ Taux journalier */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  <Ionicons name="cash-outline" size={14} color="#555" /> Taux
                  journalier (FCFA) *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    formErrors.taux ? styles.inputError : null,
                  ]}
                  placeholder="Ex: 50000"
                  placeholderTextColor="#aaa"
                  value={formTaux}
                  onChangeText={(t) => {
                    setFormTaux(t);
                    if (formErrors.taux)
                      setFormErrors((e) => ({ ...e, taux: undefined }));
                  }}
                  keyboardType="numeric"
                />
                {formErrors.taux && (
                  <Text style={styles.errorText}>{formErrors.taux}</Text>
                )}
              </View>

              {/* Aperçu de la prestation */}
              {formJours &&
                formTaux &&
                !isNaN(Number(formJours)) &&
                !isNaN(Number(formTaux)) && (
                  <View style={styles.previewBox}>
                    <Ionicons
                      name="calculator-outline"
                      size={16}
                      color="#2E7D32"
                    />
                    <Text style={styles.previewText}>
                      Prestation estimée :{" "}
                      <Text style={styles.previewAmount}>
                        {formatMontant(Number(formJours) * Number(formTaux))}
                      </Text>
                    </Text>
                  </View>
                )}

              {/* Boutons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                  disabled={formLoading}
                >
                  <Text style={styles.cancelBtnText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    formLoading && styles.submitBtnDisabled,
                  ]}
                  onPress={handleSubmitAdd}
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={18} color="#fff" />
                      <Text style={styles.submitBtnText}>Enregistrer</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },

  header: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 50,
  },
  backButton: { padding: 8 },
  title: { fontSize: 20, fontWeight: "600", color: "#fff" },
  addHeaderButton: { padding: 8 },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 16 },

  scrollContent: { paddingHorizontal: 12, paddingBottom: 80 },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f1f1",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerCell: { fontWeight: "600", fontSize: 14, color: "#555" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  cell: { fontSize: 15, color: "#1c1c1e" },

  colId: { width: 80 },
  colNom: { flex: 1, minWidth: 160 },
  colJours: { width: 80, textAlign: "center" },
  colTaux: { width: 120, textAlign: "right" },
  colPrestation: { width: 140, textAlign: "right" },
  colActions: { width: 90, textAlign: "right" },
  right: { textAlign: "right" },
  centerText: { textAlign: "center" },
  prestation: { color: "#2E7D32", fontWeight: "600" },

  actions: {
    flexDirection: "row",
    gap: 8,
    width: 90,
    justifyContent: "flex-end",
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },

  totalRow: {
    backgroundColor: "#f8f9fa",
    borderTopWidth: 2,
    borderTopColor: "#ccc",
  },
  totalLabel: { fontWeight: "700", color: "#333", flex: 1 },

  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#666", fontSize: 16 },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#888",
    fontSize: 16,
  },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  modalCloseBtn: { padding: 4 },
  modalBody: { padding: 20 },

  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: "600", color: "#555", marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1c1c1e",
    backgroundColor: "#fafafa",
  },
  inputError: { borderColor: "#FF3B30" },
  errorText: { color: "#FF3B30", fontSize: 12, marginTop: 4 },

  previewBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#e8f5e9",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  previewText: { fontSize: 14, color: "#2E7D32" },
  previewAmount: { fontWeight: "700", fontSize: 15 },

  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 30,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#ddd",
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 16, color: "#555", fontWeight: "600" },
  submitBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitBtnDisabled: { backgroundColor: "#90c4ff" },
  submitBtnText: { fontSize: 16, color: "#fff", fontWeight: "700" },
});
