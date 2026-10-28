import React from "react";
import { Modal } from "react-native";
import type { NativeSheetProps } from "./native-sheet";

// Use React Native's native Android Modal so nested @expo/ui Compose Host
// buttons, pickers, and keyboard resize work without AndroidView-in-Compose touch conflicts.
export default function NativeSheet({ visible, dismissible, onClose, children }: NativeSheetProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={() => {
        if (dismissible) onClose();
      }}
    >
      {children}
    </Modal>
  );
}
