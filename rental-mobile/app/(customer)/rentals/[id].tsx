import { useCallback, useLayoutEffect, useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import { useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router";
import { Badge, Button, Card, Empty, ErrorText, Loading, Screen, Title } from "../../../src/components/ui";
import { DateTimeField } from "../../../src/components/DateTimeField";
import { Field } from "../../../src/components/Field";
import { PhotoGrid } from "../../../src/components/PhotoGrid";
import { api } from "../../../src/lib/api";
import { friendlyError } from "../../../src/lib/errors";
import { formatWhen, toDateInput, toTimeInput } from "../../../src/lib/format";
import { colors, radius } from "../../../src/theme";
import type { Photo, Rental } from "../../../src/types";

export default function CustomerRentalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [rental, setRental] = useState<(Rental & { photos?: Photo[] }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pickupAt, setPickupAt] = useState(() => {
    const next = new Date();
    next.setDate(next.getDate() + 1);
    next.setHours(10, 0, 0, 0);
    return next;
  });
  const [pickupLocation, setPickupLocation] = useState("");
  const [pending, setPending] = useState<"pickup" | "confirm" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await api<{ rental: Rental & { photos?: Photo[] } }>(`/api/my/rentals/${id}`);
      setRental(data.rental);
      setPickupLocation((current) => current || data.rental.destination || "");
      if (data.rental.expectedPickupAt) {
        const expected = new Date(data.rental.expectedPickupAt);
        if (!Number.isNaN(expected.getTime())) setPickupAt(expected);
      }
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

  async function requestPickup() {
    if (!rental || pending) return;
    if (!pickupLocation.trim()) {
      setError("Pickup date, time, and location are required.");
      return;
    }
    setPending("pickup");
    setError(null);
    try {
      await api(`/api/my/rentals/${rental.id}/pickup-request`, {
        method: "POST",
        body: JSON.stringify({
          pickupDate: toDateInput(pickupAt),
          pickupTime: toTimeInput(pickupAt),
          pickupLocation: pickupLocation.trim(),
        }),
      });
      setNotice("Pickup requested. The rental stays active until the yard completes the pickup.");
      await load();
    } catch (err) {
      setError(friendlyError(err, "Could not request pickup."));
    } finally {
      setPending(null);
    }
  }

  async function confirmDelivery() {
    if (!rental || pending) return;
    setPending("confirm");
    setError(null);
    try {
      await api(`/api/my/rentals/${rental.id}/confirm-delivery`, { method: "POST", body: "{}" });
      setNotice("Delivery details confirmed. The rental starts when the equipment is delivered.");
      await load();
    } catch (err) {
      setError(friendlyError(err, "Could not confirm delivery."));
    } finally {
      setPending(null);
    }
  }

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
      <Title title={rental.equipment?.label || "Rental"} subtitle={rental.rateLabel} />
      <ErrorText message={error} />
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <View style={{ marginBottom: 12 }}>
        <Badge status={rental.status} />
      </View>

      <Card>
        <Text style={styles.chargeKicker}>{estimate ? "Estimated charge" : "Final amount"}</Text>
        <Text style={styles.chargeAmount}>{rental.charge.formatted}</Text>
        <Text style={styles.chargeMeta}>
          {rental.charge.durationLabel}
          {rental.charge.billedUnits ? ` · ${rental.charge.billedUnits} ${rental.charge.unitLabel}` : ""}
        </Text>
        {estimate ? (
          <Text style={styles.chargeNote}>Updates while the machine is on rent. Final amount is set at pickup.</Text>
        ) : null}
      </Card>

      <Card>
        <Text style={styles.section}>Jobsite</Text>
        <Text style={styles.value}>{rental.destination || "No destination on file"}</Text>
        <Text style={[styles.section, { marginTop: 14 }]}>Timeline</Text>
        <Text style={styles.meta}>Started {formatWhen(rental.startAt)}</Text>
        <Text style={styles.meta}>Scheduled pickup {formatWhen(rental.expectedPickupAt)}</Text>
        <Text style={styles.meta}>Returned {formatWhen(rental.endAt)}</Text>
        {rental.delivery ? <Text style={styles.meta}>Scheduled delivery {formatWhen(rental.delivery.startAt)}</Text> : null}
        {rental.pickupRequest ? (
          <Text style={styles.meta}>
            Pickup requested {formatWhen(rental.pickupRequest.startAt)}
            {rental.pickupRequest.destination ? ` at ${rental.pickupRequest.destination}` : ""}. Still on rent.
          </Text>
        ) : null}
        {rental.notes ? (
          <>
            <Text style={[styles.section, { marginTop: 14 }]}>Notes</Text>
            <Text style={styles.value}>{rental.notes}</Text>
          </>
        ) : null}
      </Card>

      {rental.canConfirmDelivery ? (
        <Card>
          <Text style={styles.section}>Confirm delivery details</Text>
          <Text style={styles.meta}>
            {formatWhen(rental.delivery?.startAt)} at {rental.delivery?.destination || rental.destination || "the jobsite"}
          </Text>
          <Text style={[styles.meta, { marginBottom: 12 }]}>Confirming does not start the rental.</Text>
          <Button label="Confirm delivery" pending={pending === "confirm"} onPress={confirmDelivery} />
        </Card>
      ) : null}

      {rental.canRequestPickup ? (
        <Card>
          <Text style={styles.section}>End rental</Text>
          <Text style={[styles.meta, { marginBottom: 12 }]}>
            Requests a pickup. The rental stays active until pickup is completed.
          </Text>
          <DateTimeField
            label="Pickup date"
            mode="date"
            value={pickupAt}
            onChange={(next) =>
              setPickupAt((current) => {
                const merged = new Date(current);
                merged.setFullYear(next.getFullYear(), next.getMonth(), next.getDate());
                return merged;
              })
            }
          />
          <DateTimeField
            label="Pickup time"
            mode="time"
            value={pickupAt}
            onChange={(next) =>
              setPickupAt((current) => {
                const merged = new Date(current);
                merged.setHours(next.getHours(), next.getMinutes(), 0, 0);
                return merged;
              })
            }
          />
          <Field
            label="Pickup location"
            value={pickupLocation}
            onChangeText={setPickupLocation}
            placeholder="Jobsite address"
          />
          <Button label="Request pickup" variant="dark" pending={pending === "pickup"} onPress={requestPickup} />
        </Card>
      ) : null}

      <Title title="Photos" />
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
  chargeKicker: { color: colors.muted, fontWeight: "600", fontSize: 13 },
  chargeAmount: { color: colors.ink, fontSize: 28, fontWeight: "700", marginTop: 4 },
  chargeMeta: { color: colors.muted, marginTop: 4 },
  chargeNote: { color: colors.muted, marginTop: 8, lineHeight: 20 },
  section: { fontWeight: "700", color: colors.ink },
  value: { color: colors.ink, marginTop: 4, lineHeight: 20 },
  meta: { color: colors.muted, marginTop: 4 },
  notice: {
    color: colors.success,
    backgroundColor: colors.successBg,
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 12,
    lineHeight: 20,
  },
});
