import { useEffect } from "react";
import { useRouter } from "expo-router";
import { supabase } from "../services/supabase"; // adjust path if different
import { useAuth } from "./useAuth";

export function useRoleRedirect() {
  const router = useRouter();
  const { user } = useAuth(); // your hook should expose logged in user

  useEffect(() => {
    if (!user) return;

    const checkRole = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching role:", error.message);
        return;
      }

      const role = data?.role || "user";

      if (role === "admin") {
        router.replace("/admin-dashboard");
      } else if (role === "coach") {
        router.replace("/coach-dashboard");
      } else if (role === "nutritionist") {
        router.replace("/nutritionist-dashboard");
      } else {
        router.replace("/(tabs)"); // default for end users
      }
    };

    checkRole();
  }, [user, router]);
}
