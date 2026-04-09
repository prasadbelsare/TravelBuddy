import { authService } from "@/services/authService";
import { tripService } from "@/services/tripService";
import { Trip } from "@/types";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.name}>{userName}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => router.push("/(app/)/upload")}
          >
            <Text style={styles.uploadButtonText}>+ New Trip</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading your trips...</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>Your Trips ({trips.length})</Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No trips yet</Text>
              <Text style={styles.emptySubtitle}>
                Upload your first flight ticket to get started
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push("/(app/)/upload")}
              >
                <Text style={styles.emptyButtonText}>Upload Ticket</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.tripCard}
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
              <View style={styles.routeRow}>
                <Text style={styles.code}>{item.from_code}</Text>
                <Text style={styles.arrow}>→</Text>
                <Text style={styles.code}>{item.to_code}</Text>
              </View>
              <Text style={styles.routeCities}>
                {item.from_city} to {item.to_city}
              </Text>
              <View style={styles.detailsRow}>
                <Text style={styles.detailText}>{item.departure_date}</Text>
                <Text style={styles.detailText}>
                  {item.all_flights?.length}{" "}
                  {item.all_flights?.length === 1 ? "flight" : "flights"}
                </Text>
              </View>
              <Text style={styles.routeOverview} numberOfLines={1}>
                {item.route_overview}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 13,
    color: "#94A3B8",
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textTransform: "capitalize",
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  uploadButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
  logoutText: {
    color: "#94A3B8",
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#94A3B8",
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
    marginTop: 8,
  },
  tripCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 8,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  code: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  arrow: {
    fontSize: 18,
    color: "#6366F1",
  },
  routeCities: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: -4,
  },
  detailsRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  detailText: {
    fontSize: 13,
    color: "#64748B",
  },
  routeOverview: {
    fontSize: 12,
    color: "#475569",
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
});
