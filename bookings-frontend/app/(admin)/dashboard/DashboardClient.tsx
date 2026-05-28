'use client';

import { useState } from 'react';
import Link from 'next/link';
import { museoModerno } from '@/lib/fonts';
import TypewriterGreeting from '@/components/TypewriterGreeting';
import ExportReportButton from './ExportReportButton';
import type { Booking, Payment, Business, Customer, BookingStatus } from "@/lib/api";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface DashboardClientProps {
  initialBookings: Booking[];
  initialPayments: Payment[];
  businesses: Business[];
  customers: Customer[];
}

// Subcomponentes de UI integrados con semántica limpia
function Badge({ status }: { status: BookingStatus }) {
  const labels: Record<BookingStatus, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    paid: 'Pagada'
  };
  return <span className={`badge badge--${status}`}>{labels[status] ?? status}</span>;
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

// Helpers de fechas
function parseBookingDate(booking: Booking) {
  return new Date(`${booking.date}T${booking.time}`);
}

function isToday(date: Date) {
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && 
         date.getMonth() === now.getMonth() && 
         date.getDate() === now.getDate();
}

function isCurrentMonth(date: Date) {
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && 
         date.getMonth() === now.getMonth();
}

export default function DashboardClient({ 
  initialBookings, 
  initialPayments, 
  businesses, 
  customers 
}: DashboardClientProps) {
  
  // Estado reactivo por si en el futuro añadimos mutaciones en tiempo real
  const [bookings] = useState<Booking[]>(initialBookings);
  const [payments] = useState<Payment[]>(initialPayments);

  const now = new Date();

  // Fase 5: Mapas de relaciones para evitar búsquedas O(N) costosas en render
  const businessMap = new Map(businesses.map(b => [b.id, b.name]));
  const customerMap = new Map(customers.map(c => [c.id, c.name]));

  // 📊 CÁLCULOS FILTRADOS POR FECHAS (Datos Reales)
  const bookingsToday = bookings.filter(b => { 
    const d = parseBookingDate(b); 
    return !Number.isNaN(d.getTime()) && isToday(d); 
  });

  const bookingsMonth = bookings.filter(b => { 
    const d = parseBookingDate(b); 
    return !Number.isNaN(d.getTime()) && isCurrentMonth(d); 
  });

  // Métricas para KPIs
  const totalToday = bookingsToday.length;
  const pendingToday = bookingsToday.filter(b => b.status === 'pending').length;
  const activeCustomersThisMonth = new Set(bookingsMonth.map(b => b.customerId)).size;
  
  const paidPaymentsToday = payments.filter(p => { 
    const d = new Date(p.date); 
    return !Number.isNaN(d.getTime()) && p.status === 'paid' && isToday(d); 
  });
  const collectedToday = paidPaymentsToday.reduce((sum, p) => sum + (p.amount ?? 0), 0);

  // Próxima reserva y agenda futura ordenada
  const upcomingBookings = bookings
    .filter(b => { 
      const d = parseBookingDate(b); 
      return !Number.isNaN(d.getTime()) && d >= now; 
    })
    .sort((a, b) => parseBookingDate(a).getTime() - parseBookingDate(b).getTime());

  const nextBooking = upcomingBookings[0];

  // Comercio destacado de hoy (Fase 6: Evitando mensajes estáticos)
  const businessCountsToday = bookingsToday.reduce<Record<number, number>>((acc, b) => {
    acc[b.businessId] = (acc[b.businessId] ?? 0) + 1; 
    return acc;
  }, {});

  const featuredBusinessId = Object.keys(businessCountsToday).reduce<number | null>((w, k) => {
    const id = Number(k); 
    return w === null ? id : businessCountsToday[id] > businessCountsToday[w] ? id : w;
  }, null);

  const featuredBusinessName = featuredBusinessId !== null 
    ? (businessMap.get(featuredBusinessId) ?? `Comercio ${featuredBusinessId}`) 
    : 'Sin actividad hoy';
  const featuredBusinessCount = featuredBusinessId !== null ? businessCountsToday[featuredBusinessId] : 0;

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <TypewriterGreeting messages={['Hola de nuevo :)', 'Echa un vistazo a las novedades.']} loop={false} />
          <p>
            Aquí tienes lo que está pasando en <span className={museoModerno.className}>Ordy</span> hoy.
          </p>
        </div>
        <ExportReportButton
          bookings={bookings}
          customers={customers}
          businesses={businesses}
          payments={payments}
        />
      </section>

      {/* 🛠️ TARJETAS KPI UNIFICADAS (Sin duplicados y con datos reales) */}
      <section className="kpi-grid">
        <KpiCard
          title="Reservas hoy"
          value={String(totalToday)}
          subtitle={`${pendingToday} pendientes de confirmación`}
          variant="positive"
        />
        <KpiCard 
          title="Cobrado hoy" 
          value={new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(collectedToday)} 
          subtitle={`${paidPaymentsToday.length} ${paidPaymentsToday.length === 1 ? 'pago cerrado' : 'pagos cerrados'}`} 
        />
        <KpiCard
          title="Pendientes"
          value={String(pendingToday)}
          subtitle={pendingToday > 0 ? "Seguimiento necesario" : "¡Todo al día!"}
          variant={pendingToday > 0 ? "warning" : undefined}
        />
        <KpiCard 
          title="Clientes activos" 
          value={String(activeCustomersThisMonth)} 
          subtitle="Interacciones este mes" 
        />
      </section>

      <section className="dashboard-grid">
        {/* Tabla Principal */}
        <div className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Próximas reservas</h3>
            <Link href="/bookings" className="panel-subtle-link">Ver todas</Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Cliente</th>
                <th>Comercio</th>
                <th>Servicio</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {upcomingBookings.length > 0 ? (
                upcomingBookings.map(booking => (
                  <tr key={booking.id}>
                    <td>{new Date(booking.date).toLocaleDateString('es-ES')}</td>
                    <td style={{ fontWeight: 600 }}>{booking.time}</td>
                    <td>{customerMap.get(booking.customerId) ?? `Cliente ${booking.customerId}`}</td>
                    <td>{businessMap.get(booking.businessId) ?? `Comercio ${booking.businessId}`}</td>
                    <td>{booking.serviceName}</td>
                    <td><Badge status={booking.status} /></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                    No hay reservas próximas en la agenda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Info Stack Lateral (Glassmorphic) */}
        <div className="info-stack">
          <div className="info-box">
            <p className="info-box__eyebrow">Siguiente reserva</p>
            <p className="info-box__title">
              {nextBooking ? (customerMap.get(nextBooking.customerId) ?? 'Cliente indefinido') : 'Sin reservas próximas'}
            </p>
            <p className="info-box__text">
              {nextBooking 
                ? `${nextBooking.time} · ${businessMap.get(nextBooking.businessId) ?? `Comercio ${nextBooking.businessId}`}` 
                : 'Agenda despejada'}
            </p>
          </div>
          
          <div className="info-box">
            <p className="info-box__eyebrow">Comercio destacado</p>
            <p className="info-box__title">{featuredBusinessName}</p>
            <p className="info-box__text">
              {featuredBusinessCount} {featuredBusinessCount === 1 ? 'reserva hoy' : 'reservas hoy'}
            </p>
          </div>
          
          <div className="info-box">
            <p className="info-box__eyebrow">Recordatorios</p>
            <p className="info-box__title">
              {pendingToday} por confirmar
            </p>
            <p className="info-box__text">
              {pendingToday > 0 ? "Revisión recomendada esta mañana" : "¡Excelente gestión!"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
