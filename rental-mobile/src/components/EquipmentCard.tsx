import { Text } from "react-native";
import { Badge } from "./ui";
import { StripeCard } from "./StripeCard";
import { cardStyles, stripeForEquipmentStatus } from "../theme";
import type { Equipment } from "../types";

export function EquipmentCard({
  item,
  onOpen,
  meta,
}: {
  item: Equipment;
  onOpen: () => void;
  meta?: string;
}) {
  return (
    <StripeCard
      stripeColor={stripeForEquipmentStatus(item.status)}
      onPress={onOpen}
      accessibilityLabel={`Open ${item.label}`}
    >
      <Badge status={item.status} />
      <Text style={cardStyles.cardTitle}>{item.label}</Text>
      <Text style={cardStyles.cardMeta}>{meta || `${item.type} · ${item.rateLabel}`}</Text>
      <Text style={cardStyles.cardCta}>View history →</Text>
    </StripeCard>
  );
}
