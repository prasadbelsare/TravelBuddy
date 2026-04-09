import { Redirect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext"; // Import your context

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, initialized } = useAuth();

  // Show a blank screen or spinner while checking local storage
  if (!initialized) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  // If they are already logged in, skip onboarding and go straight to the app
  if (user) {
    return <Redirect href="/(app/)/home" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.heroSection}>
        <Text style={styles.title}>Travel Buddy</Text>
        <Text style={styles.subtitle}>
          Upload your flight ticket and we'll guide you through the entire
          airport journey — step by step.
        </Text>
      </View>

      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/signup")}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.secondaryButtonText}>
            I already have an account
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 60,
  },
  heroSection: {
    alignItems: "center",
    gap: 16,
  },

  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 24,
  },
  buttonSection: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#6366F1",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#94A3B8",
    fontSize: 15,
  },
});
