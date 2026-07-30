export type AdminInvitationTransaction = {
  prepare(): Promise<void>;
  approve(): Promise<void>;
  send(): Promise<void>;
  rollback(): Promise<void>;
};

export async function runAdminInvitationTransaction(
  transaction: AdminInvitationTransaction
) {
  try {
    await transaction.prepare();
    await transaction.approve();
    await transaction.send();
  } catch (error) {
    try {
      await transaction.rollback();
    } catch {
      throw new Error(
        "Operazione non completata e ripristino automatico non riuscito. Verifica l’utente nel pannello."
      );
    }
    throw error;
  }
}
