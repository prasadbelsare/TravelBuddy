import { authService } from "@/services/authService";
import { tripService } from "@/services/tripService";
import { Trip } from "@/types";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useFocusEffect(
    useCallback(() => {
      loadTrips();
      loadUser();
    }, []),
  );

  const loadUser = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user?.user_metadata?.first_name) {
        setUserName(user.user_metadata.first_name);
      } else if (user?.email) {
        setUserName(user.email.split("@")[0]);
      }
    } catch (err) {
      console.log("Load user error:", err);
    }
  };

  const loadTrips = async () => {
    setLoading(true);
    try {
      const data = await tripService.getTrips();
      setTrips(data);
    } catch (err) {
      console.log("Load trips error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      router.replace("/login");
    } catch (err) {
      console.log("Logout error:", err);
    }
  };

  const confirmDelete = async (tripId: string) => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Are you sure you want to remove this trip?",
      );
      if (confirmed) {
        try {
          await tripService.deleteTrip(tripId);
          setTrips((prev) => prev.filter((t) => t.id !== tripId));
        } catch (err) {
          window.alert("Could not delete flight. Please try again.");
        }
      }
    } else {
      Alert.alert(
        "Delete Itinerary",
        "Are you sure you want to remove this trip?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await tripService.deleteTrip(tripId);
                setTrips((prev) => prev.filter((t) => t.id !== tripId));
              } catch (err) {
                Alert.alert(
                  "Error",
                  "Could not delete flight. Please try again.",
                );
              }
            },
          },
        ],
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{userName}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
            <Feather name="log-out" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* TRIP LIST */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>Your Itineraries</Text>
              <TouchableOpacity
                style={styles.newTripBtn}
                onPress={() => router.push("/(app/)/upload")}
              >
                <Feather name="plus" size={16} color="#FFFFFF" />
                <Text style={styles.newTripBtnText}>New</Text>
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather
                name="map"
                size={48}
                color="#334155"
                style={{ marginBottom: 16 }}
              />
              <Text style={styles.emptyTitle}>No upcoming trips</Text>
              <Text style={styles.emptySubtitle}>
                Add a flight ticket to let your AI assistant generate your
                travel guide.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.tripCard}
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: "/(app/)/trip/[id]",
                  params: {
                    id: item.id,
                    allFlights: JSON.stringify(item.all_flights),
                    savedInstructions: JSON.stringify(item.instructions),
                  },
                })
              }
            >
              <View style={styles.cardHeader}>
                <View style={styles.dateBadge}>
                  <Feather name="calendar" size={14} color="#818CF8" />
                  <Text style={styles.dateText}>{item.departure_date}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => confirmDelete(item.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather name="trash-2" size={16} color="#475569" />
                </TouchableOpacity>
              </View>

              <View style={styles.routeRow}>
                <View>
                  <Text style={styles.airportCode}>{item.from_code}</Text>
                  <Text style={styles.cityName}>{item.from_city}</Text>
                </View>

                <View style={styles.flightLineContainer}>
                  <View style={styles.dashedLine} />
                  <Feather
                    name="send"
                    size={16}
                    color="#6366F1"
                    style={{ marginHorizontal: 8 }}
                  />
                  <View style={styles.dashedLine} />
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.airportCode}>{item.to_code}</Text>
                  <Text style={styles.cityName}>{item.to_city}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.legText}>
                  {item.all_flights?.length}{" "}
                  {item.all_flights?.length === 1 ? "leg" : "legs"}
                </Text>
                <View style={styles.viewDetailsBtn}>
                  <Text style={styles.viewDetailsText}>View Guide</Text>
                  <Feather name="chevron-right" size={16} color="#6366F1" />
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  greeting: { fontSize: 14, color: "#94A3B8", marginBottom: 2 },
  name: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    textTransform: "capitalize",
    letterSpacing: -0.5,
  },
  headerActions: { flexDirection: "row", alignItems: "center" },
  iconBtn: {
    padding: 8,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },

  listContainer: { paddingHorizontal: 24, paddingBottom: 40 },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
  newTripBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366F1",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  newTripBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },

  emptyState: { alignItems: "center", marginTop: 80, paddingHorizontal: 20 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#E2E8F0",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
  },

  tripCard: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dateText: { color: "#818CF8", fontSize: 13, fontWeight: "600" },

  routeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  airportCode: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  cityName: { fontSize: 13, color: "#94A3B8", marginTop: 4 },

  flightLineContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: "#334155",
    borderStyle: "dashed",
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#334155",
    paddingTop: 16,
  },
  legText: { color: "#64748B", fontSize: 14, fontWeight: "500" },
  viewDetailsBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  viewDetailsText: { color: "#6366F1", fontSize: 14, fontWeight: "700" },
});
