import { StyleSheet, Text, View } from "react-native";

export default function TripScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Trip Details — coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
  },
  text: { color: "#FFFFFF", fontSize: 18 },
});
