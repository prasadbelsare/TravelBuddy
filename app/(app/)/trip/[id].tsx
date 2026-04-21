import { AccordionItem } from "@/components/AccordionItem";
import { groqService } from "@/services/groqService";
import { tripService } from "@/services/tripService";
import { FlightDetails, Instructions } from "@/types";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
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
  const [newsSummary, setNewsSummary] = useState<string[]>([]);

  const { id, allFlights } = useLocalSearchParams();

  useEffect(() => {
    loadOrGenerateTrip();
  }, [id, allFlights]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace("/(app/)/home");
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, []),
  );

  const loadOrGenerateTrip = async () => {
    setLoading(true);
    setError("");

    try {
      if (id && id !== "new") {
        const existingTrip = await tripService.getTripById(id as string);
        setFlights(existingTrip.all_flights);
        setInstructions(existingTrip.instructions);
        setNewsSummary(existingTrip.news_summary || []);
      } else if (allFlights) {
        const parsedFlights: FlightDetails[] = JSON.parse(allFlights as string);
        setFlights(parsedFlights);

        const [generatedInstructions, fetchedNews] = await Promise.all([
          groqService.generateInstructions(parsedFlights),
          groqService.fetchTravelNews(parsedFlights),
        ]);

        setInstructions(generatedInstructions);
        setNewsSummary(fetchedNews);

        await tripService.saveTrip(
          parsedFlights,
          generatedInstructions,
          fetchedNews,
        );
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
        <Feather
          name="alert-circle"
          size={48}
          color="#EF4444"
          style={{ marginBottom: 16 }}
        />
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
  const lastFlight = flights[flights.length - 1];

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/(app/)/home")}
          style={styles.headerButton}
        >
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Your Journey</Text>

        <TouchableOpacity
          onPress={() => router.push("/(app/)/home")}
          style={styles.headerButton}
        >
          <Feather name="home" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --- TRIP SUMMARY (ALWAYS VISIBLE) --- */}
        <View style={styles.summaryCard}>
          <View style={styles.routeRow}>
            <View style={styles.cityBlock}>
              <Text style={styles.routeCode}>
                {flight?.from_code ||
                  flight?.from?.substring(0, 3).toUpperCase() ||
                  "---"}
              </Text>
              <Text style={styles.routeCity}>{flight?.from}</Text>
            </View>

            <View style={styles.flightLineContainer}>
              <View style={styles.flightLine} />
              <View style={styles.flightBadge}>
                <Text style={styles.flightBadgeText}>
                  {flights.length} leg{flights.length > 1 ? "s" : ""}
                </Text>
              </View>
              <View style={styles.flightLine} />
            </View>

            <View style={[styles.cityBlock, { alignItems: "flex-end" }]}>
              <Text style={styles.routeCode}>
                {lastFlight?.to_code ||
                  lastFlight?.to?.substring(0, 3).toUpperCase() ||
                  "---"}
              </Text>
              <Text style={styles.routeCity}>{lastFlight?.to}</Text>
            </View>
          </View>

          <View style={styles.legsSummary}>
            {flights.map((f: any, index: number) => (
              <View key={index} style={styles.legSummaryRow}>
                <View style={styles.legSummaryHeader}>
                  <Text style={styles.legSummaryCode}>
                    {f.from_code || f.from}
                  </Text>
                  <Feather name="arrow-right" size={14} color="#6366F1" />
                  <Text style={styles.legSummaryCode}>{f.to_code || f.to}</Text>
                </View>
                <View style={styles.legSummaryDetails}>
                  <Text style={styles.legSummaryFlight}>{f.flight_number}</Text>
                  <Text style={styles.legSummaryDate}>
                    {f.date} • {f.departure_time}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {instructions?.route_overview && (
            <Text style={styles.routeOverview}>
              {instructions.route_overview}
            </Text>
          )}
        </View>

        {/* --- LIVE NEWS & ALERTS DROPDOWN --- */}
        {newsSummary && newsSummary.length > 0 && (
          <AccordionItem title="Live Travel News" icon="radio">
            {newsSummary.map((item, index) => (
              <View key={index} style={styles.bulletRow}>
                <Feather
                  name="chevron-right"
                  size={14}
                  color="#93C5FD"
                  style={styles.bulletIcon}
                />
                <Text style={styles.dropdownText}>{item}</Text>
              </View>
            ))}
          </AccordionItem>
        )}

        {/* --- BEFORE YOU GO (Visa & Precautions) DROPDOWN --- */}
        {((instructions?.visa_reminder &&
          instructions.visa_reminder.length > 0) ||
          (instructions?.general_precautions &&
            instructions.general_precautions.length > 0)) && (
          <AccordionItem title="Before You Go" icon="file-text">
            {instructions?.visa_reminder &&
              instructions.visa_reminder.length > 0 && (
                <View style={styles.subSection}>
                  <Text style={styles.subSectionTitle}>Visa & Documents</Text>
                  {instructions.visa_reminder.map((item, index) => (
                    <View key={index} style={styles.bulletRow}>
                      <Feather
                        name="check"
                        size={14}
                        color="#C4B5FD"
                        style={styles.bulletIcon}
                      />
                      <Text style={styles.dropdownText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}

            {instructions?.general_precautions &&
              instructions.general_precautions.length > 0 && (
                <View style={[styles.subSection, { marginTop: 16 }]}>
                  <Text style={styles.subSectionTitle}>
                    General Precautions
                  </Text>
                  {instructions.general_precautions.map((item, index) => (
                    <View key={index} style={styles.bulletRow}>
                      <Feather
                        name="info"
                        size={14}
                        color="#D6D3D1"
                        style={styles.bulletIcon}
                      />
                      <Text style={styles.dropdownText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}
          </AccordionItem>
        )}

        {/* --- CONNECTING TIPS DROPDOWN --- */}
        {instructions?.connecting_tips &&
          instructions.connecting_tips.length > 0 && (
            <AccordionItem title="Connecting Flight Tips" icon="link">
              {instructions.connecting_tips.map((tip, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Feather
                    name="compass"
                    size={14}
                    color="#93C5FD"
                    style={styles.bulletIcon}
                  />
                  <Text style={styles.dropdownText}>{tip}</Text>
                </View>
              ))}
            </AccordionItem>
          )}

        {/* --- INDIVIDUAL FLIGHT LEGS DROPDOWNS --- */}
        {instructions?.legs?.map((leg, legIndex) => (
          <AccordionItem
            key={legIndex}
            title={`${leg.airport} (${leg.type})`}
            icon="map-pin"
            defaultExpanded={legIndex === 0} // Only open the first leg by default!
          >
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

            {leg.security && leg.security.length > 0 && (
              <View style={styles.securityBox}>
                <View style={styles.cardHeaderRow}>
                  <Feather name="shield" size={14} color="#FFFFFF" />
                  <Text style={styles.securityTitle}>Security Check</Text>
                </View>
                {leg.security.map((item, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <Feather
                      name="check"
                      size={12}
                      color="#94A3B8"
                      style={styles.bulletIcon}
                    />
                    <Text style={styles.securityText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {leg.immigration && leg.immigration.length > 0 && (
              <View style={styles.immigrationBox}>
                <View style={styles.cardHeaderRow}>
                  <Feather name="globe" size={14} color="#FFFFFF" />
                  <Text style={styles.immigrationTitle}>Immigration</Text>
                </View>
                {leg.immigration.map((item, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <Feather
                      name="check"
                      size={12}
                      color="#C4B5FD"
                      style={styles.bulletIcon}
                    />
                    <Text style={styles.immigrationText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {leg.flight_info && (
              <View style={styles.flightInfoBox}>
                <View style={styles.cardHeaderRow}>
                  <Feather name="send" size={14} color="#FFFFFF" />
                  <Text style={styles.flightInfoRoute}>
                    {leg.flight_info.flight_number} — {leg.flight_info.route}
                  </Text>
                </View>
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
          </AccordionItem>
        ))}

        {/* --- FINAL ARRIVAL DROPDOWN --- */}
        {instructions?.final_arrival &&
          instructions.final_arrival.length > 0 && (
            <AccordionItem title="Final Arrival" icon="home">
              <View style={styles.instructionsList}>
                {instructions.final_arrival.map((item, i) => (
                  <View key={i} style={styles.instructionRow}>
                    <View style={styles.instructionBullet} />
                    <Text style={styles.instructionText}>{item}</Text>
                  </View>
                ))}
              </View>
            </AccordionItem>
          )}

        <View style={{ height: 80 }} />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          router.push({
            pathname: "/(app/)/chat/[id]",
            params: {
              id: (id as string) !== "new" ? (id as string) : "new",
              allFlights: JSON.stringify(flights),
            },
          });
        }}
      >
        <Feather name="message-circle" size={28} color="#FFFFFF" />
      </TouchableOpacity>
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
  loadingSubtitle: { fontSize: 14, color: "#94A3B8", textAlign: "center" },
  errorTitle: { fontSize: 20, fontWeight: "bold", color: "#FFFFFF" },
  errorSubtitle: { fontSize: 14, color: "#94A3B8", textAlign: "center" },
  retryButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  retryButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },

  container: { flex: 1, backgroundColor: "#0F172A" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 20, gap: 16 },

  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  bulletIcon: { marginTop: 4 },

  summaryCard: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 16,
    marginBottom: 8,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cityBlock: { flex: 1 },
  routeCode: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  routeCity: { fontSize: 13, color: "#94A3B8", marginTop: 2 },
  flightLineContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 12,
  },
  flightLine: { flex: 1, height: 1, backgroundColor: "#334155" },
  flightBadge: {
    backgroundColor: "#0F172A",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  flightBadgeText: {
    fontSize: 11,
    color: "#6366F1",
    fontWeight: "600",
    textTransform: "uppercase",
  },

  legsSummary: {
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#334155",
    paddingTop: 16,
  },
  legSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0F172A",
    padding: 12,
    borderRadius: 12,
  },
  legSummaryHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  legSummaryCode: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  legSummaryDetails: { alignItems: "flex-end" },
  legSummaryFlight: { color: "#6366F1", fontSize: 13, fontWeight: "600" },
  legSummaryDate: { color: "#94A3B8", fontSize: 12, marginTop: 2 },
  routeOverview: {
    fontSize: 14,
    color: "#CBD5E1",
    lineHeight: 22,
    borderTopWidth: 1,
    borderTopColor: "#334155",
    paddingTop: 16,
  },

  /* --- NEW DROPDOWN CONTENT STYLES --- */
  dropdownText: { color: "#E2E8F0", fontSize: 14, lineHeight: 22, flex: 1 },
  subSection: {
    borderLeftWidth: 2,
    borderLeftColor: "#334155",
    paddingLeft: 12,
    marginLeft: 4,
  },
  subSectionTitle: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  instructionsList: { gap: 12, marginBottom: 16 },
  instructionRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  instructionBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6366F1",
    marginTop: 7,
    flexShrink: 0,
  },
  instructionText: { flex: 1, color: "#CBD5E1", fontSize: 15, lineHeight: 24 },

  securityBox: {
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 12,
  },
  securityTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  securityText: { color: "#94A3B8", fontSize: 14, lineHeight: 22, flex: 1 },

  immigrationBox: {
    backgroundColor: "rgba(26, 10, 46, 0.5)",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2D1B69",
    marginBottom: 12,
  },
  immigrationTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  immigrationText: { color: "#C4B5FD", fontSize: 14, lineHeight: 22, flex: 1 },

  flightInfoBox: {
    backgroundColor: "rgba(49, 46, 129, 0.5)",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#4338CA",
  },
  flightInfoRoute: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  flightInfoTime: {
    color: "#C7D2FE",
    fontSize: 13,
    paddingLeft: 22,
    marginTop: 4,
  },
  flightInfoNote: {
    color: "#A5B4FC",
    fontSize: 13,
    marginTop: 6,
    fontStyle: "italic",
    paddingLeft: 22,
  },

  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: "#818CF8",
  },
});
