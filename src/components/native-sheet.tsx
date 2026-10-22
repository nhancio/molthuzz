import React from "react";
import { BottomSheet, Host, RNHostView } from "@expo/ui";
import { interactiveDismissDisabled } from "@expo/ui/swift-ui/modifiers";
import { colors } from "../theme";

export interface NativeSheetProps {
  visible: boolean;
  dismissible: boolean;
  onClose: () => void;
  children: React.ReactElement;
}

// The universal sheet supplies native presentation; RNHostView is essential:
// the shared form fields, scroll view and buttons remain React Native children.
export default function NativeSheet({ visible, dismissible, onClose, children }: NativeSheetProps) {
  return (
    <Host colorScheme="light" seedColor={colors.ink} style={{ position: "absolute" }} pointerEvents="box-none">
      <BottomSheet
        isPresented={visible}
        onDismiss={() => { if (dismissible) onClose(); }}
        snapPoints={["full"]}
        containerColor={colors.paper}
        contentPadding={0}
        shouldDismissOnBackPress={dismissible}
        shouldDismissOnClickOutside={dismissible}
        modifiers={[interactiveDismissDisabled(!dismissible)]}
      >
        <RNHostView style={{ height: "100%" }}>{children}</RNHostView>
      </BottomSheet>
    </Host>
  );
}
