export type SwipeDecision = "like" | "pass";

/** Gesture Handler reports px/second; the existing model uses px/millisecond. */
export function gestureSwipeDirection(
  dx: number,
  velocityX: number,
): SwipeDecision | null {
  "worklet";
  const vx = velocityX / 1000;
  if (!Number.isFinite(dx) || !Number.isFinite(vx)) return null;
  if (
    Math.abs(dx) >= 120 ||
    (Math.abs(dx) >= 25 &&
      Math.abs(vx) >= 0.65 &&
      Math.sign(dx) === Math.sign(vx))
  ) {
    return dx > 0 ? "like" : "pass";
  }
  return null;
}

/** A second guard on RN protects a pending service request from duplicate commits. */
export async function commitSwipeTransaction(
  transaction: { locked: boolean },
  decision: SwipeDecision,
  onDecision: (decision: SwipeDecision) => Promise<void>,
  onCommit: () => void,
  onSettled: () => void,
): Promise<boolean> {
  if (transaction.locked) return false;
  transaction.locked = true;
  try {
    onCommit();
    await onDecision(decision);
    return true;
  } finally {
    transaction.locked = false;
    onSettled();
  }
}
