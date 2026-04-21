import { DismissKeyboardView } from "@/components/DismissKeyboardView";
import { authService } from "@/services/authService";
import { Feather } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Signup() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const signUpWithEmail = async () => {
    setError("");

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      setError("Please fill out all fields before signing up.");
      return;
    }

    setLoading(true);
    try {
      await authService.signUp(email, password, firstName, lastName);
      Alert.alert("Success", "Account created successfully!");
      router.replace("/login");
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (text: string) => {
      setter(text);
      setError("");
    };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <DismissKeyboardView>
        <View style={styles.inner}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <View style={styles.backBtnCircle}>
              <Feather name="arrow-left" size={22} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Join Travel Buddy</Text>
            <Text style={styles.subtitle}>
              Create an account to start planning.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfInput]}>
                <Feather
                  name="user"
                  size={18}
                  color="#64748B"
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  placeholderTextColor="#64748B"
                  value={firstName}
                  onChangeText={handleInputChange(setFirstName)}
                  autoCapitalize="words"
                />
              </View>
              <View style={[styles.inputContainer, styles.halfInput]}>
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  placeholderTextColor="#64748B"
                  value={lastName}
                  onChangeText={handleInputChange(setLastName)}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Feather
                name="mail"
                size={20}
                color="#64748B"
                style={styles.icon}
              />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#64748B"
                value={email}
                onChangeText={handleInputChange(setEmail)}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Feather
                name="lock"
                size={20}
                color="#64748B"
                style={styles.icon}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#64748B"
                value={password}
                onChangeText={handleInputChange(setPassword)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Feather
                  name={showPassword ? "eye" : "eye-off"}
                  size={20}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.button}
              onPress={signUpWithEmail}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          <Link href="/login" style={styles.linkContainer} asChild>
            <TouchableOpacity hitSlop={{ top: 10, bottom: 10 }}>
              <Text style={styles.linkText}>
                Already have an account?{" "}
                <Text style={styles.linkHighlight}>Log in</Text>
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </DismissKeyboardView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  inner: { flex: 1, padding: 24, justifyContent: "center" },
  backBtn: { position: "absolute", top: 60, left: 24, zIndex: 10 },
  backBtnCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  header: { marginBottom: 40, marginTop: 20 },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 16, color: "#94A3B8" },
  form: { gap: 16 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    height: 60,
  },
  halfInput: { width: "48%" },
  icon: { marginRight: 12 },
  eyeIcon: { paddingLeft: 10 },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    outlineStyle: "none" as any,
  },

  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
    marginTop: -4,
  },
  errorText: { color: "#EF4444", fontSize: 14, flex: 1 },

  button: {
    backgroundColor: "#6366F1",
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#818CF8",
  },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  linkContainer: { alignItems: "center", marginTop: 32 },
  linkText: { color: "#94A3B8", fontSize: 15 },
  linkHighlight: { color: "#818CF8", fontWeight: "700" },
});
