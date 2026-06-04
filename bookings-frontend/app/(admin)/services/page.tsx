import { getServices } from "@/lib/api";
import ServicesClient from "./ServicesClient";

export default async function ServicesPage() {
  const services = await getServices().catch(() => []);
  return <ServicesClient initialServices={services} />;
}
