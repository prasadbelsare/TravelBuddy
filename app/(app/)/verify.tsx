import { groqService } from "@/services/groqService";
import { FlightDetails } from "@/types";
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [flights, setFlights] = useState<FlightDetails[]>([]);

  useEffect(() => {
    extractTicketDetails();
  }, []);

  const extractTicketDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const extracted = await groqService.extractFlightDetails(
        base64 as string,
        mimeType as string,
      );
      setFlights(extracted);
    } catch (err) {
      console.log("Extract error:", err);
      setError("Could not read ticket. Please fill in the details manually.");
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

  const addFlight = () => {
    setFlights((prev) => [...prev, emptyFlight()]);
  };

  const removeFlight = (index: number) => {
    if (flights.length === 1) return;
    setFlights((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const firstFlight = flights[0];
    if (!firstFlight.flight_number || !firstFlight.from || !firstFlight.to) {
      Alert.alert(
        "Missing details",
        "Please fill in at least the flight number, origin and destination for Flight 1",
      );
      return;
    }

    router.push({
      pathname: "/(app/)/trip/[id]",
      params: {
        id: "new",
        allFlights: JSON.stringify(flights),
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingTitle}>Reading your ticket...</Text>
        <Text style={styles.loadingSubtitle}>
          Extracting your flight details
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify Details</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.instruction}>
          Review and correct your flight details before generating instructions.
        </Text>

        {error ? (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              Details extracted. Please verify below.
            </Text>
          </View>
        )}

        {flights.map((flight, index) => (
          <View key={index} style={styles.flightSection}>
            <View style={styles.flightSectionHeader}>
              <Text style={styles.flightSectionTitle}>Flight {index + 1}</Text>
              {flights.length > 1 && (
                <TouchableOpacity onPress={() => removeFlight(index)}>
                  <Text style={styles.removeButton}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <InputField
                  label="From City"
                  value={flight.from}
                  onChangeText={(v) => updateFlight(index, "from", v)}
                  placeholder="Mumbai"
                />
              </View>
              <View style={styles.rowItem}>
                <InputField
                  label="To City"
                  value={flight.to}
                  onChangeText={(v) => updateFlight(index, "to", v)}
                  placeholder="Dubai"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <InputField
                  label="From Code"
                  value={flight.from_code}
                  onChangeText={(v) => updateFlight(index, "from_code", v)}
                  placeholder="BOM"
                />
              </View>
              <View style={styles.rowItem}>
                <InputField
                  label="To Code"
                  value={flight.to_code}
                  onChangeText={(v) => updateFlight(index, "to_code", v)}
                  placeholder="DXB"
                />
              </View>
            </View>

            <InputField
              label="Flight Number"
              value={flight.flight_number}
              onChangeText={(v) => updateFlight(index, "flight_number", v)}
              placeholder="AI 302"
            />

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <InputField
                  label="Date"
                  value={flight.date}
                  onChangeText={(v) => updateFlight(index, "date", v)}
                  placeholder="15 Mar 2024"
                />
              </View>
              <View style={styles.rowItem}>
                <InputField
                  label="Seat"
                  value={flight.seat}
                  onChangeText={(v) => updateFlight(index, "seat", v)}
                  placeholder="24A"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <InputField
                  label="Departure"
                  value={flight.departure_time}
                  onChangeText={(v) => updateFlight(index, "departure_time", v)}
                  placeholder="14:30"
                />
              </View>
              <View style={styles.rowItem}>
                <InputField
                  label="Arrival"
                  value={flight.arrival_time}
                  onChangeText={(v) => updateFlight(index, "arrival_time", v)}
                  placeholder="16:45"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <InputField
                  label="Terminal"
                  value={flight.terminal}
                  onChangeText={(v) => updateFlight(index, "terminal", v)}
                  placeholder="T2"
                />
              </View>
              <View style={styles.rowItem}>
                <InputField
                  label="Gate"
                  value={flight.gate}
                  onChangeText={(v) => updateFlight(index, "gate", v)}
                  placeholder="B12"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <InputField
                  label="Class"
                  value={flight.class}
                  onChangeText={(v) => updateFlight(index, "class", v)}
                  placeholder="Economy"
                />
              </View>
              <View style={styles.rowItem}>
                <InputField
                  label="Baggage"
                  value={flight.baggage_allowance}
                  onChangeText={(v) =>
                    updateFlight(index, "baggage_allowance", v)
                  }
                  placeholder="25kg"
                />
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addFlightButton} onPress={addFlight}>
          <Text style={styles.addFlightText}>+ Add another flight leg</Text>
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
            <Text style={styles.submitButtonText}>
              Confirm and Generate Instructions
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#475569"
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
  loadingTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  loadingSubtitle: {
    fontSize: 14,
    color: "#94A3B8",
  },
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    color: "#6366F1",
    fontSize: 16,
    width: 60,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
  },
  instruction: {
    fontSize: 14,
    color: "#94A3B8",
    lineHeight: 22,
  },
  warningBox: {
    backgroundColor: "#422006",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#854D0E",
  },
  warningText: {
    color: "#FDE68A",
    fontSize: 13,
  },
  successBox: {
    backgroundColor: "#052E16",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#166534",
  },
  successText: {
    color: "#86EFAC",
    fontSize: 13,
  },
  flightSection: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 12,
  },
  flightSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  flightSectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  removeButton: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#0F172A",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#334155",
    color: "#FFFFFF",
  },
  addFlightButton: {
    borderWidth: 1,
    borderColor: "#334155",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  addFlightText: {
    color: "#6366F1",
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: "#6366F1",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
