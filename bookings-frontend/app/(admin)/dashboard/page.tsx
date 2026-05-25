import Link from 'next/link';
import { museoModerno } from '@/lib/fonts';
import TypewriterGreeting from '@/components/TypewriterGreeting';
import { getAppointments, getCustomers, getPayments, BookingStatus, getBusinesses, Booking } from "@/lib/api";

function Badge({ status }: { status: BookingStatus }) {
  const label =
    status === 'pending'
      ? 'Pendiente'
      : status === 'confirmed'
      ? 'Confirmada'
      : 'Pagada';

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
  variant?: 'positive' | 'warning';
}) {
  return (
    <div className="kpi-card">
      <p className="kpi-card__label">{title}</p>
      <h3 className="kpi-card__value">{value}</h3>
      <p
        className={`kpi-card__meta ${
          variant === 'positive'
            ? 'kpi-card__meta--positive'
            : variant === 'warning'
            ? 'kpi-card__meta--warning'
            : ''
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

function formatMoney(amount: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function parseBookingDate(booking: Booking) {
  return new Date(`${booking.date}T${booking.time}`);
}

function isToday(date: Date) {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isCurrentMonth(date: Date) {
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export default async function DashboardPage() {
  const [bookings, payments, businesses, customers] = await Promise.all([
    getAppointments(),
    getPayments(),
    getBusinesses(),
    getCustomers(),
  ]);

  const now = new Date();
  const businessMap = new Map(businesses.map((business) => [business.id, business.name]));
  const customerMap = new Map(customers.map((customer) => [customer.id, customer.name]));

  const bookingsToday = bookings.filter((booking) => {
    const bookingDate = parseBookingDate(booking);
    return !Number.isNaN(bookingDate.getTime()) && isToday(bookingDate);
  });

  const bookingsMonth = bookings.filter((booking) => {
    const bookingDate = parseBookingDate(booking);
    return !Number.isNaN(bookingDate.getTime()) && isCurrentMonth(bookingDate);
  });

  const totalToday = bookingsToday.length;
  const pendingToday = bookingsToday.filter((booking) => booking.status === 'pending').length;
  const activeCustomersThisMonth = new Set(bookingsMonth.map((booking) => booking.customerId)).size;

  const paidPaymentsToday = payments.filter((payment) => {
    const paymentDate = new Date(payment.date);
    return !Number.isNaN(paymentDate.getTime()) && payment.status === 'paid' && isToday(paymentDate);
  });

  const collectedToday = paidPaymentsToday.reduce((sum, payment) => sum + (payment.amount ?? 0), 0);

  const nextBooking = bookings
    .map((booking) => ({ booking, date: parseBookingDate(booking) }))
    .filter(({ date }) => !Number.isNaN(date.getTime()) && date > now)
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0]?.booking;

  const upcomingBookings = bookings
    .filter((booking) => {
      const bookingDate = parseBookingDate(booking);
      return !Number.isNaN(bookingDate.getTime()) && bookingDate >= now;
    })
    .sort((a, b) => parseBookingDate(a).getTime() - parseBookingDate(b).getTime());

  const businessCountsToday = bookingsToday.reduce<Record<number, number>>((acc, booking) => {
    acc[booking.businessId] = (acc[booking.businessId] ?? 0) + 1;
    return acc;
  }, {});

  const featuredBusinessId = Object.keys(businessCountsToday).reduce<number | null>((winner, key) => {
    const businessId = Number(key);
    if (winner === null) return businessId;
    return businessCountsToday[businessId] > businessCountsToday[winner] ? businessId : winner;
  }, null);

  const featuredBusinessName =
    featuredBusinessId !== null && businessMap.get(featuredBusinessId)
      ? businessMap.get(featuredBusinessId)
      : featuredBusinessId !== null
      ? `Comercio ${featuredBusinessId}`
      : 'Sin comercio destacado';

  const featuredBusinessCount = featuredBusinessId !== null ? businessCountsToday[featuredBusinessId] : 0;

  const nextBookingCustomer = nextBooking ? customerMap.get(nextBooking.customerId) : null;
  const nextBookingBusiness = nextBooking ? businessMap.get(nextBooking.businessId) : null;

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
        <KpiCard
          title="Reservas hoy"
          value={`${totalToday}`}
          subtitle={`${pendingToday} pendientes`}
          variant="positive"
        />
        <KpiCard
          title="Cobrado hoy"
          value={formatMoney(collectedToday)}
          subtitle={`${paidPaymentsToday.length} pagos registrados`}
        />
        <KpiCard
          title="Pendientes"
          value={`${pendingToday}`}
          subtitle="Seguimiento necesario"
          variant="warning"
        />
        <KpiCard
          title="Clientes activos"
          value={`${activeCustomersThisMonth}`}
          subtitle="Este mes"
        />
      </section>

      <section className="dashboard-grid">
        <div className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Próximas reservas</h3>
            <Link href="/bookings" className="panel-subtle-link">
              Ver todas
            </Link>3
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Hora</th><th>Servicio</th><th>Cliente</th><th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {upcomingBookings.length > 0 ? (
                upcomingBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{new Date(booking.date).toLocaleDateString('es-ES')}</td>
                    <td style={{ fontWeight: 600 }}>{booking.time}</td>
                    <td>{customerMap.get(booking.customerId) ?? `Cliente ${booking.customerId}`}</td>
                    <td>{businessMap.get(booking.businessId) ?? `Comercio ${booking.businessId}`}</td>
                    <td>{booking.serviceName}</td>
                    <td>
                      <Badge status={booking.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                    No hay reservas próximas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Info boxes — estos sí los dejo estáticos o los puedes rellenar después */}
        <div className="info-stack">
          <div className="info-box">
            <p className="info-box__eyebrow">Siguiente reserva</p>
            <p className="info-box__title">{nextBookingCustomer ?? 'Sin reservas próximas'}</p>
            <p className="info-box__text">
              {nextBooking
                ? `${nextBooking.time} · ${nextBookingBusiness ?? `Comercio ${nextBooking.businessId}`}`
                : 'No hay reservas en agenda'}
            </p>
            <p className="info-box__eyebrow">Total reservas</p>
            <p className="info-box__title">{appointments.length}</p>
            <p className="info-box__text">En toda la base de datos</p>
          </div>
          <div className="info-box">
            <p className="info-box__eyebrow">Comercio destacado</p>
            <p className="info-box__title">{featuredBusinessName}</p>
            <p className="info-box__text">{featuredBusinessCount} reservas hoy</p>
            <p className="info-box__eyebrow">Pagos registrados</p>
            <p className="info-box__title">{payments.length}</p>
            <p className="info-box__text">Total de operaciones</p>
          </div>
          <div className="info-box">
            <p className="info-box__eyebrow">Recordatorios</p>
            <p className="info-box__title">{pendingToday} confirmaciones pendientes</p>
            <p className="info-box__text">Revisión recomendada esta mañana</p>
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
}