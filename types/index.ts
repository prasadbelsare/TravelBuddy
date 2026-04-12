import { Session, User } from "@supabase/supabase-js";

export type FlightDetails = {
    flight_number: string;
    from: string;
    from_code: string;
    to: string;
    to_code: string;
    date: string;
    departure_time: string;
    arrival_time: string;
    terminal: string;
    gate: string;
    seat: string;
    class: string;
    baggage_allowance: string;
};

export type FlightInfo = {
    flight_number: string;
    route: string;
    departure: string;
    arrival: string;
    note: string;
};

export type LegType = "departure" | "transit" | "arrival";

export type Leg = {
    airport: string;
    type: LegType;
    instructions: string[];
    security: string[];
    immigration?: string[];
    flight_info?: FlightInfo;
};

export type Instructions = {
    route_overview: string;
    general_precautions: string[];
    visa_reminder: string[];
    legs: Leg[];
    final_arrival: string[];
    connecting_tips: string[];
};

export type GroupedFlights = Record<string, FlightDetails[]>;

export type AuthContextType = {
    user: User | null;
    session: Session | null;
    initialized: boolean;
};

export type Trip = {
    id: string;
    user_id: string;
    all_flights: FlightDetails[];
    instructions: Instructions;
    route_overview: string;
    from_city: string;
    from_code: string;
    to_city: string;
    to_code: string;
    departure_date: string;
    created_at: string;
};
export type Message = {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
};

export type ConversationEntry = {
    role: string;
    content: string;
};