# ✈️ Travel Buddy

An AI-powered app that transforms flight tickets into personalized, step-by-step travel guides — making complex international journeys simple and stress-free.

---

## 🧠 Core Workflow

1. **📤 Upload**
   - Users upload a flight ticket or boarding pass image.

2. **🤖 AI Extraction**
   - Groq Vision LLM extracts flight details (legs, airports, timings).
   - Applies complex travel rules (e.g., US Customs, Schengen entry).

3. **🧭 Journey Generation**
   - Generates a structured JSON itinerary.
   - Provides step-by-step transit instructions for the entire journey.

4. **💬 Conversational Assistant**
   - Users can ask questions about their trip.
   - AI provides contextual answers based on their itinerary.

5. **🗄️ Data Persistence**
   - Stores itinerary and flight data in Supabase PostgreSQL.
   - Securely linked to user sessions.

---

## 🛠️ Tech Stack

- **Frontend:** React Native (Expo Router, TypeScript)
- **Backend & Auth:** Supabase (PostgreSQL, Session Authentication)
- **AI Engine:** Groq API (Vision + Text LLMs)

---

## 📂 Folder Structure
```
TravelBuddy/
├── app/                    # Screens
│   ├── index.tsx           # Onboarding
│   ├── login.tsx
│   ├── signup.tsx
│   └── (app)/
│       ├── home.tsx        # Trip list
│       ├── upload.tsx      # Ticket upload
│       ├── verify.tsx      # Verify flight details
│       ├── trip/[id].tsx   # Journey instructions
│       └── chat/[id].tsx   # AI chat
├── services/
│   ├── authService.ts
│   ├── tripService.ts
│   └── groqService.ts
├── utils/supabase.ts
├── types/index.ts
└── constants/index.ts
```
## 🚀 Quick Start

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/prasadbelsare/TravelBuddy.git
cd TravelBuddy
```

---

### 2️⃣ Install Dependencies

```bash
npm install
```

---

### 3️⃣ Environment Setup

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key
```

---

### 4️⃣ Run the App

```bash
npx expo start -c
```

---

## 📱 Features

- ✈️ Flight ticket image parsing
- 🌍 Multi-leg journey understanding
- 🛂 Travel rules awareness (Customs, Immigration, Transit)
- 🧠 AI-generated travel guidance
- 💬 Chat-based travel assistant
- 🔐 Secure session-based data storage

---

## 📌 Use Cases

- First-time international travelers  
- Complex multi-airline journeys  
- Layover guidance (immigration, baggage, terminals)  
- Real-time travel Q&A  

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

## 📄 License

This project is licensed under the MIT License.

---


## 💡 Inspiration

My parents faced difficulties during their first international trip — navigating airports, understanding layovers, dealing with immigration steps, and figuring out baggage transfers.

Seeing them struggle with unclear instructions and complex travel processes inspired me to build **Travel Buddy** — an app that simplifies every step of a journey into clear, personalized guidance powered by AI.
