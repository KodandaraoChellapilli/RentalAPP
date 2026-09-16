import { type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { cardStyles } from "../theme";

export function StripeCard({
  stripeColor,
  onPress,
  children,
  accessibilityLabel,
}: {
  stripeColor: string;
  onPress?: () => void;
  children: ReactNode;
  accessibilityLabel?: string;
}) {
  const card = (
    <View style={cardStyles.stripeCard}>
      <View style={[cardStyles.stripe, { backgroundColor: stripeColor }]} />
      <View style={cardStyles.stripeBody}>{children}</View>
    </View>
  );

  if (!onPress) return card;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => pressed && { opacity: 0.92 }}
    >
      {card}
    </Pressable>
  );
}
