import { getAppointments, getCustomers, getPayments, getBusinesses } from "@/lib/api";
import DashboardClient from "./DashboardClient";

// 1. Este componente corre 100% en el servidor.
// 2. Hace fetch de todos los catálogos en paralelo sin bloquear la UI.
export default async function DashboardPage() {
  const [bookings, payments, businesses, customers] = await Promise.all([
    getAppointments(),
    getPayments().catch(() => []), // Salvaguarda por si el endpoint falla
    getBusinesses(),
    getCustomers(),
  ]);

  return (
    <DashboardClient 
      initialBookings={bookings}
      initialPayments={payments}
      businesses={businesses}
      customers={customers}
    />
  );
}