import { useCallback, useLayoutEffect, useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import { useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router";
import { Badge, Button, Card, Empty, ErrorText, Loading, Screen, Title } from "../../../src/components/ui";
import { PhotoGrid } from "../../../src/components/PhotoGrid";
import { api } from "../../../src/lib/api";
import { friendlyError } from "../../../src/lib/errors";
import { formatWhen } from "../../../src/lib/format";
import { colors, radius } from "../../../src/theme";
import type { Photo, Rental } from "../../../src/types";

export default function CustomerRentalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [rental, setRental] = useState<(Rental & { photos?: Photo[] }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await api<{ rental: Rental & { photos?: Photo[] } }>(`/api/my/rentals/${id}`);
      setRental(data.rental);
      setError(null);
      navigation.setOptions({ title: data.rental.equipment?.label || "Rental" });
    } catch (err) {
      setRental(null);
      setError(friendlyError(err, "Could not load rental."));
    } finally {
      setRefreshing(false);
    }
  }, [id, navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useLayoutEffect(() => {
    if (rental?.equipment?.label) {
      navigation.setOptions({ title: rental.equipment.label });
    }
  }, [navigation, rental?.equipment?.label]);

  if (!rental && !error) return <Loading />;

  if (!rental) {
    return (
      <Screen>
        <Title title="Rental unavailable" subtitle="This rental is missing or belongs to another company." />
        <ErrorText message={error} />
        <Empty title="Nothing to show" body="Go back to My rentals, or retry if the yard server dropped." />
        <Button label="Retry" onPress={load} />
      </Screen>
    );
  }

  const before = (rental.photos || []).filter((photo) => photo.type === "DELIVERY");
  const after = (rental.photos || []).filter((photo) => photo.type === "PICKUP");
  const estimate = rental.charge.isEstimate;

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <Title
        title={rental.equipment?.label || "Rental"}
        subtitle={`${rental.rateLabel} · only visible to your company account`}
      />
      <ErrorText message={error} />

      <View style={{ marginBottom: 12 }}>
        <Badge status={rental.status} />
      </View>

      <View style={[styles.chargeHero, estimate ? styles.chargeEst : styles.chargeFinal]}>
        <Text style={styles.chargeKicker}>{estimate ? "Estimated until pickup" : "Final amount"}</Text>
        <Text style={styles.chargeAmount}>{rental.charge.formatted}</Text>
        <Text style={styles.chargeMeta}>
          {rental.charge.durationLabel}
          {rental.charge.billedUnits
            ? ` · ${rental.charge.billedUnits} ${rental.charge.unitLabel}`
            : ""}
        </Text>
        {estimate ? (
          <Text style={styles.chargeNote}>
            This estimate updates while the machine is on rent. The final charge is set when pickup is completed.
          </Text>
        ) : (
          <Text style={styles.chargeNote}>
            Final charge from Ridgeline billing. Contact the yard if you have questions about this amount.
          </Text>
        )}
      </View>

      <Card>
        <Text style={styles.section}>Jobsite</Text>
        <Text style={styles.value}>{rental.destination || "No destination on file"}</Text>
        <Text style={[styles.section, { marginTop: 14 }]}>Timeline</Text>
        <Text style={styles.meta}>Started {formatWhen(rental.startAt)}</Text>
        <Text style={styles.meta}>Scheduled pickup {formatWhen(rental.expectedPickupAt)}</Text>
        <Text style={styles.meta}>Returned {formatWhen(rental.endAt)}</Text>
        {rental.notes ? (
          <>
            <Text style={[styles.section, { marginTop: 14 }]}>Notes</Text>
            <Text style={styles.value}>{rental.notes}</Text>
          </>
        ) : null}
      </Card>

      <Title title="Condition photos" subtitle="Before-delivery and after-pickup photos from the yard crew." />
      <Card>
        <PhotoGrid
          label="Before delivery"
          photos={before}
          empty="Photos appear after the delivery inspection is completed."
        />
        <PhotoGrid
          label="After pickup"
          photos={after}
          empty="Photos appear after the pickup inspection is completed."
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chargeHero: {
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 12,
  },
  chargeEst: { backgroundColor: colors.ink },
  chargeFinal: { backgroundColor: colors.success },
  chargeKicker: {
    color: "rgba(255,255,255,0.72)",
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  chargeAmount: { color: colors.white, fontSize: 36, fontWeight: "700", marginTop: 8 },
  chargeMeta: { color: "rgba(255,255,255,0.8)", marginTop: 6 },
  chargeNote: { color: "rgba(255,255,255,0.78)", marginTop: 12, lineHeight: 20 },
  section: { fontWeight: "700", color: colors.ink },
  value: { color: colors.ink, marginTop: 4, lineHeight: 20 },
  meta: { color: colors.muted, marginTop: 4 },
});
