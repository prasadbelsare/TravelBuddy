import { FlightDetails, Instructions } from "@/types";
import { supabase } from "@/utils/supabase";

type ConversationEntry = {
  role: string;
  content: string;
};

export const groqService = {
  async extractFlightDetails(
    base64: string,
    mimeType: string,
  ): Promise<FlightDetails[]> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");
    const { data, error } = await supabase.functions.invoke("extract-ticket", {
      body: {
        image_base64: base64,
        mimeType,
        access_token: session.access_token,
      },
    });

    if (error) throw new Error(error.message || "Failed to process ticket");
    if (data?.error) throw new Error(data.error);

    const text = data.choices[0].message.content;
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [parsed];
  },

  async generateInstructions(flights: FlightDetails[]): Promise<Instructions> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const { data, error } = await supabase.functions.invoke(
      "generate-instructions",
      {
        body: {
          flights,
          access_token: session.access_token,
        },
      },
    );

    if (error)
      throw new Error(error.message || "Failed to generate instructions");
    if (data?.error) throw new Error(data.error);

    const text = data.choices[0].message.content;
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(cleaned);
  },

  async fetchTravelNews(flights: FlightDetails[]): Promise<string[]> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const locations = Array.from(
        new Set(
          flights.flatMap((f) => [
            `${f.from} (${f.from_code} airport)`,
            `${f.to} (${f.to_code} airport)`,
          ]),
        ),
      );

      const { data, error } = await supabase.functions.invoke(
        "fetch-travel-news",
        {
          body: {
            locations,
            access_token: session.access_token,
          },
        },
      );

      if (error) {
        console.log("News fetch error:", error.message);
        return [];
      }
      if (data?.error) {
        console.log("News fetch backend error:", data.error);
        return [];
      }

      return data?.news_summary || [];
    } catch (err) {
      console.log("Unexpected news fetch error:", err);
      return [];
    }
  },

  async chat(
    question: string,
    flights: FlightDetails[],
    conversationHistory: ConversationEntry[],
  ): Promise<{ reply: string; remaining: number }> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const { data, error } = await supabase.functions.invoke("chat", {
      body: {
        question,
        flights,
        conversationHistory,
        access_token: session.access_token,
      },
    });

    if (error) throw new Error(error.message || "Failed to send message");
    if (data?.error) throw new Error(data.error);

    return {
      reply: data.choices[0].message.content,
      remaining: data.remaining_messages ?? 20,
    };
  },
};
