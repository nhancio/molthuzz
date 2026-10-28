import type React from "react";
export type NativeIconActionProps = {
  children: React.ReactNode;
  label: string;
  onPress: () => void;
  disabled: boolean;
};
