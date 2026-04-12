import { groqService } from "@/services/groqService";
import { ConversationEntry, FlightDetails, Message } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SUGGESTED_QUESTIONS = [
  "What documents do I need?",
  "How early should I arrive?",
  "What is my baggage allowance?",
  "Do I need a transit visa?",
  "What happens if I miss my connection?",
  "Where do I collect my bags?",
];

export default function ChatScreen() {
  const { allFlights } = useLocalSearchParams();

  const flights: FlightDetails[] = allFlights
    ? JSON.parse(allFlights as string)
    : [];

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<
    ConversationEntry[]
  >([]);
  const [remainingMessages, setRemainingMessages] = useState<number>(20);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const welcome: Message = {
      id: "welcome",
      role: "assistant",
      content: `Hello! I am your travel assistant for this journey. I have all your flight details and can answer any questions about your trip from ${flights[0]?.from} to ${flights[flights.length - 1]?.to}. What would you like to know?`,
      timestamp: new Date(),
    };

    const disclaimer: Message = {
      id: "disclaimer",
      role: "assistant",
      content:
        "Please note: Travel Buddy can make mistakes. Always verify your flight details, visa requirements, and airport procedures directly with your airline or airport.",
      timestamp: new Date(),
    };

    setMessages([welcome, disclaimer]);
  }, []);

  const sendMessage = async (text?: string) => {
    const question = text || input.trim();
    if (!question || loading) return;

    setInput("");

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    setLoading(true);

    try {
      const { reply, remaining } = await groqService.chat(
        question,
        flights,
        conversationHistory,
      );
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Update conversation history for context
      setConversationHistory((prev) => [
        ...prev,
        { role: "user", content: question },
        { role: "assistant", content: reply },
      ]);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: err.message.includes("daily limit")
          ? err.message
          : "Sorry, I could not process your question. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";

    return (
      <View
        style={[
          styles.messageWrapper,
          isUser ? styles.messageWrapperUser : styles.messageWrapperAssistant,
        ]}
      >
        {!isUser && (
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarText}>AI</Text>
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.messageBubbleUser : styles.messageBubbleAssistant,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.messageTextUser : styles.messageTextAssistant,
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isUser ? styles.messageTimeUser : styles.messageTimeAssistant,
            ]}
          >
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Travel Assistant</Text>
          <Text style={styles.headerSubtitle}>
            {flights[0]?.from_code} → {flights[flights.length - 1]?.to_code} ·{" "}
            {remainingMessages} messages left
          </Text>
        </View>
        <View style={{ width: 50 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Messages list */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListFooterComponent={
            loading ? (
              <View style={styles.typingIndicator}>
                <View style={styles.avatarBadge}>
                  <Text style={styles.avatarText}>AI</Text>
                </View>
                <View style={styles.typingBubble}>
                  <ActivityIndicator size="small" color="#6366F1" />
                  <Text style={styles.typingText}>Thinking...</Text>
                </View>
              </View>
            ) : null
          }
          renderItem={renderMessage}
        />

        {messages.length <= 1 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsLabel}>Suggested questions</Text>
            <FlatList
              horizontal
              data={SUGGESTED_QUESTIONS}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionChip}
                  onPress={() => sendMessage(item)}
                  disabled={loading}
                >
                  <Text style={styles.suggestionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
        <Text style={styles.disclaimer}>
          Travel Buddy can make mistakes. Always verify with your airline.
        </Text>
        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything about your journey..."
            placeholderTextColor="#475569"
            multiline
            maxLength={500}
            onSubmitEditing={() => sendMessage()}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!input.trim() || loading) && styles.sendButtonDisabled,
            ]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  backButton: {
    color: "#6366F1",
    fontSize: 15,
    width: 50,
  },
  headerCenter: {
    alignItems: "center",
    gap: 2,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#94A3B8",
    fontSize: 12,
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  messageWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 4,
  },
  messageWrapperUser: {
    justifyContent: "flex-end",
  },
  messageWrapperAssistant: {
    justifyContent: "flex-start",
  },
  avatarBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  messageBubble: {
    maxWidth: "78%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  messageBubbleUser: {
    backgroundColor: "#6366F1",
    borderBottomRightRadius: 4,
  },
  messageBubbleAssistant: {
    backgroundColor: "#1E293B",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#334155",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 22,
  },
  messageTextUser: {
    color: "#FFFFFF",
  },
  messageTextAssistant: {
    color: "#CBD5E1",
  },
  messageTime: {
    fontSize: 10,
    alignSelf: "flex-end",
  },
  messageTimeUser: {
    color: "#C7D2FE",
  },
  messageTimeAssistant: {
    color: "#475569",
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1E293B",
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  typingText: {
    color: "#94A3B8",
    fontSize: 13,
  },
  suggestionsContainer: {
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
  },
  suggestionsLabel: {
    color: "#475569",
    fontSize: 12,
    paddingHorizontal: 16,
  },
  suggestionsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  suggestionText: {
    color: "#94A3B8",
    fontSize: 13,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
  },
  input: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#334155",
    maxHeight: 100,
    color: "#FFFFFF",
  },
  sendButton: {
    backgroundColor: "#6366F1",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  disclaimer: {
    color: "#334155",
    fontSize: 11,
    textAlign: "center",
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
});
