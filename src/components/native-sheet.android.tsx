import React from "react";
import { Host, RNHostView } from "@expo/ui";
import { ModalBottomSheet } from "@expo/ui/jetpack-compose";
import { fillMaxHeight } from "@expo/ui/jetpack-compose/modifiers";
import { colors } from "../theme";
import type { NativeSheetProps } from "./native-sheet";

// Universal BottomSheet 58 does not expose sheetGesturesEnabled. Use the
// Compose sheet directly so pending writes cannot be dismissed by a swipe.
export default function NativeSheet({ visible, dismissible, onClose, children }: NativeSheetProps) {
  if (!visible) return null;
  return (
    <Host colorScheme="light" seedColor={colors.ink} style={{ position: "absolute" }} pointerEvents="box-none">
      <ModalBottomSheet
        onDismissRequest={() => { if (dismissible) onClose(); }}
        skipPartiallyExpanded
        sheetGesturesEnabled={dismissible}
        properties={{ shouldDismissOnBackPress: dismissible, shouldDismissOnClickOutside: dismissible }}
        containerColor={colors.paper}
        contentColor={colors.ink}
      >
        <RNHostView modifiers={[fillMaxHeight()]}>{children}</RNHostView>
      </ModalBottomSheet>
    </Host>
  );
}
