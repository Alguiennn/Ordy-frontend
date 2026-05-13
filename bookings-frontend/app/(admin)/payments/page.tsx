'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Booking,
  CreatePaymentDto,
  createPayment,
  getAppointments,
  getPayments,
  Payment,
  PaymentStatus,
} from '@/lib/api';

const paymentMethods = ['Tarjeta', 'Efectivo', 'Bizum', 'Transferencia'] as const;
const paymentStatusOptions: PaymentStatus[] = ['paid', 'pending'];

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
        }`}>
        {subtitle}
      </p>
    </div>
  );
}

function Badge({ status }: { status: PaymentStatus }) {
  return (
    <span className={`badge badge--${status === 'pending' ? 'pending' : 'confirmed'}`}>
      {status === 'pending' ? 'Por cobrar' : 'Pagado'}
    </span>
  );
}

export default function PaymentsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | ''>('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<(typeof paymentMethods)[number]>('Tarjeta');
  const [status, setStatus] = useState<PaymentStatus>('paid');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [bookingsData, paymentsData] = await Promise.all([getAppointments(), getPayments()]);
      setBookings(bookingsData);
      setPayments(paymentsData);
    } catch (error) {
      console.error(error);
      setFeedback('Error al cargar datos desde el servidor.');
    }
  }

  const selectedBooking = bookings.find((booking) => booking.id === selectedBookingId);

  const totalPaid = useMemo(
    () =>
      payments
        .filter((payment) => payment.status === 'paid')
        .reduce((sum, payment) => sum + payment.amount, 0),
    [payments],
  );

  const pendingCount = useMemo(
    () => payments.filter((payment) => payment.status === 'pending').length,
    [payments],
  );

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2,
    }).format(value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback('');

    if (!selectedBookingId) {
      setFeedback('Selecciona una reserva de la tabla.');
      return;
    }

    const parsedAmount = Number(amount.replace(',', '.'));
    if (!parsedAmount || parsedAmount <= 0) {
      setFeedback('Introduce un importe válido.');
      return;
    }

    setLoading(true);

    try {
      const paymentData: CreatePaymentDto = {
        bookingId: selectedBookingId,
        amount: parsedAmount,
        method,
        status,
      };

      const newPayment = await createPayment(paymentData);
      setPayments((current) => [newPayment, ...current]);
      setFeedback('Cobro guardado en la base de datos.');
      setShowForm(false);
      setSelectedBookingId('');
      setAmount('');
      setMethod('Tarjeta');
      setStatus('paid');
    } catch (error) {
      console.error(error);
      setFeedback('Error al guardar el cobro. Revisa el servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <h2>Payments</h2>
          <p>Seguimiento de cobros realizados y pendientes.</p>
        </div>

        <button className="primary-btn" type="button" onClick={() => setShowForm((open) => !open)}>
          {showForm ? 'Cerrar formulario' : 'Registrar cobro'}
        </button>
      </section>

      {showForm && (
        <section className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Nuevo cobro</h3>
          </div>

          <form onSubmit={handleSubmit} className="payment-form">
            <div className="form-grid">
              <label>
                Reserva:
                <select
                  value={selectedBookingId}
                  onChange={(event) => setSelectedBookingId(Number(event.target.value) || '')}>
                  <option value="">Selecciona una reserva</option>
                  {bookings.map((booking) => (
                    <option key={booking.id} value={booking.id}>
                      {`#${booking.id} — ${booking.serviceName} (${booking.date} ${booking.time})`}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Importe:
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.00"
                />
              </label>

              <label>
                Método de pago:
                <select
                  value={method}
                  onChange={(event) =>
                    setMethod(event.target.value as (typeof paymentMethods)[number])
                  }>
                  {paymentMethods.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Estado:
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as PaymentStatus)}>
                  {paymentStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === 'paid' ? 'Pagado' : 'Pendiente'}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-actions">
              <button className="primary-btn" type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar cobro'}
              </button>
              {selectedBooking && (
                <p style={{ marginTop: 10, color: '#6b7280' }}>
                  Reserva seleccionada: #{selectedBooking.id} — {selectedBooking.serviceName}
                </p>
              )}
            </div>

            {feedback && <p className="form-feedback">{feedback}</p>}
          </form>
        </section>
      )}

      <section className="kpi-grid">
        <KpiCard
          title="Cobrado hoy"
          value={formatCurrency(totalPaid)}
          subtitle={`${payments.filter((payment) => payment.status === 'paid').length} operaciones registradas`}
          variant="positive"
        />
        <KpiCard
          title="Pendiente"
          value={formatCurrency(
            payments
              .filter((p) => p.status === 'pending')
              .reduce((sum, p) => sum + p.amount, 0),
          )}
          subtitle={`${pendingCount} cobro${pendingCount !== 1 ? 's' : ''} por revisar`}
          variant="warning"
        />
        <KpiCard
          title="Método más usado"
          value={
            (() => {
              const counts = payments.reduce<Record<string, number>>((acc, p) => {
                acc[p.method] = (acc[p.method] ?? 0) + 1;
                return acc;
              }, {});
              return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] ?? '—';
            })()
          }
          subtitle="Mayor volumen del día"
        />
        <KpiCard
          title="Conversión"
          value={
            payments.length > 0
              ? `${Math.round(
                  (payments.filter((p) => p.status === 'paid').length / payments.length) * 100,
                )}%`
              : '—'
          }
          subtitle="Cobros cerrados hoy"
        />
      </section>

      <section className="section-card">
        <div className="panel-title-row">
          <h3 className="panel-title">Listado de cobros</h3>
          <span style={{ color: '#6b7280', fontSize: 14 }}>{payments.length} resultados</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Comercio</th>
              <th>Importe</th>
              <th>Método</th>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td style={{ fontWeight: 600 }}>{payment.id}</td>
                <td>{payment.booking?.clientName ?? '—'}</td>
                <td>{payment.booking?.businessName ?? payment.booking?.serviceName ?? '—'}</td>
                <td>{formatCurrency(payment.amount)}</td>
                <td>{payment.method}</td>
                <td>{new Date(payment.createdAt).toLocaleDateString('es-ES')}</td>
                <td>
                  <Badge status={payment.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}