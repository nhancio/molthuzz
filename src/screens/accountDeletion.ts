import type { AuthUser, Membership } from "../lib/contracts";

type DeletionServices = {
  reauthenticate: () => Promise<void>;
  cancelBilling: (user: AuthUser) => Promise<void>;
  deleteData: (uid: string) => Promise<void>;
  deleteAuth: () => Promise<void>;
};

// Keep this sequence testable: no destructive step can precede confirmed billing cancellation.
export async function deleteAccountSafely(
  user: AuthUser,
  membership: Membership | null,
  billingConfigured: boolean,
  services: DeletionServices,
): Promise<void> {
  await services.reauthenticate();
  // Pending mandates can live on the server before any entitlement exists.
  if (billingConfigured || membership?.subscriptionId) {
    await services.cancelBilling(user);
  }
  await services.deleteData(user.uid);
  await services.deleteAuth();
}
