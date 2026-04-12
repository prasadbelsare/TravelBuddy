import { groqService } from "@/services/groqService";
import { tripService } from "@/services/tripService";
import { FlightDetails, Instructions } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TripScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [instructions, setInstructions] = useState<Instructions | null>(null);
  const [flights, setFlights] = useState<FlightDetails[]>([]);

  const { id, allFlights } = useLocalSearchParams();

  useEffect(() => {
    loadOrGenerateTrip();
  }, [id, allFlights]);

  const loadOrGenerateTrip = async () => {
    setLoading(true);
    setError("");

    try {
      // Loading an existing trip
      if (id && id !== "new") {
        const existingTrip = await tripService.getTripById(id as string);
        setFlights(existingTrip.all_flights);
        setInstructions(existingTrip.instructions);
      }
      // New Trip
      else if (allFlights) {
        const parsedFlights: FlightDetails[] = JSON.parse(allFlights as string);
        setFlights(parsedFlights);

        // Generate the instructions
        const generatedInstructions =
          await groqService.generateInstructions(parsedFlights);
        setInstructions(generatedInstructions);

        // 2. Save the trip to Supabase
        await tripService.saveTrip(parsedFlights, generatedInstructions);
      } else {
        setError("No flight data found.");
      }
    } catch (err: any) {
      console.log("Trip load error:", err);
      setError(err.message || "Could not load trip details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingTitle}>Preparing your journey...</Text>
        <Text style={styles.loadingSubtitle}>
          {id !== "new"
            ? "Fetching saved trip details"
            : "Generating instructions from AI"}
        </Text>
      </SafeAreaView>
    );
  }

  if (error || flights.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadOrGenerateTrip}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const flight = flights[0];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Journey</Text>
        <TouchableOpacity onPress={() => router.push("/(app/)/home")}>
          <Text style={styles.homeButton}>Home</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.routeRow}>
            <View style={styles.routeItem}>
              <Text style={styles.routeCode}>
                {flight?.from_code || flight?.from}
              </Text>
              <Text style={styles.routeCity}>{flight?.from}</Text>
            </View>
            <View style={styles.routeMiddle}>
              <Text style={styles.routeFlight}>
                {flights.length} flight{flights.length > 1 ? "s" : ""}
              </Text>
              <Text style={styles.routeArrow}>- - - - -</Text>
            </View>
            <View style={styles.routeItem}>
              <Text style={styles.routeCode}>
                {flights[flights.length - 1]?.to_code ||
                  flights[flights.length - 1]?.to}
              </Text>
              <Text style={styles.routeCity}>
                {flights[flights.length - 1]?.to}
              </Text>
            </View>
          </View>

          {/* All legs summary */}
          <View style={styles.legsSummary}>
            {flights.map((f: any, index: number) => (
              <View key={index} style={styles.legSummaryRow}>
                <Text style={styles.legSummaryCode}>
                  {f.from_code || f.from}
                </Text>
                <Text style={styles.legSummaryArrow}>→</Text>
                <Text style={styles.legSummaryCode}>{f.to_code || f.to}</Text>
                <Text style={styles.legSummaryFlight}>{f.flight_number}</Text>
                <Text style={styles.legSummaryTime}>{f.departure_time}</Text>
                <Text style={styles.legSummaryDate}>{f.date}</Text>
              </View>
            ))}
          </View>

          {instructions?.route_overview && (
            <Text style={styles.routeOverview}>
              {instructions.route_overview}
            </Text>
          )}
        </View>

        {/* Visa precautions */}
        {instructions?.visa_reminder &&
          instructions.visa_reminder.length > 0 && (
            <View style={styles.visaCard}>
              <Text style={styles.visaTitle}>
                Important — Visa and Immigration
              </Text>
              {instructions.visa_reminder.map((item, index) => (
                <Text key={index} style={styles.visaText}>
                  • {item}
                </Text>
              ))}
            </View>
          )}

        {/* General precautions */}
        {instructions?.general_precautions &&
          instructions.general_precautions.length > 0 && (
            <View style={styles.precautionsCard}>
              <Text style={styles.precautionsTitle}> Before You Go</Text>
              {instructions.general_precautions.map((item, index) => (
                <Text key={index} style={styles.precautionText}>
                  • {item}
                </Text>
              ))}
            </View>
          )}

        {/* Journey legs */}
        {instructions?.legs?.map((leg, legIndex) => (
          <View key={legIndex} style={styles.legCard}>
            <View style={styles.legHeader}>
              <Text style={styles.legAirport}>{leg.airport}</Text>
              <View
                style={[
                  styles.legTypeBadge,
                  leg.type === "transit" && styles.legTypeBadgeTransit,
                  leg.type === "arrival" && styles.legTypeBadgeArrival,
                ]}
              >
                <Text style={styles.legTypeText}>{leg.type}</Text>
              </View>
            </View>

            {/* Instructions */}
            {leg.instructions && leg.instructions.length > 0 && (
              <View style={styles.instructionsList}>
                {leg.instructions.map((instruction, i) => (
                  <View key={i} style={styles.instructionRow}>
                    <View style={styles.instructionBullet} />
                    <Text style={styles.instructionText}>{instruction}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Security */}
            {leg.security && leg.security.length > 0 && (
              <View style={styles.securityBox}>
                <Text style={styles.securityTitle}> Security Check</Text>
                {leg.security.map((item, i) => (
                  <Text key={i} style={styles.securityText}>
                    • {item}
                  </Text>
                ))}
              </View>
            )}

            {/* Immigration */}
            {leg.immigration && leg.immigration.length > 0 && (
              <View style={styles.immigrationBox}>
                <Text style={styles.immigrationTitle}> Immigration</Text>
                {leg.immigration.map((item, i) => (
                  <Text key={i} style={styles.immigrationText}>
                    • {item}
                  </Text>
                ))}
              </View>
            )}

            {/* Flight info */}
            {leg.flight_info && (
              <View style={styles.flightInfoBox}>
                <Text style={styles.flightInfoRoute}>
                  {leg.flight_info.flight_number} — {leg.flight_info.route}
                </Text>
                <Text style={styles.flightInfoTime}>
                  Departs {leg.flight_info.departure} · Arrives{" "}
                  {leg.flight_info.arrival}
                </Text>
                {leg.flight_info.note && (
                  <Text style={styles.flightInfoNote}>
                    {leg.flight_info.note}
                  </Text>
                )}
              </View>
            )}
          </View>
        ))}

        {/* Final arrival */}
        {instructions?.final_arrival &&
          instructions.final_arrival.length > 0 && (
            <View style={styles.legCard}>
              <View style={styles.legHeader}>
                <Text style={styles.legAirport}>Final Arrival</Text>
                <View style={styles.legTypeBadgeArrival}>
                  <Text style={styles.legTypeText}>arrival</Text>
                </View>
              </View>
              <View style={styles.instructionsList}>
                {instructions.final_arrival.map((item, i) => (
                  <View key={i} style={styles.instructionRow}>
                    <View style={styles.instructionBullet} />
                    <Text style={styles.instructionText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

        {/* Connecting tips */}
        {instructions?.connecting_tips &&
          instructions.connecting_tips.length > 0 && (
            <View style={styles.connectingCard}>
              <Text style={styles.connectingTitle}>Connecting Flight Tips</Text>
              {instructions.connecting_tips.map((tip, i) => (
                <Text key={i} style={styles.connectingText}>
                  • {tip}
                </Text>
              ))}
            </View>
          )}

        {/* Chat button */}
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => {
            router.push({
              pathname: "/(app/)/chat/[id]",
              params: {
                id: "new",
                allFlights: JSON.stringify(flights),
              },
            });
          }}
        >
          <Text style={styles.chatButtonText}>
            Ask a question about this journey
          </Text>
        </TouchableOpacity>

        <Text style={styles.calmNote}>
          Travel Buddy is an AI and can make mistakes; always verify critical
          flight details with your airline.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 24,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  loadingSubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  errorSubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
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
  homeButton: {
    color: "#6366F1",
    fontSize: 15,
    width: 60,
    textAlign: "right",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 16,
  },
  summaryCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 14,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  routeItem: {
    alignItems: "center",
    gap: 4,
  },
  routeCode: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  routeCity: {
    fontSize: 12,
    color: "#94A3B8",
  },
  routeMiddle: {
    alignItems: "center",
    gap: 4,
    flex: 1,
    paddingHorizontal: 8,
  },
  routeFlight: {
    fontSize: 12,
    color: "#6366F1",
    fontWeight: "600",
  },
  routeArrow: {
    fontSize: 14,
    color: "#475569",
  },
  legsSummary: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#334155",
    paddingTop: 12,
  },
  legSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  legSummaryCode: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  legSummaryArrow: {
    color: "#6366F1",
    fontSize: 13,
  },
  legSummaryFlight: {
    color: "#6366F1",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  legSummaryTime: {
    color: "#94A3B8",
    fontSize: 12,
  },
  legSummaryDate: {
    color: "#475569",
    fontSize: 11,
  },
  routeOverview: {
    fontSize: 13,
    color: "#CBD5E1",
    fontWeight: "600",
    borderTopWidth: 1,
    borderTopColor: "#334155",
    paddingTop: 12,
  },
  precautionsCard: {
    backgroundColor: "#1C1917",
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#44403C",
  },
  precautionsTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  precautionText: {
    color: "#D6D3D1",
    fontSize: 13,
    lineHeight: 22,
  },
  legCard: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    overflow: "hidden",
  },
  legHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    backgroundColor: "#0F172A",
  },

  legAirport: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  legTypeBadge: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  legTypeBadgeTransit: {
    backgroundColor: "#0F6E56",
  },
  legTypeBadgeArrival: {
    backgroundColor: "#854D0E",
  },
  legTypeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  instructionsList: {
    padding: 16,
    gap: 10,
  },
  instructionRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  instructionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#6366F1",
    marginTop: 7,
    flexShrink: 0,
  },
  instructionText: {
    flex: 1,
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 22,
  },
  securityBox: {
    backgroundColor: "#0F172A",
    padding: 14,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  securityTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  securityText: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 20,
  },
  immigrationBox: {
    backgroundColor: "#1A0A2E",
    padding: 14,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "#2D1B69",
  },
  immigrationTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  immigrationText: {
    color: "#C4B5FD",
    fontSize: 13,
    lineHeight: 20,
  },
  flightInfoBox: {
    backgroundColor: "#312E81",
    padding: 14,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: "#4338CA",
  },
  flightInfoRoute: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  flightInfoTime: {
    color: "#C7D2FE",
    fontSize: 13,
  },
  flightInfoNote: {
    color: "#A5B4FC",
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
  connectingCard: {
    backgroundColor: "#0F2942",
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#1E3A5F",
  },
  connectingTitle: {
    color: "#93C5FD",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  connectingText: {
    color: "#93C5FD",
    fontSize: 13,
    lineHeight: 20,
  },
  chatButton: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#6366F1",
    marginTop: 8,
  },
  chatButtonText: {
    color: "#6366F1",
    fontSize: 15,
    fontWeight: "600",
  },
  calmNote: {
    color: "#475569",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    paddingBottom: 8,
  },
  visaCard: {
    backgroundColor: "#1A0A2E",
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#2D1B69",
  },
  visaTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  visaText: {
    color: "#C4B5FD",
    fontSize: 13,
    lineHeight: 22,
  },
});
