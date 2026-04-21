import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function UploadScreen() {
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  // Animation value for the scanner
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      scanAnim.stopAnimation();
    }
  }, [loading]);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/png", "application/pdf"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      setFile(result.assets[0]);
    } catch (err) {
      Alert.alert("Error", "Could not open file picker");
    }
  };

  const handleContinue = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const response = await fetch(file.uri);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      router.push({
        pathname: "/(app/)/verify",
        params: {
          base64,
          mimeType: file.mimeType || "image/jpeg",
          fileName: file.name,
        },
      });
    } catch (err) {
      Alert.alert("Error", String(err));
    } finally {
      setLoading(false);
    }
  };

  const scanTranslate = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 240],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="x" size={24} color="#94A3B8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Trip</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Scan Document</Text>
        <Text style={styles.subtitle}>
          Upload your ticket or boarding pass.
        </Text>

        <TouchableOpacity
          style={[styles.uploadBox, file && styles.uploadBoxFilled]}
          onPress={pickFile}
          disabled={loading}
        >
          {file ? (
            <View style={styles.filePreview}>
              {file.mimeType?.startsWith("image/") ? (
                <Image
                  source={{ uri: file.uri }}
                  style={[styles.previewImage, loading && { opacity: 0.4 }]}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.pdfPreview}>
                  <Feather
                    name="file-text"
                    size={48}
                    color={loading ? "#334155" : "#6366F1"}
                  />
                  <Text style={styles.pdfName} numberOfLines={2}>
                    {file.name}
                  </Text>
                </View>
              )}

              {/* --- LASER SCANNER OVERLAY --- */}
              {loading && (
                <Animated.View
                  style={[
                    styles.scannerLine,
                    { transform: [{ translateY: scanTranslate }] },
                  ]}
                />
              )}

              {!loading && (
                <View style={styles.changeFileBadge}>
                  <Feather name="refresh-cw" size={12} color="#FFFFFF" />
                  <Text style={styles.changeFileText}>Replace</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.uploadPlaceholder}>
              <View style={styles.iconRing}>
                <Feather name="maximize" size={32} color="#6366F1" />
              </View>
              <Text style={styles.uploadText}>Tap to Upload</Text>
              <Text style={styles.uploadHint}>Supports JPG or PNG</Text>
            </View>
          )}
        </TouchableOpacity>

        {loading && (
          <Text style={styles.loadingStatus}>
            Extracting flight details with Groq AI...
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!file || loading) && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!file || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueButtonText}>Process Ticket</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 12 },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#94A3B8",
    marginBottom: 32,
    lineHeight: 24,
  },

  uploadBox: {
    borderWidth: 2,
    borderColor: "#334155",
    borderStyle: "dashed",
    borderRadius: 24,
    height: 240,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E293B",
    overflow: "hidden",
  },
  uploadBoxFilled: { borderColor: "#6366F1", borderStyle: "solid" },
  uploadPlaceholder: { alignItems: "center", gap: 12 },
  iconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  uploadText: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  uploadHint: { color: "#64748B", fontSize: 14 },

  filePreview: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  previewImage: { width: "100%", height: "100%" },
  pdfPreview: { alignItems: "center", gap: 16 },
  pdfName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    paddingHorizontal: 24,
  },

  scannerLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#818CF8",
    shadowColor: "#818CF8",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },

  changeFileBadge: {
    position: "absolute",
    bottom: 16,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  changeFileText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },

  loadingStatus: {
    color: "#818CF8",
    textAlign: "center",
    marginTop: 24,
    fontSize: 14,
    fontWeight: "500",
    fontStyle: "italic",
  },

  footer: { padding: 24 },
  continueButton: {
    backgroundColor: "#6366F1",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  continueButtonDisabled: { backgroundColor: "#1E293B" },
  continueButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
