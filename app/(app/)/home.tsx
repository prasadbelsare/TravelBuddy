import { router } from "expo-router";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
const mockTrips = [
  {
    id: "1",
    from: "Mumbai",
    to: "Dubai",
    date: "15 Mar 2024",
    flight: "AI 302",
    status: "upcoming",
  },
  {
    id: "2",
    from: "Dubai",
    to: "London",
    date: "22 Mar 2024",
    flight: "EK 004",
    status: "upcoming",
  },
  {
    id: "3",
    from: "London",
    to: "New York",
    date: "01 Apr 2024",
    flight: "BA 117",
    status: "completed",
  },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day 👋</Text>
          <Text style={styles.name}>Traveller</Text>
        </View>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => router.push("/(app/)/upload")}
        >
          <Text style={styles.uploadButtonText}>+ New Trip</Text>
        </TouchableOpacity>
      </View>

      {/* Trip list */}
      <FlatList
        data={mockTrips}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>Your Trips</Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎫</Text>
            <Text style={styles.emptyTitle}>No trips yet</Text>
            <Text style={styles.emptySubtitle}>
              Upload your first flight ticket to get started
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.tripCard}
            onPress={() => router.push(`/(app/)/trip/${item.id}`)}
          >
            {/* Route */}
            <View style={styles.routeRow}>
              <Text style={styles.city}>{item.from}</Text>
              <Text style={styles.arrow}>→</Text>
              <Text style={styles.city}>{item.to}</Text>
            </View>

            {/* Details */}
            <View style={styles.detailsRow}>
              <Text style={styles.detailText}>✈️ {item.flight}</Text>
              <Text style={styles.detailText}>📅 {item.date}</Text>
              <View
                style={[
                  styles.statusBadge,
                  item.status === "completed" && styles.statusCompleted,
                ]}
              >
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
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
    fontSize: 14,
    color: "#94A3B8",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  uploadButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
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
    gap: 12,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  city: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  arrow: {
    fontSize: 18,
    color: "#6366F1",
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  detailText: {
    fontSize: 13,
    color: "#94A3B8",
  },
  statusBadge: {
    backgroundColor: "#1D4ED8",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: "auto",
  },
  statusCompleted: {
    backgroundColor: "#166534",
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  emptyState: {
    alignItems: "center",
    marginTop: 80,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 48,
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
});
