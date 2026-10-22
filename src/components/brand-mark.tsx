import React from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Text } from "./LocalizedText";
import { colors, fonts } from "../theme";

export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
    >
      <Text
        style={{
          fontFamily: fonts.serif,
          fontSize: size,
          lineHeight: size * 1.25,
          letterSpacing: -size * 0.045,
          color: colors.ink,
        }}
      >
        makein
      </Text>
      <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 32 32">
        <Path
          d="M16 2v28M2 16h28M6.1 6.1l19.8 19.8M6.1 25.9L25.9 6.1"
          stroke="#7D922F"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
