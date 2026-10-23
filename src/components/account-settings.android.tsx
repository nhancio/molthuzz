import React from "react";
import { Column, ScrollView } from "@expo/ui";
import { useMaterialColors } from "@expo/ui/jetpack-compose";
import { background, clip, fillMaxWidth, padding, Shapes } from "@expo/ui/jetpack-compose/modifiers";
import { spacing, radius } from "../theme";
// A universal FieldGroup.Section adds a ListItem around each child on Android.
// These children already are ListItems: group them once, with Material surfaces.
export function AccountForm({ children }: React.PropsWithChildren) {
  return <ScrollView><Column spacing={spacing.lg} modifiers={[fillMaxWidth(), padding(spacing.md, spacing.md, spacing.md, spacing.md)]}>{children}</Column></ScrollView>;
}
export function AccountSection({ children }: React.PropsWithChildren) {
  const colors = useMaterialColors();
  return <Column modifiers={[fillMaxWidth(), clip(Shapes.RoundedCorner(radius.lg)), background(colors.surfaceContainer)]}>{children}</Column>;
}
export function AccountFooter({ children }: React.PropsWithChildren) {
  return <Column modifiers={[padding(spacing.md, spacing.md, spacing.md, spacing.md)]}>{children}</Column>;
}
