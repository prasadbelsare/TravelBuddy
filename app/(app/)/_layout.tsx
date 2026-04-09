import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../../context/AuthContext"; // Adjust path if needed

export default function AppLayout() {
  const { user, initialized } = useAuth();

  // Show a loading spinner while Supabase checks local storage for a session
  if (!initialized) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0F172A",
        }}
      >
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  // If Supabase confirms there is no user, redirect them to the login screen
  if (!user) {
    return <Redirect href="/login" />;
  }

  // If they are logged in, allow them to view the protected stack
  return <Stack screenOptions={{ headerShown: false }} />;
}
