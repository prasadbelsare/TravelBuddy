import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet, View } from "react-native";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  const AppStack = (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="(app/)" />
    </Stack>
  );

  return (
    <AuthProvider>
      <StatusBar style="light" />

      {Platform.OS === "web" ? (
        <View style={styles.webBackground}>
          <View style={styles.webContainer}>{AppStack}</View>
        </View>
      ) : (
        AppStack
      )}
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  webBackground: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  webContainer: {
    flex: 1,
    width: "100%",
    maxWidth: 450,
    marginHorizontal: "auto",
    backgroundColor: "#0F172A",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#1E293B",
    boxShadow: "0px 0px 20px rgba(0,0,0,0.5)",
  },
});
