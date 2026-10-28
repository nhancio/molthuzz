import React from "react";
import { Modal } from "react-native";

export interface NativeSheetProps {
  visible: boolean;
  dismissible: boolean;
  onClose: () => void;
  children: React.ReactElement;
}

// Use UIKit's native pageSheet Modal on iOS so nested @expo/ui Host buttons
// and React Native controls inside the sheet receive direct touch hit-testing.
export default function NativeSheet({ visible, dismissible, onClose, children }: NativeSheetProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        if (dismissible) onClose();
      }}
    >
      {children}
    </Modal>
  );
}
