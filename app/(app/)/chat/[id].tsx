import { groqService } from "@/services/groqService";
import { FlightDetails } from "@/types";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { SafeAreaView } from "react-native-safe-area-context";
interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

export default function ChatScreen() {
  const { allFlights } = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);

  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [remainingMessages, setRemainingMessages] = useState<number | null>(
    null,
  );

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Hi! I'm your AI Travel Assistant. I have your flight details loaded. What questions do you have about your journey?",
      isUser: false,
    },
  ]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userText = inputText.trim();

    const userMessage: Message = {
      id: Date.now().toString(),
      text: userText,
      isUser: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setLoading(true);

    try {
      const parsedFlights: FlightDetails[] = allFlights
        ? JSON.parse(allFlights as string)
        : [];

      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.isUser ? "user" : "assistant",
          content: m.text,
        }));

      const response = await groqService.chat(userText, parsedFlights, history);

      const aiText = response.reply || "I'm sorry, I couldn't process that.";

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        isUser: false,
      };

      setMessages((prev) => [...prev, aiMessage]);

      if (response.remaining !== undefined) {
        setRemainingMessages(response.remaining);
      }
    } catch (error: any) {
      console.log("Chat error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to reach the travel assistant.",
      );

      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      setInputText(userText);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isBot = !item.isUser;

    return (
      <View
        style={[
          styles.messageRow,
          item.isUser ? styles.messageRowUser : styles.messageRowBot,
        ]}
      >
        {isBot && (
          <View style={styles.botAvatar}>
            <Feather name="cpu" size={14} color="#FFFFFF" />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            item.isUser ? styles.messageBubbleUser : styles.messageBubbleBot,
          ]}
        >
          {item.isUser ? (
            <Text style={[styles.messageText, styles.messageTextUser]}>
              {item.text}
            </Text>
          ) : (
            <Markdown style={markdownStyles}>{item.text}</Markdown>
          )}
        </View>
      </View>
    );
  };
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Travel Assistant</Text>
          <Text style={styles.headerSubtitle}>
            {remainingMessages !== null
              ? `${remainingMessages} messages remaining today`
              : "AI powered by Groq"}
          </Text>
        </View>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#6366F1" />
            <Text style={styles.loadingText}>AI is typing...</Text>
          </View>
        )}

        <View style={styles.inputSection}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Ask about your trip..."
              placeholderTextColor="#64748B"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !inputText.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || loading}
            >
              <Feather
                name="send"
                size={18}
                color="#FFFFFF"
                style={{ marginLeft: -2 }}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  iconBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitleContainer: { alignItems: "center" },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  headerSubtitle: {
    color: "#6366F1",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },

  keyboardView: { flex: 1 },
  chatContainer: { padding: 20, gap: 16, paddingBottom: 20 },

  messageRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 4 },
  messageRowUser: { justifyContent: "flex-end" },
  messageRowBot: { justifyContent: "flex-start", gap: 8 },

  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
  },

  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  messageBubbleUser: { backgroundColor: "#6366F1", borderBottomRightRadius: 4 },
  messageBubbleBot: {
    backgroundColor: "#1E293B",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#334155",
  },

  messageText: { fontSize: 15, lineHeight: 22 },
  messageTextUser: { color: "#FFFFFF" },
  messageTextBot: { color: "#E2E8F0" },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 8,
  },
  loadingText: { color: "#64748B", fontSize: 13, fontStyle: "italic" },

  inputSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: "#0F172A",
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#1E293B",
    borderRadius: 24,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#334155",
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  sendButtonDisabled: { backgroundColor: "#334155" },
});
const markdownStyles = {
  body: {
    color: "#E2E8F0",
    fontSize: 15,
    lineHeight: 22,
  },
  strong: {
    fontWeight: "bold" as const, // <-- Added "as const" here
    color: "#FFFFFF",
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 0,
  },
  list_item: {
    marginBottom: 4,
  },
};
