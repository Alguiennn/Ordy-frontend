import { getBusinesses } from "@/lib/api";
import BusinessClient from "./BusinessClient";

export default async function BusinessesPage() {
  const businesses = await getBusinesses();
  return <BusinessClient initialBusinesses={businesses} />;
}