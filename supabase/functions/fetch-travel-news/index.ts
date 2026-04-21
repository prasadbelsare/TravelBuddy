import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { locations, access_token } = body;

    if (!access_token) throw new Error("Missing access_token");
    if (!locations || !Array.isArray(locations) || locations.length === 0) {
      throw new Error("Missing or invalid locations array");
    }

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

    const locationQuery = locations.join(" OR ");
    const today = new Date().toISOString().split("T")[0];

    const tavilyResponse = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: Deno.env.get("TAVILY_API_KEY"),
        query: `Current airport delays, transit strikes, or severe weather at: ${locationQuery} ${today}`,
        search_depth: "basic",
        days: 2,
      }),
    });

    if (!tavilyResponse.ok) {
      throw new Error("Tavily API failed");
    }

    const searchData = await tavilyResponse.json();

    if (!searchData.results || searchData.results.length === 0) {
      return new Response(
        JSON.stringify({
          news_summary: [
            "Travel Impact Alert: No active travel alerts for your route today.",
          ],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const articles = searchData.results
      .map((r: any) => `${r.title}: ${r.content}`)
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
              role: "system",
              content: `You are an expert aviation analyst. Your job is to analyze live travel data and extract ONLY critical, actionable information for a passenger's journey.

Format your response as a strict JSON array of 3 to 4 strings. Do not use markdown blocks.
Use these exact prefixes for your strings:
1. "Travel Impact Alert: [The glue. One clear sentence summarizing the overall threat to the journey. e.g., 'Weather may affect your connecting flight' or 'No major disruptions expected']"
2. "Weather: [Impact-focused weather for the specific airports. e.g., 'Rain in London → possible arrival delays']"
3. "Airport Status: [Specific delay data for departure, layover, or arrival airports only]"
4. "Airline News: [Only active strikes, mass cancellations, or policy changes. If none, do not include this bullet]"

CRITICAL RULES:
- Filter aggressively. Answer "So what?". If it doesn't directly impact this specific booking, DO NOT include it.
- Ignore global delays; ONLY mention the airports in the user's route.
- Return ONLY a valid JSON array of strings. 
Example: ["Travel Impact Alert: No disruptions expected today.", "Weather: Clear at all layovers.", "Airport Status: Normal operations at JFK."]`,
            },
            {
              role: "user",
              content: `Airports on Route: ${locationQuery}\n\nLive Data from Tavily:\n${articles}`,
            },
          ],
          temperature: 0.2,
        }),
      },
    );

    if (!groqResponse.ok) {
      throw new Error("Groq API failed");
    }

    const groqData = await groqResponse.json();
    let news_summary = [];

    try {
      const rawContent = groqData.choices[0].message.content
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      news_summary = JSON.parse(rawContent);
    } catch (e) {
      console.error("Failed to parse Groq response:", e);
      news_summary = [
        "Travel Impact Alert: Live updates currently unavailable.",
      ];
    }
    return new Response(JSON.stringify({ news_summary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("News fetch error:", error.message);
    // Silent failure returning a 200 so the UI doesn't crash the instructions
    return new Response(JSON.stringify({ news_summary: [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
