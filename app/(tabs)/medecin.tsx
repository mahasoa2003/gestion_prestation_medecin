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

  // ── États modal Ajout ──
  const [modalAddVisible, setModalAddVisible] = useState(false);
  const [formNom, setFormNom] = useState("");
  const [formJours, setFormJours] = useState("");
  const [formTaux, setFormTaux] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    nom?: string;
    jours?: string;
    taux?: string;
  }>({});

  // ── États modal Modification ──
  const [modalEditVisible, setModalEditVisible] = useState(false);
  const [editMedecin, setEditMedecin] = useState<Medecin | null>(null);
  const [editNom, setEditNom] = useState("");
  const [editJours, setEditJours] = useState("");
  const [editTaux, setEditTaux] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editErrors, setEditErrors] = useState<{
    nom?: string;
    jours?: string;
    taux?: string;
  }>({});

  // ── États modal Suppression ──
  const [modalDeleteVisible, setModalDeleteVisible] = useState(false);
  const [deleteMedecin, setDeleteMedecin] = useState<Medecin | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
        m.nom.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredMedecins(filtered);
    }
  };

  // ===========================
  //        AJOUT
  // ===========================
  const resetForm = () => {
    setFormNom("");
    setFormJours("");
    setFormTaux("");
    setFormErrors({});
  };

  const handleAdd = () => {
    resetForm();
    setModalAddVisible(true);
  };

  const validateForm = (
    nom: string,
    jours: string,
    taux: string,
    setErrors: (e: any) => void
  ): boolean => {
    const errors: { nom?: string; jours?: string; taux?: string } = {};
    if (!nom.trim()) errors.nom = "Le nom est obligatoire";
    if (!jours.trim() || isNaN(Number(jours)) || Number(jours) <= 0)
      errors.jours = "Veuillez entrer un nombre de jours valide";
    if (!taux.trim() || isNaN(Number(taux)) || Number(taux) <= 0)
      errors.taux = "Veuillez entrer un taux journalier valide";
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitAdd = async () => {
    if (!validateForm(formNom, formJours, formTaux, setFormErrors)) return;
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
                numed nom nbre_jours taux_journalier
              }
            }
          `,
        }),
      });
      const json = await response.json();
      if (json.errors) {
        Alert.alert("Erreur", json.errors[0]?.message || "Erreur lors de l'ajout");
        return;
      }
      await fetchMedecins();
      setModalAddVisible(false);
      resetForm();
      Alert.alert("Succès", "Médecin ajouté avec succès !");
    } catch (err) {
      Alert.alert("Erreur", "Impossible d'ajouter le médecin");
    } finally {
      setFormLoading(false);
    }
  };

  // ===========================
  //       MODIFICATION
  // ===========================
  const handleEdit = (medecin: Medecin) => {
    setEditMedecin(medecin);
    setEditNom(medecin.nom);
    setEditJours(String(medecin.nbre_jours));
    setEditTaux(String(medecin.taux_journalier));
    setEditErrors({});
    setModalEditVisible(true);
  };

  const handleSubmitEdit = async () => {
    if (!editMedecin) return;
    if (!validateForm(editNom, editJours, editTaux, setEditErrors)) return;
    try {
      setEditLoading(true);
      const response = await fetch("http://192.168.1.120:4000/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            mutation {
              updateMedecin(
                numed: ${editMedecin.numed},
                nom: "${editNom.trim()}",
                nbre_jours: ${Number(editJours)},
                taux_journalier: ${Number(editTaux)}
              ) {
                numed nom nbre_jours taux_journalier
              }
            }
          `,
        }),
      });
      const json = await response.json();
      if (json.errors) {
        Alert.alert("Erreur", json.errors[0]?.message || "Erreur lors de la modification");
        return;
      }
      await fetchMedecins();
      setModalEditVisible(false);
      setEditMedecin(null);
      Alert.alert("Succès", "Médecin modifié avec succès !");
    } catch (err) {
      Alert.alert("Erreur", "Impossible de modifier le médecin");
    } finally {
      setEditLoading(false);
    }
  };

  // ===========================
  //       SUPPRESSION
  // ===========================
  const handleDelete = (medecin: Medecin) => {
    setDeleteMedecin(medecin);
    setModalDeleteVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteMedecin) return;
    try {
      setDeleteLoading(true);
      const response = await fetch("http://192.168.1.120:4000/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            mutation {
              deleteMedecin(numed: ${deleteMedecin.numed})
            }
          `,
        }),
      });
      const json = await response.json();
      if (json.errors) {
        Alert.alert("Erreur", json.errors[0]?.message || "Erreur lors de la suppression");
        return;
      }
      await fetchMedecins();
      setModalDeleteVisible(false);
      setDeleteMedecin(null);
      Alert.alert("Succès", "Médecin supprimé avec succès !");
    } catch (err) {
      Alert.alert("Erreur", "Impossible de supprimer le médecin");
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalPrestation = medecins.reduce(
    (sum, m) => sum + calcPrestation(m.taux_journalier, m.nbre_jours),
    0
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement des médecins...</Text>
      </View>
    );
  }

  // ── Formulaire réutilisable (Ajout & Modification) ──
  const renderFormFields = (
    nom: string, setNom: (v: string) => void, errNom: string | undefined, setErr: (fn: (e: any) => any) => void,
    jours: string, setJours: (v: string) => void, errJours: string | undefined,
    taux: string, setTaux: (v: string) => void, errTaux: string | undefined,
  ) => (
    <>
      {/* Nom */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Nom du médecin *</Text>
        <TextInput
          style={[styles.input, errNom ? styles.inputError : null]}
          placeholder="Ex: Dr. Martin"
          placeholderTextColor="#aaa"
          value={nom}
          onChangeText={(t) => { setNom(t); if (errNom) setErr((e) => ({ ...e, nom: undefined })); }}
          autoCapitalize="words"
        />
        {errNom && <Text style={styles.errorText}>{errNom}</Text>}
      </View>

      {/* Jours */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Nombre de jours *</Text>
        <TextInput
          style={[styles.input, errJours ? styles.inputError : null]}
          placeholder="Ex: 10"
          placeholderTextColor="#aaa"
          value={jours}
          onChangeText={(t) => { setJours(t); if (errJours) setErr((e) => ({ ...e, jours: undefined })); }}
          keyboardType="numeric"
        />
        {errJours && <Text style={styles.errorText}>{errJours}</Text>}
      </View>

      {/* Taux */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Taux journalier (FCFA) *</Text>
        <TextInput
          style={[styles.input, errTaux ? styles.inputError : null]}
          placeholder="Ex: 50000"
          placeholderTextColor="#aaa"
          value={taux}
          onChangeText={(t) => { setTaux(t); if (errTaux) setErr((e) => ({ ...e, taux: undefined })); }}
          keyboardType="numeric"
        />
        {errTaux && <Text style={styles.errorText}>{errTaux}</Text>}
      </View>

      {/* Aperçu prestation */}
      {jours && taux && !isNaN(Number(jours)) && !isNaN(Number(taux)) && (
        <View style={styles.previewBox}>
          <Ionicons name="calculator-outline" size={16} color="#2E7D32" />
          <Text style={styles.previewText}>
            Prestation estimée :{" "}
            <Text style={styles.previewAmount}>
              {formatMontant(Number(jours) * Number(taux))}
            </Text>
          </Text>
        </View>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Médecins</Text>
        <TouchableOpacity onPress={handleAdd} style={styles.addHeaderButton}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Recherche */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un médecin..."
          value={search}
          onChangeText={handleSearch}
          placeholderTextColor="#888"
        />
      </View>

      {/* Tableau */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={styles.scrollContent}>
        <View>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.colId]}>N° MED</Text>
            <Text style={[styles.headerCell, styles.colNom]}>Nom</Text>
            <Text style={[styles.headerCell, styles.colJours]}>Jours</Text>
            <Text style={[styles.headerCell, styles.colTaux]}>Taux/jour</Text>
            <Text style={[styles.headerCell, styles.colPrestation]}>Prestation</Text>
            <Text style={[styles.headerCell, styles.colActions]}>Actions</Text>
          </View>

          <FlatList
            data={filteredMedecins}
            keyExtractor={(item) => item.numed.toString()}
            renderItem={({ item }) => {
              const prestation = calcPrestation(item.taux_journalier, item.nbre_jours);
              return (
                <View style={styles.row}>
                  <Text style={[styles.cell, styles.colId]}>#{String(item.numed).padStart(3, "0")}</Text>
                  <Text style={[styles.cell, styles.colNom]} numberOfLines={1}>{item.nom}</Text>
                  <Text style={[styles.cell, styles.colJours, styles.centerText]}>{item.nbre_jours}</Text>
                  <Text style={[styles.cell, styles.colTaux, styles.right]}>{formatMontant(item.taux_journalier)}</Text>
                  <Text style={[styles.cell, styles.colPrestation, styles.right, styles.prestation]}>{formatMontant(prestation)}</Text>
                  <View style={styles.actions}>
                    <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                      <Ionicons name="pencil" size={18} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                      <Ionicons name="trash" size={18} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={<Text style={styles.emptyText}>Aucun médecin trouvé</Text>}
            scrollEnabled={false}
          />

          {medecins.length > 0 && (
            <View style={[styles.row, styles.totalRow]}>
              <Text style={[styles.cell, styles.totalLabel]}>TOTAL PRESTATIONS</Text>
              <Text style={[styles.cell, styles.colPrestation, styles.right, styles.prestation]}>{formatMontant(totalPrestation)}</Text>
              <View style={styles.colActions} />
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleAdd}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* ===================== MODAL AJOUT ===================== */}
      <Modal visible={modalAddVisible} animationType="fade" transparent={true} onRequestClose={() => setModalAddVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un médecin</Text>
              <TouchableOpacity onPress={() => setModalAddVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              {renderFormFields(
                formNom, setFormNom, formErrors.nom, setFormErrors,
                formJours, setFormJours, formErrors.jours,
                formTaux, setFormTaux, formErrors.taux,
              )}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalAddVisible(false)} disabled={formLoading}>
                  <Text style={styles.cancelBtnText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.submitBtn, formLoading && styles.submitBtnDisabled]} onPress={handleSubmitAdd} disabled={formLoading}>
                  {formLoading ? <ActivityIndicator size="small" color="#fff" /> : (
                    <><Ionicons name="checkmark" size={18} color="#fff" /><Text style={styles.submitBtnText}>Enregistrer</Text></>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===================== MODAL MODIFICATION ===================== */}
      <Modal visible={modalEditVisible} animationType="fade" transparent={true} onRequestClose={() => setModalEditVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalHeader, styles.modalHeaderEdit]}>
              <Text style={styles.modalTitle}>Modifier le médecin</Text>
              <TouchableOpacity onPress={() => setModalEditVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              {/* Badge N° médecin */}
              {editMedecin && (
                <View style={styles.editBadge}>
                  <Ionicons name="person-circle-outline" size={18} color="#FF9500" />
                  <Text style={styles.editBadgeText}>
                    Médecin #{String(editMedecin.numed).padStart(3, "0")}
                  </Text>
                </View>
              )}
              {renderFormFields(
                editNom, setEditNom, editErrors.nom, setEditErrors,
                editJours, setEditJours, editErrors.jours,
                editTaux, setEditTaux, editErrors.taux,
              )}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalEditVisible(false)} disabled={editLoading}>
                  <Text style={styles.cancelBtnText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.submitBtn, styles.submitBtnEdit, editLoading && styles.submitBtnDisabled]} onPress={handleSubmitEdit} disabled={editLoading}>
                  {editLoading ? <ActivityIndicator size="small" color="#fff" /> : (
                    <><Ionicons name="save-outline" size={18} color="#fff" /><Text style={styles.submitBtnText}>Sauvegarder</Text></>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===================== MODAL SUPPRESSION ===================== */}
      <Modal visible={modalDeleteVisible} animationType="fade" transparent={true} onRequestClose={() => setModalDeleteVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.deleteContainer}>
            {/* Icône danger */}
            <View style={styles.deleteIconWrapper}>
              <Ionicons name="warning" size={40} color="#FF3B30" />
            </View>
            <Text style={styles.deleteTitle}>Confirmer la suppression</Text>
            {deleteMedecin && (
              <Text style={styles.deleteMessage}>
                Vous êtes sur le point de supprimer{"\n"}
                <Text style={styles.deleteName}>{deleteMedecin.nom}</Text>
                {"\n"}Cette action est irréversible.
              </Text>
            )}
            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalDeleteVisible(false)}
                disabled={deleteLoading}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteConfirmBtn, deleteLoading && styles.submitBtnDisabled]}
                onPress={handleConfirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? <ActivityIndicator size="small" color="#fff" /> : (
                  <><Ionicons name="trash-outline" size={18} color="#fff" /><Text style={styles.submitBtnText}>Supprimer</Text></>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },

  header: {
    backgroundColor: "#007AFF", flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, paddingTop: 50,
  },
  backButton: { padding: 8 },
  title: { fontSize: 20, fontWeight: "600", color: "#fff" },
  addHeaderButton: { padding: 8 },

  searchContainer: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    margin: 12, borderRadius: 12, paddingHorizontal: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 16 },
  scrollContent: { paddingHorizontal: 12, paddingBottom: 80 },

  tableHeader: {
    flexDirection: "row", backgroundColor: "#f1f1f1", borderTopLeftRadius: 8,
    borderTopRightRadius: 8, paddingVertical: 12, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: "#ddd",
  },
  headerCell: { fontWeight: "600", fontSize: 14, color: "#555" },
  row: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: "#eee",
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
  actions: { flexDirection: "row", gap: 8, width: 90, justifyContent: "flex-end" },
  actionBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: "#f0f0f0",
    justifyContent: "center", alignItems: "center",
  },
  totalRow: { backgroundColor: "#f8f9fa", borderTopWidth: 2, borderTopColor: "#ccc" },
  totalLabel: { fontWeight: "700", color: "#333", flex: 1 },
  fab: {
    position: "absolute", bottom: 24, right: 24, width: 60, height: 60,
    borderRadius: 30, backgroundColor: "#007AFF", justifyContent: "center",
    alignItems: "center", shadowColor: "#007AFF", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#666", fontSize: 16 },
  emptyText: { textAlign: "center", marginTop: 40, color: "#888", fontSize: 16 },

  // ── Modals communs ──
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center", paddingHorizontal: 0,
  },
  modalContainer: {
    backgroundColor: "#fff", borderRadius: 20,
    marginTop: 60, flex: 1,
  },
  modalHeader: {
    backgroundColor: "#007AFF", flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  modalHeaderEdit: { backgroundColor: "#FF9500" }, // Orange pour la modif
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  modalCloseBtn: { padding: 4 },
  modalBody: { padding: 20 },

  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: "600", color: "#555", marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: "#ddd", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16,
    color: "#1c1c1e", backgroundColor: "#fafafa",
  },
  inputError: { borderColor: "#FF3B30" },
  errorText: { color: "#FF3B30", fontSize: 12, marginTop: 4 },

  previewBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#e8f5e9", borderRadius: 10, padding: 12, marginBottom: 20,
  },
  previewText: { fontSize: 14, color: "#2E7D32" },
  previewAmount: { fontWeight: "700", fontSize: 15 },

  modalActions: { flexDirection: "row", gap: 12, marginBottom: 30 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: "#ddd", alignItems: "center",
  },
  cancelBtnText: { fontSize: 16, color: "#555", fontWeight: "600" },
  submitBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: "#007AFF",
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  submitBtnEdit: { backgroundColor: "#FF9500" }, // Orange pour la modif
  submitBtnDisabled: { backgroundColor: "#ccc" },
  submitBtnText: { fontSize: 16, color: "#fff", fontWeight: "700" },

  // Badge médecin en modification
  editBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FFF3E0", borderRadius: 10, padding: 10, marginBottom: 18,
  },
  editBadgeText: { fontSize: 14, fontWeight: "600", color: "#E65100" },

  // ── Modal Suppression ──
  deleteContainer: {
    backgroundColor: "#fff", marginHorizontal: 24, borderRadius: 20,
    padding: 28, alignItems: "center",
  },
  deleteIconWrapper: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#FFF0F0", justifyContent: "center",
    alignItems: "center", marginBottom: 16,
  },
  deleteTitle: { fontSize: 20, fontWeight: "700", color: "#1c1c1e", marginBottom: 12 },
  deleteMessage: {
    fontSize: 15, color: "#555", textAlign: "center", lineHeight: 22, marginBottom: 24,
  },
  deleteName: { fontWeight: "700", color: "#FF3B30" },
  deleteActions: { flexDirection: "row", gap: 12, width: "100%" },
  deleteConfirmBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: "#FF3B30",
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
});