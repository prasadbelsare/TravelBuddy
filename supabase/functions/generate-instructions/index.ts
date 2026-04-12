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
  prefix: "generate-instructions",
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { flights, access_token } = body;

    console.log("1. access_token exists:", !!access_token);
    console.log("2. flights count:", flights?.length ?? "MISSING");

    if (!access_token) throw new Error("Missing access_token");
    if (!flights || !Array.isArray(flights)) throw new Error("Missing or invalid flights array");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${access_token}` } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    console.log("3. User:", user?.id ?? "NULL");

    if (authError || !user) throw new Error("Unauthorized");

    const { success } = await ratelimit.limit(user.id);
    console.log("4. Rate limit success:", success);

    if (!success) {
      return new Response(
        JSON.stringify({
          error:
            "You have reached your daily limit of 3 instruction generations. Please try again tomorrow.",
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const flightSummary = flights
      .map(
        (f: any, index: number) =>
          `Leg ${index + 1}:
  Flight: ${f.flight_number}
  From: ${f.from} (${f.from_code})
  To: ${f.to} (${f.to_code})
  Date: ${f.date}
  Departure: ${f.departure_time}
  Arrival: ${f.arrival_time}
  Terminal: ${f.terminal || "check airport"}
  Gate: ${f.gate || "check boards"}
  Seat: ${f.seat || "check boarding pass"}
  Class: ${f.class}
  Baggage: ${f.baggage_allowance}`
      )
      .join("\n\n");

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
              content: `You are a personal travel assistant writing a detailed, friendly, step-by-step airport journey guide.

Total flights: ${flights.length}

ALL FLIGHT LEGS:
${flightSummary}

Generate complete journey instructions covering EVERY flight leg above from start to finish.

CRITICAL RULES FOR ACCURACY:
- For EVERY transit airport determine whether immigration is required based on the specific country and airport
- Delhi (DEL): International transit passengers must go through immigration and security again even if connecting
- London Heathrow (LHR): Transit passengers must go through security again. Immigration only if leaving airside
- Dubai (DXB): Airside transit only — no immigration needed but security check required
- Doha (DOH): Airside transit — no immigration but security check required
- US airports (any): ALL passengers including transit must go through immigration and customs and recheck bags
- Schengen area airports: First entry into Schengen zone requires immigration regardless of final destination
- If unsure about a specific airport always recommend the passenger to confirm with airline staff
- NEVER say no security check needed for any transit — always recommend checking with airline
- Always mention baggage rechecking rules for US transit

Return ONLY a raw JSON object — no markdown, no code blocks, no extra text:
{
  "route_overview": "Full route showing all stops e.g. Mumbai (BOM) → Delhi (DEL) → London (LHR) → Salt Lake City (SLC)",
  "general_precautions": [
    "Always keep your passport and all documents with you",
    "Keep your mobile phone fully charged",
    "Carry enough local currency or a travel card for each country"
  ],
  "visa_reminder": [
    "Confirm you have a valid visa or travel authorisation for each country you are transiting or arriving in",
    "Check if you need a transit visa for layover countries — rules differ per nationality",
    "Verify your passport is valid for at least 6 months beyond your travel dates"
  ],
  "legs": [
    {
      "airport": "Mumbai (BOM) — Departure",
      "type": "departure",
      "instructions": [
        "Arrive at the airport at least 3 hours before your departure",
        "Connect to free airport WiFi on arrival",
        "Get a trolley for your bags near the entrance",
        "Look for your airline check-in counters",
        "Drop off all check-in bags and collect ALL boarding passes for the entire journey if possible",
        "Ask staff whether your bags are checked through to the final destination or need rechecking"
      ],
      "security": [
        "Proceed to security screening",
        "Remove laptops and place in a separate tray",
        "All liquids must be under 100ml and in a clear zip-lock bag",
        "Remove belt watch and coins before going through scanner"
      ],
      "immigration": [],
      "flight_info": {
        "flight_number": "actual flight number from data",
        "route": "City → City",
        "departure": "HH:MM",
        "arrival": "HH:MM",
        "note": "specific note about this flight"
      }
    }
  ],
  "final_arrival": [
    "Proceed to immigration on landing",
    "Have your passport and landing card ready",
    "Collect your checked baggage from the carousel",
    "Proceed through customs",
    "Exit the arrivals hall"
  ],
  "connecting_tips": [
    "Always follow Connecting Flights signs at every transit airport",
    "If your connection time is under 90 minutes inform the cabin crew before landing",
    "Keep all boarding passes safe throughout the journey",
    "If you miss a connection go to your airline desk immediately"
  ]
}

IMPORTANT:
- Generate a leg entry for EVERY airport in the journey including all transit stops
- Use the CRITICAL RULES above for immigration and security accuracy
- Make all instructions specific to the actual airlines and airports mentioned
- Include actual flight numbers times and dates from the data
- Be friendly and clear — write as if guiding someone who needs every detail explained`,
            },
          ],
          temperature: 0.3,
          max_tokens: 8192,
        }),
      }
    );

    const groqData = await groqResponse.json();
    console.log("5. Groq status:", groqResponse.status);

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