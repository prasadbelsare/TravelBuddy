import { GROQ_API_KEY, GROQ_MODEL, GROQ_URL } from "@/constants";
import { FlightDetails, Instructions } from "@/types";

export const groqService = {
    async extractFlightDetails(
        base64: string,
        mimeType: string
    ): Promise<FlightDetails[]> {
        const response = await fetch(GROQ_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${mimeType};base64,${base64}`,
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
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Groq API error");

        const text = data.choices[0].message.content;
        const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        return Array.isArray(parsed) ? parsed : [parsed];
    },

    async generateInstructions(
        flights: FlightDetails[]
    ): Promise<Instructions> {
        const flightSummary = flights
            .map(
                (f, index) =>
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

        const response = await fetch(GROQ_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
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
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Groq API error");

        const text = data.choices[0].message.content;
        const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleaned);
    },

    async chat(
        question: string,
        flights: FlightDetails[],
        conversationHistory: { role: string; content: string }[]
    ): Promise<string> {
        const flightContext = flights
            .map(
                (f, i) =>
                    `Flight ${i + 1}: ${f.flight_number} from ${f.from} (${f.from_code}) to ${f.to} (${f.to_code}) on ${f.date} at ${f.departure_time}`
            )
            .join("\n");

        const response = await fetch(GROQ_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: [
                    {
                        role: "system",
                        content: `You are a helpful travel assistant. Answer questions about this specific journey:

${flightContext}

Be concise, friendly and specific to this journey. If you do not know something specific to these flights give general advice.`,
                    },
                    ...conversationHistory,
                    {
                        role: "user",
                        content: question,
                    },
                ],
                temperature: 0.5,
                max_tokens: 1024,
            }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Groq API error");

        return data.choices[0].message.content;
    },
};