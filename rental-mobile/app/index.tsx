import { Redirect } from "expo-router";
import { useAuth } from "../src/lib/auth";
import { homeFor } from "../src/lib/format";
import { Loading } from "../src/components/ui";

export default function Index() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Redirect href="/login" />;
  return <Redirect href={homeFor(user.role) as "/(owner)/dashboard"} />;
}
