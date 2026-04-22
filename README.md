# Travel Buddy

Travel Buddy is a travel utility built to extract actionable transit instructions from raw flight itineraries. Instead of manually parsing layovers, terminal changes, and customs requirements, the application utilizes a multi-stage LLM orchestration pipeline to read ticket images and generate a strict, chronological transit guide.

## Motivation
My parents faced difficulties during their first international trip — navigating airports, understanding layovers, dealing with immigration steps, and figuring out baggage transfers.

Seeing them struggle with unclear instructions and complex travel processes inspired me to build **Travel Buddy** — an app that simplifies every step of a journey into clear, personalized guidance powered by AI.


## System Architecture
The application does not rely on a traditional static database or a standard RAG pipeline. It utilizes an **LLM Orchestration Pipeline**—chaining Vision models, static context injection, and Search-Augmented Generation (Web RAG)—deployed on a serverless stack to maintain data isolation. The project is currently deployed as a mobile-optimized web application, with native Android (APK) deployment planned for the future.

* **Frontend:** React Native (Expo), TypeScript, Expo Router.
* **Backend:** Supabase (PostgreSQL, Authentication).
* **Serverless Compute:** Deno Edge Functions (Supabase).
* **AI Processing:** Groq API (Llama 3 Vision and Text Models).
* **Real-Time Data:** Tavily Search API (Live travel disruption and news aggregation).
* **Infrastructure & Security:** Upstash Redis (Rate Limiting), Vercel (Web Hosting / CI/CD).

## Core Features
* **Multi-Modal Ticket Parsing:** Proxies uploaded ticket images via the `extract-ticket` Edge Function to Groq's Llama 3 Vision model, returning structured JSON itinerary data via zero-shot inference.
* **Live Travel Alerts via Tavily:** The `fetch-travel-news` Edge Function utilizes the Tavily Search API to perform real-time, Search-Augmented Generation. It aggregates live data regarding weather disruptions, airport strikes, and terminal delays specific to the extracted itinerary locations.
* **Trip-Specific AI Assistant:** Context-aware chat functionality (`chat/[id].tsx`) that injects the user's specific JSON itinerary into the system prompt, allowing them to ask logistical questions about their current leg.
* **Multi-Tenant Security & Rate Limiting:** Enforces PostgreSQL Row Level Security (RLS) to isolate user data and utilizes Upstash Redis to prevent LLM API abuse.
* **Mobile Web Deployment:** Engineered as a single React Native codebase exported as a mobile-optimized Progressive Web App (PWA), laying the architectural groundwork for a future native Android APK release.

## Project Structure
```text
TravelBuddy/
├── app/                        
│   ├── (app)/                  
│   │   ├── _layout.tsx
│   │   ├── chat/[id].tsx      
│   │   ├── home.tsx            
│   │   ├── trip/[id].tsx       
│   │   ├── upload.tsx          
│   │   └── verify.tsx           
│   ├── _layout.tsx             
│   ├── index.tsx               
│   ├── login.tsx               
│   └── signup.tsx              
├── assets/images/              
├── components/                 
│   ├── AccordionItem.tsx        
│   └── DismissKeyboardView.tsx 
├── constants/
│   └── index.ts                
├── context/
│   └── AuthContext.tsx         
├── services/                   
│   ├── authService.ts          
│   ├── groqService.ts          
│   └── tripService.ts          
├── supabase/
│   ├── config.toml             
│   └── functions/              
│       ├── chat/                
│       ├── extract-ticket/     
│       ├── fetch-travel-news/  
│       └── generate-instructions/  
├── types/
│   └── index.ts                
├── utils/
│   └── supabase.ts             
├── .env                        
├── app.json                    
├── package.json                
└── vercel.json                 
```
## How to Use
1. **Authenticate:** Create an account or log in via the Supabase Auth interface.
2. **Upload:** Navigate to the upload route and submit an image of a flight ticket containing the full routing information.
3. **Verify:** Review the data extracted by the `extract-ticket` function on the verification screen. Correct any OCR errors before proceeding.
4. **Process:** The system transmits the verified data to the `generate-instructions` Edge Function, validates the output, and writes the structured transit guide to the database.
5. **Navigate & Chat:** Select the generated trip from the dashboard to view the sequential guide. Access the AI chat interface to ask specific logistical questions about your current leg.

## Environment Variables

**Client-Side Variables (`.env.local` / Vercel Dashboard):**
```env
EXPO_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Server-Side Secrets (Supabase Edge Functions):**
These must be stored securely in the Supabase project configuration, never exposed to the client.
```env
GROQ_API_KEY=your_groq_api_key
TAVILY_API_KEY=your_tavily_api_key
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

## Local Development Setup

1. **Clone and Install Dependencies:**
```bash
git clone <repository-url>
cd TravelBuddy
npm install
```

2. **Configure Supabase CLI:**
```bash
npx supabase login
npx supabase link --project-ref <your-project-id>
```

3. **Deploy Edge Functions and Inject Secrets:**
```bash
npx supabase secrets set GROQ_API_KEY=<key> TAVILY_API_KEY=<key> UPSTASH_REDIS_REST_URL=<url> UPSTASH_REDIS_REST_TOKEN=<token>
npx supabase functions deploy
```

4. **Initialize the Development Server:**
```bash
npx expo start
```

## Production Web Deployment (Vercel)
The application is deployed via Vercel as a mobile web application. Deploying an Expo React Native application requires overriding standard build configurations to prevent client-side routing conflicts and asset loading failures.

### 1. Root Routing Configuration
The `vercel.json` file in the root directory forces Vercel to respect client-side routing while explicitly ignoring static Expo assets.

```json
{
  "cleanUrls": true,
  "rewrites": [
    {
      "source": "/((?!assets/|_expo/|favicon\\\\.ico|.*\\\\..*).*)",
      "destination": "/index.html"
    }
  ]
}
```

### 2. Vercel Dashboard Overrides
Link your GitHub repository to a Vercel project and apply the following Build & Development Settings overrides:

* **Framework Preset:** `Other`
* **Build Command:** `npx expo export`
* **Output Directory:** `dist`

Ensure both `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are added to the Vercel Environment Variables before triggering the production build.