import { FlightDetails, Instructions, Trip } from "@/types";
import { supabase } from "@/utils/supabase";

export const tripService = {
    async saveTrip(
        flights: FlightDetails[],
        instructions: Instructions
    ): Promise<Trip> {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error("User not authenticated");

        const firstFlight = flights[0];
        const lastFlight = flights[flights.length - 1];

        const { data, error } = await supabase
            .from("trips")
            .insert({
                user_id: user.id,
                all_flights: flights,
                instructions: instructions,
                route_overview: instructions.route_overview,
                from_city: firstFlight.from,
                from_code: firstFlight.from_code,
                to_city: lastFlight.to,
                to_code: lastFlight.to_code,
                departure_date: firstFlight.date,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getTrips(): Promise<Trip[]> {
        const { data, error } = await supabase
            .from("trips")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getTripById(id: string): Promise<Trip> {
        const { data, error } = await supabase
            .from("trips")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw error;
        return data;
    },

    async deleteTrip(id: string): Promise<void> {
        const { error } = await supabase.from("trips").delete().eq("id", id);
        if (error) throw error;
    },
};