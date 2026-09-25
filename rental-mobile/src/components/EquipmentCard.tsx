import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Badge } from "./ui";
import { RemoteImage } from "./RemoteImage";
import { StripeCard } from "./StripeCard";
import { cardStyles, colors, radius, scale, stripeForEquipmentStatus } from "../theme";
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
      <View style={styles.row}>
        <RemoteImage uri={item.photoUrl} style={styles.thumb} accessibilityLabel={`${item.label} photo`} />
        <View style={styles.body}>
          <Badge status={item.status} />
          <Text style={cardStyles.cardTitle} numberOfLines={2}>
            {item.label}
          </Text>
          <Text style={cardStyles.cardMeta} numberOfLines={1}>
            {meta || `${item.type} · ${item.rateLabel}`}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={scale(18)} color={colors.placeholder} />
      </View>
    </StripeCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: scale(12), alignItems: "center" },
  thumb: { width: scale(84), height: scale(84), borderRadius: radius.sm, backgroundColor: colors.line },
  body: { flex: 1, minWidth: 0 },
});
