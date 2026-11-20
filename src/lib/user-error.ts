export function userErrorMessage(error: unknown): string {
  const code = (error as { code?: unknown } | null)?.code;
  if (code === "unavailable" || code === "auth/network-request-failed" || code === "deadline-exceeded")
    return "Check your connection and try again.";
  if (code === "auth/user-token-expired" || code === "auth/invalid-user-token" || code === "unauthenticated")
    return "Your session has expired. Sign in again.";
  if (code === "permission-denied" || code === "storage/unauthorized")
    return "You don’t have permission to complete this action.";
  if (typeof code === "string") return "Something went wrong. Please try again.";
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
