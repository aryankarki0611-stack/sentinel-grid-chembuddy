import { supabase } from "./supabaseClient";

export async function testSupabaseConnection() {
  const { data, error } = await supabase
    .from("scans")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Supabase connection failed:", error);
    return false;
  }

  console.log("Supabase connected:", data);
  return true;
}