export const DISCOVERY_CARD_GAP = 14;
export const DISCOVERY_BOTTOM_PADDING = 8;

export function discoveryLayout({
  availableHeight,
  cardWidth,
  headerHeight,
  controlsHeight,
  fontScale,
}: {
  availableHeight: number;
  cardWidth: number;
  headerHeight: number;
  controlsHeight: number;
  fontScale: number;
}) {
  // Readability wins on small screens: the ScrollView exposes controls below this minimum.
  const minimumHeight = 280 + 260 * Math.max(0, fontScale - 1);
  const portraitHeight = Math.max(
    minimumHeight,
    Math.min(560, cardWidth / 0.75),
  );
  const chromeHeight =
    headerHeight +
    controlsHeight +
    DISCOVERY_CARD_GAP +
    DISCOVERY_BOTTOM_PADDING;
  const cardHeight = Math.max(
    minimumHeight,
    Math.min(portraitHeight, availableHeight - chromeHeight),
  );
  const contentHeight = chromeHeight + cardHeight;
  return {
    cardHeight,
    contentHeight,
    needsScroll: contentHeight > availableHeight + 1,
  };
}
