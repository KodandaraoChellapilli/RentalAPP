import { useCallback, useLayoutEffect, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router";
import { Badge, Button, Card, Empty, ErrorText, Loading, Screen, Title } from "../../../src/components/ui";
import { PhotoGrid } from "../../../src/components/PhotoGrid";
import { RemoteImage } from "../../../src/components/RemoteImage";
import { api } from "../../../src/lib/api";
import { friendlyError } from "../../../src/lib/errors";
import { formatWhen } from "../../../src/lib/format";
import { conditionPhotos } from "../../../src/lib/photos";
import { colors, radius } from "../../../src/theme";
import type { Equipment, Photo, Rental } from "../../../src/types";

type Detail = {
  equipment: Equipment;
  currentRental: Rental | null;
  history: Array<Rental & { photos?: Photo[] }>;
  photos?: Photo[];
};

export default function EmployeeEquipmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const next = await api<Detail>(`/api/equipment/${id}`);
      setData(next);
      setError(null);
      navigation.setOptions({ title: next.equipment.label });
    } catch (err) {
      setData(null);
      setError(friendlyError(err, "Could not load equipment."));
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
    if (data?.equipment.label) {
      navigation.setOptions({ title: data.equipment.label });
    }
  }, [data?.equipment.label, navigation]);

  if (!data && !error) return <Loading />;

  if (!data) {
    return (
      <Screen>
        <Title title="Machine unavailable" subtitle="Could not open this equipment record." />
        <ErrorText message={error} />
        <Empty title="Try again" body="This machine may not be assigned to you. Pull to refresh, or retry." />
        <Button label="Retry" onPress={load} />
      </Screen>
    );
  }

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <Title title={data.equipment.label} subtitle={`${data.equipment.type} · ${data.equipment.rateLabel}`} />
      <ErrorText message={error} />
      {data.photos?.[0] || data.equipment.photoUrl ? (
        <RemoteImage
          uri={data.photos?.[0]?.url || data.equipment.photoUrl}
          style={{ width: "100%", height: 180, borderRadius: radius.md, marginBottom: 12 }}
          accessibilityLabel={`${data.equipment.label} photo`}
        />
      ) : null}
      <View style={{ marginBottom: 12 }}>
        <Badge status={data.equipment.status} />
      </View>
      {data.equipment.notes ? (
        <Card>
          <Text style={{ fontWeight: "700", color: colors.ink }}>Notes</Text>
          <Text style={{ color: colors.muted, marginTop: 4 }}>{data.equipment.notes}</Text>
        </Card>
      ) : null}

      {data.currentRental ? (
        <Card>
          <Text style={{ fontWeight: "700", color: colors.ink }}>Current rental</Text>
          <Text style={{ marginTop: 4, color: colors.ink }}>{data.currentRental.customer?.name}</Text>
          <Text style={{ color: colors.muted }}>{data.currentRental.destination || "No destination"}</Text>
          <Text style={{ color: colors.muted }}>Started {formatWhen(data.currentRental.startAt)}</Text>
          <Text style={{ marginTop: 8, fontWeight: "700", color: colors.ink }}>
            {data.currentRental.charge.formatted}
            {data.currentRental.charge.isEstimate ? " estimated" : ""}
          </Text>
        </Card>
      ) : (
        <Empty title="No current rental" body="This machine is not on an active or scheduled rental." />
      )}

      <Title title="Rental history" />
      {data.history.length === 0 ? (
        <Empty title="No history yet" body="Photos appear after deliveries and pickups are completed." />
      ) : (
        data.history.map((rental) => {
          const { before, after } = conditionPhotos(rental);
          return (
            <Card key={rental.id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                <Text style={{ fontWeight: "700", color: colors.ink, flex: 1 }}>{rental.customer?.name}</Text>
                <Badge status={rental.status} />
              </View>
              <Text style={{ color: colors.muted, marginTop: 4 }}>
                {formatWhen(rental.startAt)} → {formatWhen(rental.endAt)}
              </Text>
              {rental.deliveredBy ? <Text style={{ color: colors.muted }}>Delivered by {rental.deliveredBy}</Text> : null}
              {rental.pickedUpBy ? <Text style={{ color: colors.muted }}>Picked up by {rental.pickedUpBy}</Text> : null}
              {rental.charge.durationLabel ? (
                <Text style={{ color: colors.muted }}>Duration {rental.charge.durationLabel}</Text>
              ) : null}
              <Text style={{ marginTop: 6, fontWeight: "700", color: colors.ink }}>
                {rental.charge.formatted}
                {rental.charge.isEstimate ? " estimated" : " final"}
              </Text>
              {rental.rateLabel ? <Text style={{ color: colors.muted }}>{rental.rateLabel}</Text> : null}
              {rental.conditionNotes ? (
                <Text style={{ marginTop: 8, color: colors.ink, lineHeight: 20 }}>{rental.conditionNotes}</Text>
              ) : rental.notes ? (
                <Text style={{ marginTop: 8, color: colors.ink, lineHeight: 20 }}>{rental.notes}</Text>
              ) : null}
              <PhotoGrid label="Before delivery" photos={before} />
              <PhotoGrid label="After pickup" photos={after} />
            </Card>
          );
        })
      )}
    </Screen>
  );
}
