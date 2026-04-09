import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/png", "application/pdf"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const picked = result.assets[0];
      setFile(picked);
    } catch (err) {
      Alert.alert("Error", "Could not open file picker");
    }
  };

  const handleContinue = async () => {
    if (!file) {
      Alert.alert("No file selected", "Please upload your ticket first");
      return;
    }

    setLoading(true);

    try {
      // Use fetch to read the file and convert to base64
      const response = await fetch(file.uri);
      const blob = await response.blob();

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data:image/jpeg;base64, prefix
          const base64String = result.split(",")[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const mimeType = file.mimeType || "image/jpeg";

      router.push({
        pathname: "/(app/)/verify",
        params: {
          base64,
          mimeType,
          fileName: file.name,
        },
      });
    } catch (err) {
      console.log("Full error:", JSON.stringify(err));
      console.log("File details:", JSON.stringify(file));
      Alert.alert("Error", String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Ticket</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Upload your flight ticket</Text>
        <Text style={styles.subtitle}>Supports JPG, PNG and PDF formats</Text>

        {/* Upload box */}
        <TouchableOpacity
          style={[styles.uploadBox, file && styles.uploadBoxFilled]}
          onPress={pickFile}
        >
          {file ? (
            <View style={styles.filePreview}>
              {file.mimeType?.startsWith("image/") ? (
                <Image
                  source={{ uri: file.uri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.pdfPreview}>
                  <Text style={styles.pdfName} numberOfLines={2}>
                    {file.name}
                  </Text>
                </View>
              )}
              <TouchableOpacity style={styles.changeFile} onPress={pickFile}>
                <Text style={styles.changeFileText}>Change file</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Text style={styles.uploadText}>Tap to select ticket</Text>
              <Text style={styles.uploadHint}>JPG, PNG or PDF</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Tips */}
        <View style={styles.tipsBox}>
          <Text style={styles.tipsTitle}>For best results</Text>
          <Text style={styles.tipText}>
            • Make sure the ticket is clearly visible
          </Text>
          <Text style={styles.tipText}>• All text should be readable</Text>
          <Text style={styles.tipText}>• Avoid blurry or cropped images</Text>
        </View>
      </View>

      {/* Continue button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !file && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!file || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueButtonText}>Continue →</Text>
          )}
        </TouchableOpacity>
      </View>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    color: "#6366F1",
    fontSize: 16,
    width: 60,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: -12,
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: "#334155",
    borderStyle: "dashed",
    borderRadius: 16,
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E293B",
  },
  uploadBoxFilled: {
    borderColor: "#6366F1",
    borderStyle: "solid",
  },
  uploadPlaceholder: {
    alignItems: "center",
    gap: 8,
  },

  uploadText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  uploadHint: {
    color: "#475569",
    fontSize: 13,
  },
  filePreview: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
  },
  previewImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
  },
  pdfPreview: {
    alignItems: "center",
    gap: 8,
  },

  pdfName: {
    color: "#FFFFFF",
    fontSize: 14,
    textAlign: "center",
  },
  changeFile: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#6366F1",
  },
  changeFileText: {
    color: "#6366F1",
    fontSize: 13,
  },
  tipsBox: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: "#334155",
  },
  tipsTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  tipText: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
  },
  continueButton: {
    backgroundColor: "#6366F1",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  continueButtonDisabled: {
    backgroundColor: "#1E293B",
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
