import { useCallback, useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import { Card, Empty, ErrorText, Loading, Screen, SectionTitle, Title } from "../../src/components/ui";
import { api } from "../../src/lib/api";
import { friendlyError } from "../../src/lib/errors";
import { colors, radius } from "../../src/theme";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  rentalCount: number;
};

type Employee = {
  id: string;
  name: string;
  email: string;
  clockedIn: boolean;
  todayLabel: string;
  openJobs: number;
};

export default function PeopleScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [customerData, employeeData] = await Promise.all([
        api<{ customers: Customer[] }>("/api/customers"),
        api<{ employees: Employee[] }>("/api/employees"),
      ]);
      setCustomers(customerData.customers);
      setEmployees(employeeData.employees);
      setError(null);
    } catch (err) {
      setError(friendlyError(err, "Could not load people."));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!customers.length && !employees.length && !error && refreshing) return <Loading />;

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <Title
        title="People"
        subtitle="Customers only see their own rentals. Employee clock time is separate from rental duration."
      />
      <ErrorText message={error} />

      <SectionTitle title="Employees" />
      {employees.length === 0 ? (
        <Empty title="No employees" body="Add crew on the website." />
      ) : (
        employees.map((employee) => (
          <Card key={employee.id}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{employee.name}</Text>
                <Text style={styles.meta}>{employee.email}</Text>
              </View>
              <View style={[styles.badge, employee.clockedIn ? styles.badgeOn : styles.badgeOff]}>
                <Text style={[styles.badgeText, employee.clockedIn && { color: colors.success }]}>
                  {employee.clockedIn ? "Clocked in" : "Out"}
                </Text>
              </View>
            </View>
            <Text style={styles.footer}>
              {employee.todayLabel} today · {employee.openJobs} open job{employee.openJobs === 1 ? "" : "s"}
            </Text>
          </Card>
        ))
      )}

      <SectionTitle title="Customers" />
      {customers.length === 0 ? (
        <Empty title="No customers" body="Add companies on the website." />
      ) : (
        customers.map((customer) => (
          <Card key={customer.id}>
            <Text style={styles.name}>{customer.name}</Text>
            <Text style={styles.meta}>{customer.address || customer.email || "No address"}</Text>
            {customer.phone ? <Text style={styles.meta}>{customer.phone}</Text> : null}
            <Text style={styles.footer}>
              {customer.rentalCount} rental{customer.rentalCount === 1 ? "" : "s"}
            </Text>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  name: { fontWeight: "700", fontSize: 16, color: colors.ink },
  meta: { color: colors.muted, marginTop: 3 },
  footer: { marginTop: 10, fontWeight: "600", color: colors.ink },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  badgeOn: { backgroundColor: colors.successBg, borderColor: colors.success },
  badgeOff: { backgroundColor: colors.bg, borderColor: colors.line },
  badgeText: { fontSize: 12, fontWeight: "700", color: colors.muted },
});
