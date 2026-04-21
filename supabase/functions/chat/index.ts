import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Ratelimit } from "https://esm.sh/@upstash/ratelimit@1.0.3";
import { Redis } from "https://esm.sh/@upstash/redis@1.28.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const redis = new Redis({
  url: Deno.env.get("UPSTASH_REDIS_REST_URL")!,
  token: Deno.env.get("UPSTASH_REDIS_REST_TOKEN")!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 d"),
  analytics: true,
  prefix: "chat",
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { question, flights, conversationHistory, access_token } = body;

    if (!access_token) throw new Error("Missing access_token");
    if (!question || !flights) throw new Error("Missing question or flights");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${access_token}` } } },
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(access_token);

    if (authError || !user) throw new Error("Unauthorized");

    const { success, remaining } = await ratelimit.limit(user.id);

    if (!success) {
      return new Response(
        JSON.stringify({
          error:
            "You have reached your daily limit of 20 chat messages. Please try again tomorrow.",
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const flightContext = flights
      .map(
        (f: any, i: number) =>
          `Flight ${i + 1}: ${f.flight_number} from ${f.from} (${f.from_code}) to ${f.to} (${f.to_code}) on ${f.date} at ${f.departure_time}`,
      )
      .join("\n");

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("GROQ_API_KEY")}`,
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [
            {
              role: "system",
              content: `You are a helpful travel assistant. Answer questions about this specific journey:

${flightContext}

Be concise, friendly and specific to this journey. If you do not know something specific to these flights give general advice.`,
            },
            ...(conversationHistory || []),
            {
              role: "user",
              content: question,
            },
          ],
          temperature: 0.5,
          max_tokens: 1024,
        }),
      },
    );

    const groqData = await groqResponse.json();

    if (!groqResponse.ok) {
      throw new Error(groqData.error?.message || "Groq API error");
    }

    return new Response(
      JSON.stringify({
        ...groqData,
        remaining_messages: remaining,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.log("ERROR:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
