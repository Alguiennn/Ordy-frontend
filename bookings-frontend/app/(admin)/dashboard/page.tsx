'use client';

import { useEffect, useState } from 'react';
import { museoModerno } from '@/lib/fonts';
import TypewriterGreeting from '@/components/TypewriterGreeting';
import { getPayments, getAppointments } from '@/lib/api'; // Suponiendo tus métodos de API

type DashboardBookingStatus = "pending" | "confirmed" | "paid";

type DashboardBooking = {
  time: string;
  client: string;
  business: string;
  service: string;
  status: DashboardBookingStatus;
  amount?: number; // Añadimos el dinero de la reserva si aplica
};

// Pasamos bookings a un estado inicial mockeado, simulando datos reales
const initialBookings: DashboardBooking[] = [
  {
    time: "09:00",
    client: "María López",
    business: "Peluquería Nova",
    service: "Corte + peinado",
    status: "confirmed",
    amount: 50,
  },
  {
    time: "10:30",
    client: "Carlos Pérez",
    business: "Restaurante Marea",
    service: "Reserva para 4",
    status: "pending",
    amount: 0,
  },
  {
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
  const [loading, setLoading] = useState(false);

  // 💡 AQUÍ CONECTARÁS TU BACKEND CUANDO ESTÉ LISTO EL ENDPOINT
  ///////////////////////////////////////
  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const response = await getAppointments();
        setBookingsList(response.data);
      } catch (error) {
        console.error("Error cargando métricas", error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);
  ////////////////////////////////////////

  // 📊 CALCULOS EN TIEMPO REAL (React recalcula esto si bookingsList cambia)
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

  // Siguiente reserva (la primera que sea 'confirmed' o 'paid')
  const siguienteReserva = bookingsList.find((b) => b.status !== "pending");

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <TypewriterGreeting messages={['Hola de nuevo :)', 'Echa un vistazo a las novedades.']} loop={false} />
          <p>
            Aquí tienes lo que está pasando en{' '} <span className={museoModerno.className}>Ordy</span> hoy.
          </p>
        </div>
        <button className="primary-btn" type="button">
          Export report
        </button>
      </section>

      {/* 🛠️ TARJETAS KPI VINCULADAS DINÁMICAMENTE */}
      <section className="kpi-grid">
        <KpiCard
          title="Reservas hoy"
          value={String(totalReservasHoy)}
          subtitle="+2 respecto a ayer" // Esto podrá ser dinámico comparando arrays
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
        <KpiCard title="Clientes activos" value="214" subtitle="Este mes" />
      </section>

      <section className="dashboard-grid">
        <div className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Próximas reservas</h3>
            <button className="panel-subtle-link" type="button">
              Ver todas
            </button>
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
              {bookingsList.map((booking, index) => (
                <tr key={index}>
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
          </div>

          <div className="info-box">
            <p className="info-box__eyebrow">Comercio destacado</p>
            <p className="info-box__title">Restaurante Marea</p>
            <p className="info-box__text">6 reservas hoy</p>
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