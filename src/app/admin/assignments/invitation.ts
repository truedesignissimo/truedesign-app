type ManagedUser = {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
};

type AuthError = { message: string } | null;

type AdminAuth = {
  admin: {
    createUser(input: {
      email: string;
      email_confirm: boolean;
      user_metadata: { full_name: string; user_type: "interno" | "cliente" };
    }): Promise<{ data: { user: ManagedUser | null }; error: AuthError }>;
    updateUserById(
      userId: string,
      input: {
        email_confirm: boolean;
        user_metadata: { full_name: string; user_type: "interno" | "cliente" };
      }
    ): Promise<{ data: { user: unknown }; error: AuthError }>;
    deleteUser(userId: string): Promise<{ data: unknown; error: AuthError }>;
  };
  resetPasswordForEmail(
    email: string,
    options: { redirectTo: string }
  ): Promise<{ data: unknown; error: AuthError }>;
};

type ProvisionInput = {
  email: string;
  fullName: string;
  userType: "interno" | "cliente";
  redirectTo: string;
  existingUser: ManagedUser | null;
};

export async function provisionAdminUser(auth: AdminAuth, input: ProvisionInput) {
  const metadata = { full_name: input.fullName, user_type: input.userType };
  let user = input.existingUser;
  let created = false;

  if (!user) {
    const result = await auth.admin.createUser({
      email: input.email,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (result.error || !result.data.user) {
      throw new Error(result.error?.message || "Non è stato possibile creare l’utente.");
    }

    user = result.data.user;
    created = true;
  } else if (!user.email_confirmed_at) {
    const result = await auth.admin.updateUserById(user.id, {
      email_confirm: true,
      user_metadata: metadata,
    });

    if (result.error) {
      throw new Error(result.error.message || "Non è stato possibile attivare l’utente.");
    }
  }

  const emailResult = await auth.resetPasswordForEmail(input.email, {
    redirectTo: input.redirectTo,
  });

  if (emailResult.error) {
    if (created) await auth.admin.deleteUser(user.id);
    throw new Error("Non è stato possibile inviare l’email per scegliere la password.");
  }

  return { user, created };
}
