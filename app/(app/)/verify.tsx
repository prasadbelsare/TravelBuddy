import { AccordionItem } from "@/components/AccordionItem";
import { groqService } from "@/services/groqService";
import { FlightDetails } from "@/types";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VerifyScreen() {
  const { base64, mimeType } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [submitting] = useState(false);
  const [error, setError] = useState("");
  const [flights, setFlights] = useState<FlightDetails[]>([]);

  useEffect(() => {
    if (!base64) {
      Alert.alert("Error", "No ticket provided to extract.");
      router.back();
      return;
    }
    extractTicketDetails();
  }, [base64]);

  const extractTicketDetails = async () => {
    try {
      const extracted = await groqService.extractFlightDetails(
        base64 as string,
        mimeType as string,
      );
      setFlights(extracted);
    } catch (err) {
      setError(
        "Could not read ticket fully. Please verify and correct the details below.",
      );
      setFlights([emptyFlight()]);
    } finally {
      setLoading(false);
    }
  };

  const emptyFlight = (): FlightDetails => ({
    flight_number: "",
    from: "",
    from_code: "",
    to: "",
    to_code: "",
    date: "",
    departure_time: "",
    arrival_time: "",
    terminal: "",
    gate: "",
    seat: "",
    class: "",
    baggage_allowance: "",
  });

  const updateFlight = (
    index: number,
    field: keyof FlightDetails,
    value: string,
  ) => {
    setFlights((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)),
    );
  };

  const addFlight = () => setFlights((prev) => [...prev, emptyFlight()]);
  const removeFlight = (index: number) => {
    if (flights.length > 1)
      setFlights((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const firstFlight = flights[0];
    if (!firstFlight.from || !firstFlight.to || !firstFlight.flight_number) {
      Alert.alert(
        "Missing details",
        "Please enter at least an origin, destination, and flight number.",
      );
      return;
    }
    router.push({
      pathname: "/(app/)/trip/[id]",
      params: { id: "new", allFlights: JSON.stringify(flights) },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingTitle}>Reading ticket...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify Details</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View style={styles.warningBox}>
            <Feather name="alert-triangle" size={16} color="#FDE68A" />
            <Text style={styles.warningText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.infoBox}>
            <Feather name="check-circle" size={16} color="#86EFAC" />
            <Text style={styles.infoText}>
              Ticket extracted successfully. Please verify.
            </Text>
          </View>
        )}

        {flights.map((flight, index) => (
          <AccordionItem
            key={index}
            title={`Leg ${index + 1}: ${flight.from_code || "Unknown"} → ${flight.to_code || "Unknown"}`}
            icon="send"
            defaultExpanded={index === 0}
          >
            {flights.length > 1 && (
              <TouchableOpacity
                style={styles.deleteLegBtn}
                onPress={() => removeFlight(index)}
              >
                <Feather name="trash-2" size={14} color="#EF4444" />
                <Text style={styles.deleteLegText}>Remove Leg</Text>
              </TouchableOpacity>
            )}

            <View style={styles.formGrid}>
              <View style={styles.row}>
                <FloatingInput
                  label="From City"
                  value={flight.from}
                  onChangeText={(v) => updateFlight(index, "from", v)}
                />
                <FloatingInput
                  label="To City"
                  value={flight.to}
                  onChangeText={(v) => updateFlight(index, "to", v)}
                />
              </View>
              <View style={styles.row}>
                <FloatingInput
                  label="From Code"
                  value={flight.from_code}
                  onChangeText={(v) => updateFlight(index, "from_code", v)}
                />
                <FloatingInput
                  label="To Code"
                  value={flight.to_code}
                  onChangeText={(v) => updateFlight(index, "to_code", v)}
                />
              </View>
              <View style={styles.row}>
                <FloatingInput
                  label="Flight No."
                  value={flight.flight_number}
                  onChangeText={(v) => updateFlight(index, "flight_number", v)}
                />
                <FloatingInput
                  label="Date"
                  value={flight.date}
                  onChangeText={(v) => updateFlight(index, "date", v)}
                />
              </View>
              <View style={styles.row}>
                <FloatingInput
                  label="Departs"
                  value={flight.departure_time}
                  onChangeText={(v) => updateFlight(index, "departure_time", v)}
                />
                <FloatingInput
                  label="Arrives"
                  value={flight.arrival_time}
                  onChangeText={(v) => updateFlight(index, "arrival_time", v)}
                />
              </View>
            </View>
          </AccordionItem>
        ))}

        <TouchableOpacity style={styles.addFlightButton} onPress={addFlight}>
          <Feather name="plus" size={18} color="#6366F1" />
          <Text style={styles.addFlightText}>Add connecting flight</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Generate Itinerary</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- NEW FLOATING INPUT COMPONENT ---
function FloatingInput({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const isActive = isFocused || value.length > 0;

  return (
    <View style={[styles.inputWrapper, isActive && styles.inputWrapperActive]}>
      <Text
        style={[styles.floatingLabel, isActive && styles.floatingLabelActive]}
      >
        {label}
      </Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor="transparent"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingTitle: { fontSize: 18, fontWeight: "600", color: "#FFFFFF" },
  container: { flex: 1, backgroundColor: "#0F172A" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
  },
  iconBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40, gap: 16 },

  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#422006",
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "#854D0E",
  },
  warningText: { color: "#FDE68A", fontSize: 13, flex: 1 },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#052E16",
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "#166534",
  },
  infoText: { color: "#86EFAC", fontSize: 13, flex: 1 },

  deleteLegBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-end",
    marginBottom: 16,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteLegText: { color: "#EF4444", fontSize: 12, fontWeight: "600" },

  formGrid: { gap: 12 },
  row: { flexDirection: "row", gap: 12 },

  inputWrapper: {
    flex: 1,
    height: 56,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  inputWrapperActive: {
    borderColor: "#6366F1",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
  },
  floatingLabel: {
    position: "absolute",
    left: 16,
    top: 18,
    color: "#64748B",
    fontSize: 14,
  },
  floatingLabelActive: {
    top: 8,
    fontSize: 10,
    color: "#818CF8",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    paddingTop: 16,
    outlineStyle: "none" as any,
  },

  addFlightButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#334155",
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 16,
  },
  addFlightText: { color: "#818CF8", fontSize: 15, fontWeight: "600" },

  footer: { padding: 24, paddingTop: 12 },
  submitButton: {
    backgroundColor: "#6366F1",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  submitButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
