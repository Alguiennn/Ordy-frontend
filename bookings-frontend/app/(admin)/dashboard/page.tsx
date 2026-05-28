import { getAppointments, getCustomers, getPayments, getBusinesses } from "@/lib/api";
import type { BookingStatus, Booking } from "@/lib/api.ts";
import ExportReportButton from './ExportReportButton';

function Badge({ status }: { status: BookingStatus }) {
  const label = status === 'pending' ? 'Pendiente' : status === 'confirmed' ? 'Confirmada' : 'Pagada';
  return <span className={`badge badge--${status}`}>{label}</span>;
}

function KpiCard({ title, value, subtitle, variant }: {
  title: string; value: string; subtitle: string; variant?: 'positive' | 'warning';
}) {
  return (
    <div className="kpi-card">
      <p className="kpi-card__label">{title}</p>
      <h3 className="kpi-card__value">{value}</h3>
      <p className={`kpi-card__meta ${variant === 'positive' ? 'kpi-card__meta--positive' : variant === 'warning' ? 'kpi-card__meta--warning' : ''}`}>
        {subtitle}
      </p>
    </div>
  );
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
}

function parseBookingDate(booking: Booking) {
  return new Date(`${booking.date}T${booking.time}`);
}

function isToday(date: Date) {
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function isCurrentMonth(date: Date) {
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}
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