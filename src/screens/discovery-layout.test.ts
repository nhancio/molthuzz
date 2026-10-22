import assert from "node:assert/strict";
import test from "node:test";
import { discoveryLayout } from "./discovery-layout.ts";

test("390 × 844 phone keeps card and actions inside the measured usable area", () => {
  // Safe areas, app header, demo label and bottom tabs have already consumed 271px.
  const result = discoveryLayout({
    availableHeight: 573,
    cardWidth: 354,
    headerHeight: 57,
    controlsHeight: 100,
    fontScale: 1,
  });
  assert.ok(result.cardHeight >= 350);
  assert.ok(result.contentHeight <= 573);
  assert.equal(result.needsScroll, false);
});

test("320 × 568 phone preserves a readable card and scrolls to the actions", () => {
  const result = discoveryLayout({
    availableHeight: 320,
    cardWidth: 284,
    headerHeight: 57,
    controlsHeight: 100,
    fontScale: 1,
  });
  assert.ok(result.cardHeight >= 280);
  assert.ok(result.contentHeight > 320);
  assert.equal(result.needsScroll, true);
});

test("large accessibility text uses measured chrome and scrolls rather than shrinking the card", () => {
  const result = discoveryLayout({
    availableHeight: 573,
    cardWidth: 354,
    headerHeight: 114,
    controlsHeight: 174,
    fontScale: 2,
  });
  assert.ok(result.cardHeight >= 380);
  assert.ok(result.contentHeight >= 688);
  assert.equal(result.needsScroll, true);
});

test("tablet layout keeps the portrait card bounded instead of growing into a dashboard", () => {
  const result = discoveryLayout({
    availableHeight: 980,
    cardWidth: 480,
    headerHeight: 57,
    controlsHeight: 100,
    fontScale: 1,
  });
  assert.equal(result.cardHeight, 560);
  assert.equal(result.needsScroll, false);
});
