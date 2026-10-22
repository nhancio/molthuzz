import type React from "react";
export type NativeIconActionProps = {
  children: React.ReactNode;
  label: string;
  onPress: () => void;
  disabled: boolean;
};
export type NativeChoiceProps = {
  options: { value: string; label: string }[];
  selected: string;
  onChange: (value: string) => void;
  disabled: boolean;
};
