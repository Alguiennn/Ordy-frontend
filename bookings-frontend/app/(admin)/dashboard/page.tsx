'use client';

import { useEffect, useState } from 'react';
import { museoModerno } from '@/lib/fonts';
import TypewriterGreeting from '@/components/TypewriterGreeting';
import { getAppointments, getPayments } from "@/lib/api";

type DashboardBookingStatus = "pending" | "confirmed" | "paid";

type DashboardBooking = {
  id?: string;
  time: string;
  client: string;
  business: string;
  service: string;
  status: DashboardBookingStatus;
  amount?: number;
};

const initialBookings: DashboardBooking[] = [
  {
    id: "1",
    time: "09:00",
    client: "María López",
    business: "Peluquería Nova",
    service: "Corte + peinado",
    status: "confirmed",
    amount: 50,
  },
  {
    id: "2",
    time: "10:30",
    client: "Carlos Pérez",
    business: "Restaurante Marea",
    service: "Reserva para 4",
    status: "pending",
    amount: 0,
  },
  {
    id: "3",
    time: "12:00",
    client: "Lucía Sánchez",
    business: "Barber Studio",
    service: "Corte caballero",
    status: "paid",
    amount: 25,
  },
];

function Badge({ status }: { status: DashboardBookingStatus }) {
  const label =
    status === "pending"
      ? "Pendiente"
      : status === "confirmed"
        ? "Confirmada"
        : "Pagada";

  return <span className={`badge badge--${status}`}>{label}</span>;
}

function KpiCard({
  title,
  value,
  subtitle,
  variant,
}: {
  title: string;
  value: string;
  subtitle: string;
  variant?: "positive" | "warning";
}) {
  return (
    <div className="kpi-card">
      <p className="kpi-card__label">{title}</p>
      <h3 className="kpi-card__value">{value}</h3>
      <p
        className={`kpi-card__meta ${
          variant === "positive"
            ? "kpi-card__meta--positive"
            : variant === "warning"
              ? "kpi-card__meta--warning"
              : ""
        }`}
      >
        {subtitle}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const [bookingsList, setBookingsList] = useState<DashboardBooking[]>(initialBookings);
  const [totalPaymentsCount, setTotalPaymentsCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Carga de datos real desde los endpoints integrados
  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [appointmentsData, paymentsData] = await Promise.all([
          getAppointments(),
          getPayments().catch(() => []) // Evita que rompa si getPayments aún no está listo
        ]);

        if (appointmentsData) {
          setBookingsList(appointmentsData as any);
        }
        if (paymentsData) {
          setTotalPaymentsCount(paymentsData.length);
        }
      } catch (error) {
        console.error("Error cargando métricas", error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // 📊 CÁLCULOS EN TIEMPO REAL SOBRE EL ESTADO UNIFICADO
  const totalReservasHoy = bookingsList.length;
  
  const pendientesDeConfirmar = bookingsList.filter(
    (b) => b.status === "pending"
  ).length;

  const totalCobradoHoy = bookingsList
    .filter((b) => b.status === "paid")
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const totalPagosRegistrados = bookingsList.filter(
    (b) => b.status === "paid"
  ).length;

  const siguienteReserva = bookingsList.find((b) => b.status !== "pending");
  const recentAppointments = bookingsList.slice(0, 5);

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <TypewriterGreeting messages={['Hola de nuevo :)', 'Echa un vistazo a las novedades.']} loop={false} />
          <p>
            Aquí tienes lo que está pasando en{' '} <span className={museoModerno.className}>Ordy</span> hoy.
          </p>
        </div>
        <button className="primary-btn" type="button">Export report</button>
      </section>

      {/* 🛠️ TARJETAS KPI UNIFICADAS (Quitadas las 4 duplicadas del fondo) */}
      <section className="kpi-grid">
        <KpiCard
          title="Reservas hoy"
          value={String(totalReservasHoy)}
          subtitle="Actualizado en tiempo real"
          variant="positive"
        />
        <KpiCard 
          title="Cobrado hoy" 
          value={`${totalCobradoHoy} €`} 
          subtitle={`${totalPagosRegistrados} pagos registrados`} 
        />
        <KpiCard
          title="Pendientes"
          value={String(pendientesDeConfirmar)}
          subtitle={pendientesDeConfirmar > 0 ? "Seguimiento necesario" : "¡Todo al día!"}
          variant={pendientesDeConfirmar > 0 ? "warning" : undefined}
        />
        <KpiCard title="Clientes activos" value={String(totalReservasHoy)} subtitle="Este mes" />
      </section>

      <section className="dashboard-grid">
        <div className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Próximas reservas</h3>
            <button className="panel-subtle-link" type="button">Ver todas</button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Cliente</th>
                <th>Comercio</th>
                <th>Servicio</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentAppointments.map((booking, index) => (
                <tr key={booking.id || index}>
                  <td style={{ fontWeight: 600 }}>{booking.time}</td>
                  <td>{booking.client}</td>
                  <td>{booking.business}</td>
                  <td>{booking.service}</td>
                  <td>
                    <Badge status={booking.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="info-stack">
          <div className="info-box">
            <p className="info-box__eyebrow">Siguiente reserva</p>
            <p className="info-box__title">{siguienteReserva ? siguienteReserva.client : "No hay más hoy"}</p>
            <p className="info-box__text">
              {siguienteReserva ? `${siguienteReserva.time} · ${siguienteReserva.business}` : "Agenda despejada"}
            </p>
            <p className="info-box__eyebrow" style={{ marginTop: '12px' }}>Total reservas</p>
            <p className="info-box__title">{bookingsList.length}</p>
            <p className="info-box__text">En la sesión actual</p>
          </div>
          
          <div className="info-box">
            <p className="info-box__eyebrow">Historial general</p>
            <p className="info-box__title">{totalPaymentsCount} pagos</p>
            <p className="info-box__text">Registrados globalmente</p>
          </div>
          
          <div className="info-box">
            <p className="info-box__eyebrow">Recordatorios</p>
            <p className="info-box__title">{pendientesDeConfirmar} confirmaciones pendientes</p>
            <p className="info-box__text">
              {pendientesDeConfirmar > 0 ? "Revisión recomendada esta mañana" : "Buen trabajo"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}