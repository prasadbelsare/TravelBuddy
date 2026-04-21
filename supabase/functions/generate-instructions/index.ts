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

    if (!access_token) throw new Error("Missing access_token");
    if (!flights || !Array.isArray(flights))
      throw new Error("Missing or invalid flights array");

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

    const { success } = await ratelimit.limit(user.id);

    if (!success) {
      return new Response(
        JSON.stringify({
          error:
            "You have reached your daily limit of 3 instruction generations. Please try again tomorrow.",
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
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
  Baggage: ${f.baggage_allowance}`,
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

Total flights: \${flights.length}

ALL FLIGHT LEGS:
\${flightSummary}

Generate complete journey instructions covering EVERY flight leg above from start to finish.

CRITICAL RULES FOR ACCURACY:
- BAGGAGE & BOARDING PASSES: At the very first departure airport, explicitly instruct the user to submit all check-in baggage and request that it be checked through to the final destination (subject to customs rules). Instruct them to collect boarding passes for ALL connecting flights in the journey.
- IMMIGRATION (FIRST PORT OF ENTRY RULE): Immigration and customs ALWAYS happen at the FIRST port of entry into the destination country or border-free region (like the Schengen zone), NOT necessarily the final destination. 
  *(EXAMPLE: If a passenger flies from Country A -> Transit Country B -> Destination Country C (City 1) -> Destination Country C (City 2), immigration and baggage claim for customs happens at City 1. The subsequent City 1 -> City 2 flight is domestic, requiring no further immigration.)*
- STRICT PLACEMENT RULE: You must place Immigration, Customs, and Security instructions ONLY in the JSON block for the specific airport where it physically happens. If immigration/customs happens at a transit airport, the 'immigration' array for THAT transit leg must contain the instructions, and the Final Destination 'immigration' array must be empty. Do not put transit instructions in the arrival leg.
- US CUSTOMS RULE: For layovers at US airports (e.g., LAX, JFK, ORD) that serve as the first port of entry, you MUST explicitly instruct the passenger in THAT specific layover's leg to: 1. Clear US immigration, 2. Collect ALL checked bags at baggage claim, 3. Walk through customs, 4. Re-check bags at the domestic transfer baggage drop, and 5. Go through TSA security again for their domestic connection. Do not tell them their bags are through-checked.
- DYNAMIC TRANSIT RULES: Analyze the specific transit airports provided in the flight data. Apply accurate, real-world transit rules for those specific airports (e.g., determining if airside transit without immigration is allowed, or if a transfer security re-check is mandatory, like at DOH or LHR). Ensure transit security instructions go into the 'security' array of that specific transit leg.
- VISAS & TRANSIT VISAS (NO HALLUCINATIONS): Do NOT hallucinate visa information. If you do not have absolute, verifiable certainty about a visa rule, explicitly instruct the user: "Please confirm transit visa and entry visa requirements directly with your airline and the respective embassies." ALWAYS instruct the user to verify transit visa requirements for every layover country.

Return ONLY a raw JSON object — no markdown, no code blocks, no extra text:
{
  "route_overview": "Full route showing all stops e.g. Origin → Transit 1 → Transit 2 → Final Destination",
  "live_travel_alerts": [
    "Insert specific warnings based on the specific airports in the itinerary, or leave this array empty if none apply to the passenger's journey"
  ],
  "general_precautions": [
    "Always keep your passport and all documents with you",
    "Keep your mobile phone fully charged",
    "Carry enough local currency or a travel card for each country"
  ],
  "visa_reminder": [
    "Please confirm all entry visa and transit visa requirements directly with your airline and the respective embassies to ensure you have the correct information.",
    "Check if you need a transit visa for your specific layover countries — rules differ strictly by nationality.",
    "Verify your passport is valid for at least 6 months beyond your travel dates."
  ],
  "legs": [
    {
      "airport": "Airport Name (Code) — Departure/Transit/Arrival",
      "type": "departure",
      "instructions": [
        "Arrive at the airport at least 3 hours before your departure.",
        "Look for your airline check-in counters.",
        "Submit all your check-in baggage here at the starting point. Ask staff to check your bags through to your final destination, but be prepared to collect them at your first port of entry for customs.",
        "Crucial: Request and collect the printed boarding passes for ALL of the flights in your journey right now.",
        "Connect to free airport WiFi on arrival if needed."
      ],
      "security": [
        "Proceed to security screening.",
        "Remove laptops and place in a separate tray.",
        "All liquids must be under 100ml and in a clear zip-lock bag."
      ],
      "immigration": [
        "Proceed to outbound immigration and get your passport stamped for departure."
      ],
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
    "Proceed to the baggage claim area to collect your final checked baggage.",
    "Exit the arrivals hall. Welcome to your final destination!"
  ],
  "connecting_tips": [
    "Always follow 'Connecting Flights' or 'Transit' signs at every layover airport.",
    "If your connection time is under 90 minutes, inform the cabin crew before landing.",
    "Keep all boarding passes safe throughout the entire journey.",
    "If you miss a connection, go to your airline's transfer desk immediately."
  ]
}

IMPORTANT:
- Generate a leg entry for EVERY airport in the journey including all transit stops.
- Place instructions STRICTLY in the leg where the action occurs. (e.g., US Customs instructions belong in the first US layover leg, NOT the final domestic destination leg).
- Populate the 'security' and 'immigration' arrays for transit legs if a security re-check or customs clearance is required there.
- Make all instructions specific to the actual airlines and airports mentioned in the data.
- Include actual flight numbers, times, and dates from the data.
- Be friendly and clear — write as if guiding someone who needs every detail explained.`,
            },
          ],
          temperature: 0.3,
          max_tokens: 8192,
        }),
      },
    );

    const groqData = await groqResponse.json();

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
