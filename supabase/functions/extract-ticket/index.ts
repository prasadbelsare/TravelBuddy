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
  limiter: Ratelimit.slidingWindow(3, "1 d"),
  analytics: true,
  prefix: "extract-ticket",
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { image_base64, mimeType, access_token } = body;

    console.log("1. access_token exists:", !!access_token);
    console.log("2. image_base64 exists:", !!image_base64);
    console.log("3. mimeType:", mimeType);

    if (!access_token) throw new Error("Missing access_token");
    if (!image_base64 || !mimeType) throw new Error("Missing image_base64 or mimeType");

    // Authenticate user using token from body
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
      { global: { headers: { Authorization: `Bearer ${access_token}` } } }
    );
const { data, error } = await supabaseClient.auth.getSession();
console.log('data',data);
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    console.log("4. User:", user?.id ?? "NULL", "Auth error:", authError?.message ?? "NONE");

    if (authError || !user) throw new Error("Unauthorized");

    // Check rate limit — 3 ticket scans per day per user
    const { success } = await ratelimit.limit(user.id);
    console.log("5. Rate limit success:", success);

    if (!success) {
      return new Response(
        JSON.stringify({
          error:
            "You have reached your daily limit of 3 ticket scans. Please try again tomorrow.",
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Call Groq API securely
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
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${image_base64}`,
                  },
                },
                {
                  type: "text",
                  text: `Extract ALL flight legs from this ticket for the FIRST passenger only. Return ONLY a JSON array with no extra text, no markdown, no code blocks. Each element must have exactly this structure:
{
  "flight_number": "",
  "from": "City name only e.g. Mumbai",
  "from_code": "IATA code e.g. BOM",
  "to": "City name only e.g. Dubai",
  "to_code": "IATA code e.g. DXB",
  "date": "",
  "departure_time": "",
  "arrival_time": "",
  "terminal": "",
  "gate": "",
  "seat": "",
  "class": "",
  "baggage_allowance": ""
}
If any field is not found leave it as empty string.
For from_code and to_code use standard IATA airport codes.`,
                },
              ],
            },
          ],
          temperature: 0.1,
          max_tokens: 4096,
        }),
      }
    );

    const groqData = await groqResponse.json();
    console.log("6. Groq status:", groqResponse.status);

    if (!groqResponse.ok) {
      throw new Error(groqData.error?.message || "Groq API error");
    }

    return new Response(JSON.stringify(groqData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.log("ERROR:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});