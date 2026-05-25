import { museoModerno } from '@/lib/fonts';
import TypewriterGreeting from '@/components/TypewriterGreeting';
import { getAppointments, getCustomers, getPayments } from "@/lib/api";

type DashboardBookingStatus = "pending" | "confirmed" | "paid";

type DashboardBooking = {
  time: string;
  client: string;
  business: string;
  service: string;
  status: DashboardBookingStatus;
};

const bookings: DashboardBooking[] = [
  {
    time: "09:00",
    client: "María López",
    business: "Peluquería Nova",
    service: "Corte + peinado",
    status: "confirmed",
  },
  {
    time: "10:30",
    client: "Carlos Pérez",
    business: "Restaurante Marea",
    service: "Reserva para 4",
    status: "pending",
  },
  {
    time: "12:00",
    client: "Lucía Sánchez",
    business: "Barber Studio",
    service: "Corte caballero",
    status: "paid",
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
export default async function DashboardPage() {
  // 1. Llamadas a la API
  const [appointments, payments] = await Promise.all([
    getAppointments(),
    getPayments(),
  ]);

  // 2. Calcular KPIs
  const today = new Date().toISOString().split("T")[0]; // "2026-05-25"

  const todayAppointments = appointments.filter(a => a.date === today);
  const pendingCount = appointments.filter(a => a.status === "pending").length;
  const todayRevenue = payments
    .filter(p => p.date === today && p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const activeCustomers = new Set(appointments.map(a => a.customerId)).size;

  // 3. Las últimas 5 reservas para la tabla
  const recentAppointments = [...appointments].slice(0, 5);

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <h2>Hola de nuevo :&#41;</h2>
          <p>Aquí tienes lo que está pasando en <span className={museoModerno.className}>Ordy</span> hoy.</p>
        </div>
        <button className="primary-btn" type="button">Export report</button>
      </section>

      {/* KPIs ahora con datos reales */}
      <section className="kpi-grid">
        <div className="kpi-card">
          <p className="kpi-card__label">Reservas hoy</p>
          <h3 className="kpi-card__value">{todayAppointments.length}</h3>
          <p className="kpi-card__meta kpi-card__meta--positive">Del día de hoy</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-card__label">Cobrado hoy</p>
          <h3 className="kpi-card__value">{todayRevenue.toFixed(0)} €</h3>
          <p className="kpi-card__meta">Pagos completados</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-card__label">Pendientes</p>
          <h3 className="kpi-card__value">{pendingCount}</h3>
          <p className="kpi-card__meta kpi-card__meta--warning">Requieren seguimiento</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-card__label">Clientes activos</p>
          <h3 className="kpi-card__value">{activeCustomers}</h3>
          <p className="kpi-card__meta">Con reservas registradas</p>
        </div>
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
                <th>Hora</th><th>Servicio</th><th>Cliente</th><th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentAppointments.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.time}</td>
                  <td>{a.serviceName}</td>
                  <td>{a.customerId}</td>
                  <td>
                    <span className={`badge badge--${a.status}`}>
                      {a.status === "pending" ? "Pendiente" : a.status === "confirmed" ? "Confirmada" : "Pagada"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Info boxes — estos sí los dejo estáticos o los puedes rellenar después */}
        <div className="info-stack">
          <div className="info-box">
            <p className="info-box__eyebrow">Total reservas</p>
            <p className="info-box__title">{appointments.length}</p>
            <p className="info-box__text">En toda la base de datos</p>
          </div>
          <div className="info-box">
            <p className="info-box__eyebrow">Pagos registrados</p>
            <p className="info-box__title">{payments.length}</p>
            <p className="info-box__text">Total de operaciones</p>
          </div>
          <div className="info-box">
            <p className="info-box__eyebrow">Pendientes de cobro</p>
            <p className="info-box__title">
              {payments.filter(p => p.status === "pending").reduce((sum, p) => sum + Number(p.amount), 0).toFixed(0)} €
            </p>
            <p className="info-box__text">Por revisar</p>
          </div>
        </div>
      </section>
    </div>
  );
}