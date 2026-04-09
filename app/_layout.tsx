import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext"; // Adjust path if needed

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="(app/)" />
      </Stack>
    </AuthProvider>
  );
}
