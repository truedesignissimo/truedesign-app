"use server";

import { completePasswordSetup } from "@/lib/password-setup";
import { createClient } from "@/lib/supabase-server";

export async function setPasswordFromRecoveryToken(
  tokenHash: string,
  password: string
) {
  const supabase = await createClient();
  return completePasswordSetup({
    tokenHash,
    password,
    gateway: {
      async verifyRecoveryToken(candidateToken) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: candidateToken,
          type: "recovery",
        });
        return !error;
      },
      async updatePassword(nextPassword) {
        const { error } = await supabase.auth.updateUser({
          password: nextPassword,
        });
        return !error;
      },
    },
  });
}
