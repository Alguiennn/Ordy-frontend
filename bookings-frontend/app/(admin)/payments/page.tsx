import { getPayments } from "@/lib/api.ts.cpy";
import PaymentsClient from "./PaymentsClient";

export default async function PaymentsPage() {
  const payments = await getPayments();
  return <PaymentsClient initialPayments={payments} />;
}