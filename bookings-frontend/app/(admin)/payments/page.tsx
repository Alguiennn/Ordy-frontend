import { getPayments } from "@/lib/api";
import PaymentsClient from "./PaymentsClient";

export default async function PaymentsPage() {
  // Traemos los datos de la API en el servidor
  const payments = await getPayments().catch(() => []);

  // Se los pasamos al componente cliente que acabamos de unificar
  return <PaymentsClient initialPayments={payments || []} />;
}