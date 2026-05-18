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

type FormMode = 'create' | 'edit';

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Badge component for payment status
function Badge({ status }: { status: PaymentStatus }) {
  return (
    <span className={`badge badge--${status === 'pending' ? 'pending' : 'confirmed'}`}>
      {status === 'pending' ? 'Por cobrar' : 'Pagado'}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MethodChart component - displays payment method distribution
function MethodChart({ payments }: { payments: Payment[] }) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    payments.forEach((p) => {
      map[p.method] = (map[p.method] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [payments]);

  const total = payments.length;
  const topMethod = counts[0]?.[0] ?? '—';

  return (
    <div className="section-card">
      <div className="panel-title-row">
        <h3 className="panel-title">Método más usado</h3>
        <span style={{ fontWeight: 700, color: '#111', fontSize: 15 }}>
          {topMethod}
        </span>
      </div>

      {counts.length === 0 ? (
        <p style={{ color: '#6b7280', fontSize: 14 }}>Sin cobros registrados.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'row', gap: 20, marginTop: 12, alignItems: 'flex-end' }}>
          {counts.map(([method, count]) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const isTop = count === counts[0][1];
            return (
              <div key={method} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: isTop ? '#111' : '#6b7280' }}>
                  {pct}%
                </span>
                <div style={{
                  width: 28,
                  height: 70,
                  background: '#f3f4f6',
                  borderRadius: 8,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'flex-end',
                }}>
                  <div style={{
                    width: '100%',
                    height: `${pct}%`,
                    background: isTop ? '#111' : '#9ca3af',
                    borderRadius: 8,
                    transition: 'height 0.4s ease',
                  }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, color: '#374151', textAlign: 'center' }}>
                  {method}
                </span>
                <span style={{ fontSize: 10, color: '#9ca3af' }}>
                  {count} cobro{count !== 1 ? 's' : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* TODO: Add backend endpoint GET /payments/stats/methods when available */}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ConfirmDeleteModal - deletion confirmation dialog
function ConfirmDeleteModal({
  payment,
  onClose,
  onConfirm,
  formatCurrency,
}: {
  payment: Payment;
  onClose: () => void;
  onConfirm: () => void;
  formatCurrency: (v: number) => string;
}) {
  return (
    // Backdrop — clicking outside cancels
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          width: '100%',
          maxWidth: 420,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: '#FEE2E2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: '1.2rem',
          }}>
            🗑️
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#111' }}>
              Eliminar cobro
            </p>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#ef4444' }}>
              Esta acción no se puede deshacer
            </p>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          <p style={{ margin: '0 0 12px', fontSize: '0.88rem', color: '#6b7280' }}>
            Estás a punto de eliminar el siguiente cobro:
          </p>

          {/* Payment preview card */}
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 10,
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            {/* Amount + method row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '1.2rem', color: '#991B1B' }}>
                {formatCurrency(payment.amount)}
              </span>
              <span style={{
                background: '#FECACA',
                color: '#7F1D1D',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: 20,
              }}>
                {payment.method}
              </span>
            </div>

            {/* Details row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#B91C1C' }}>
                Reserva <strong>#{payment.bookingId}</strong>
                {payment.booking?.serviceName ? ` — ${payment.booking.serviceName}` : ''}
              </p>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#B91C1C' }}>
                ID cobro: <strong>#{payment.id}</strong>
                {' · '}
                {new Date(payment.createdAt).toLocaleDateString('es-ES')}
                {' · '}
                {payment.status === 'paid' ? 'Pagado' : 'Por cobrar'}
              </p>
            </div>
          </div>

          {/* Warning note */}
          <div style={{
            marginTop: 12,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            background: '#FFF7ED',
            border: '1px solid #FED7AA',
            borderRadius: 10,
            padding: '10px 12px',
          }}>
            <span style={{ fontSize: '0.9rem', flexShrink: 0, marginTop: 1 }}>⚠️</span>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#92400E', lineHeight: 1.5 }}>
              El cobro desaparecerá de la lista y los KPIs se recalcularán automáticamente.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px 20px',
          borderTop: '1px solid #f3f4f6',
          display: 'flex',
          gap: 10,
          justifyContent: 'flex-end',
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: '1.5px solid #d1d5db',
              background: 'transparent',
              color: '#374151',
              fontWeight: 500,
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              background: '#DC2626',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#B91C1C')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#DC2626')}
          >
            🗑️ Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PaymentFormModal - form for creating/editing payments
function PaymentFormModal({
  mode,
  payment,
  bookings,
  loading,
  feedback,
  selectedBookingId,
  amount,
  method,
  status,
  onBookingChange,
  onAmountChange,
  onMethodChange,
  onStatusChange,
  onSubmit,
  onClose,
}: {
  mode: FormMode;
  payment: Payment | null;
  bookings: Booking[];
  loading: boolean;
  feedback: string;
  selectedBookingId: number | '';
  amount: string;
  method: typeof paymentMethods[number];
  status: PaymentStatus;
  onBookingChange: (value: number | '') => void;
  onAmountChange: (value: string) => void;
  onMethodChange: (value: typeof paymentMethods[number]) => void;
  onStatusChange: (value: PaymentStatus) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  const selectedBooking = bookings.find((booking) => booking.id === selectedBookingId);
  const title = mode === 'create' ? 'Registrar nuevo cobro' : 'Editar cobro';
  const buttonText = mode === 'create' ? 'Guardar cobro' : 'Actualizar cobro';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99998,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          width: '100%',
          maxWidth: 500,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: '#111' }}>
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280',
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={onSubmit}>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#111' }}>Reserva *</span>
              <select
                value={selectedBookingId}
                onChange={(event) => onBookingChange(Number(event.target.value) || '')}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1.5px solid #d1d5db',
                  fontSize: '0.9rem',
                  color: '#111',
                }}
              >
                <option value="">Selecciona una reserva</option>
                {bookings.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    {`#${booking.id} — ${booking.serviceName} (${booking.date} ${booking.time})`}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#111' }}>Importe *</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(event) => onAmountChange(event.target.value)}
                placeholder="0.00"
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1.5px solid #d1d5db',
                  fontSize: '0.9rem',
                  color: '#111',
                }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#111' }}>Método de pago *</span>
              <select
                value={method}
                onChange={(event) => onMethodChange(event.target.value as typeof paymentMethods[number])}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1.5px solid #d1d5db',
                  fontSize: '0.9rem',
                  color: '#111',
                }}
              >
                {paymentMethods.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#111' }}>Estado *</span>
              <select
                value={status}
                onChange={(event) => onStatusChange(event.target.value as PaymentStatus)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1.5px solid #d1d5db',
                  fontSize: '0.9rem',
                  color: '#111',
                }}
              >
                {paymentStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'paid' ? 'Pagado' : 'Pendiente'}
                  </option>
                ))}
              </select>
            </label>

            {selectedBooking && (
              <p style={{ marginTop: 8, fontSize: '0.88rem', color: '#6b7280', margin: 0 }}>
                Reserva seleccionada: #{selectedBooking.id} — {selectedBooking.serviceName}
              </p>
            )}

            {feedback && (
              <p style={{
                marginTop: 8,
                padding: '10px 12px',
                borderRadius: 8,
                background: feedback.includes('Error') ? '#fee2e2' : '#f0fdf4',
                color: feedback.includes('Error') ? '#991B1B' : '#166534',
                fontSize: '0.88rem',
                margin: 0,
              }}>
                {feedback}
              </p>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '14px 24px 20px',
            borderTop: '1px solid #f3f4f6',
            display: 'flex',
            gap: 10,
            justifyContent: 'flex-end',
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                border: '1.5px solid #d1d5db',
                background: 'transparent',
                color: '#374151',
                fontWeight: 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                border: 'none',
                background: loading ? '#d1d5db' : '#111',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#374151';
              }}
              onMouseLeave={(e) => {
                if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#111';
              }}
            >
              {loading ? 'Guardando...' : buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PaymentsPage - main page component
// ─────────────────────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<number | ''>('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<typeof paymentMethods[number]>('Tarjeta');
  const [status, setStatus] = useState<PaymentStatus>('paid');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const [filterStatus, setFilterStatus] = useState<PaymentStatus | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  function openCreateForm() {
    setFormMode('create');
    setEditingPayment(null);
    setSelectedBookingId('');
    setAmount('');
    setMethod('Tarjeta');
    setStatus('paid');
    setFeedback('');
  }

  function openEditForm(payment: Payment) {
    setFormMode('edit');
    setEditingPayment(payment);
    setSelectedBookingId(payment.bookingId);
    setAmount(payment.amount.toString());
    setMethod(payment.method as typeof paymentMethods[number]);
    setStatus(payment.status);
    setFeedback('');
  }

  function closeForm() {
    setFormMode(null);
    setEditingPayment(null);
    setSelectedBookingId('');
    setAmount('');
    setMethod('Tarjeta');
    setStatus('paid');
    setFeedback('');
  }

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

  const filteredPayments = useMemo(() => {
    if (!filterStatus) return payments;
    return payments.filter((p) => p.status === filterStatus);
  }, [payments, filterStatus]);

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
      if (formMode === 'create') {
        const paymentData: CreatePaymentDto = {
          bookingId: selectedBookingId,
          amount: parsedAmount,
          method,
          status,
        };

        const newPayment = await createPayment(paymentData);
        setPayments((current) => [newPayment, ...current]);
        setFeedback('Cobro guardado en la base de datos.');
        closeForm();
      } else if (formMode === 'edit' && editingPayment) {
        // Update the payment in the list with the new data
        // For now, only update locally. Add updatePayment API call when available
        const updatedPayment: Payment = {
          ...editingPayment,
          bookingId: selectedBookingId,
          amount: parsedAmount,
          method,
          status,
        };

        setPayments((current) =>
          current.map((p) => (p.id === editingPayment.id ? updatedPayment : p))
        );
        setFeedback('Cobro actualizado correctamente.');
        closeForm();

        // TODO: Add updatePayment API call to sync with backend
      }
    } catch (error) {
      console.error(error);
      setFeedback('Error al guardar el cobro. Revisa el servidor.');
    } finally {
      setLoading(false);
    }
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    setPayments((current) => current.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
    // TODO: Add deletePayment API call to sync with backend
  }

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <h2>Cobros</h2>
          <p>Registra pagos asociados a reservas y guarda los datos en database.sqlite.</p>
        </div>

        <button className="primary-btn" type="button" onClick={openCreateForm}>
          Registrar cobro
        </button>
      </section>

      {/* Modal de formulario (crear/editar) */}
      {formMode && (
        <PaymentFormModal
          mode={formMode}
          payment={editingPayment}
          bookings={bookings}
          loading={loading}
          feedback={feedback}
          selectedBookingId={selectedBookingId}
          amount={amount}
          method={method}
          status={status}
          onBookingChange={setSelectedBookingId}
          onAmountChange={setAmount}
          onMethodChange={setMethod}
          onStatusChange={setStatus}
          onSubmit={handleSubmit}
          onClose={closeForm}
        />
      )}

      {/* KPIs */}
      <section className="kpi-grid">
        <KpiCard
          title="Total cobrado"
          value={formatCurrency(totalPaid)}
          subtitle={`${payments.filter((payment) => payment.status === 'paid').length} pagos`}
          variant="positive"
        />
        <KpiCard
          title="Cobros pendientes"
          value={`${pendingCount}`}
          subtitle="Pagos por revisar"
          variant="warning"
        />
        <KpiCard
          title="Reservas disponibles"
          value={`${bookings.length}`}
          subtitle="Reservas activas"
        />
        <KpiCard
          title="Último cobro"
          value={payments[0] ? formatCurrency(payments[0].amount) : '0 €'}
          subtitle={payments[0] ? `Reserva #${payments[0].bookingId}` : 'Sin cobros'}
        />
      </section>

      {/* Payment method chart */}
      <MethodChart payments={payments} />

      {/* Payments table with filters */}
      <section className="section-card">
        <div className="panel-title-row">
          <h3 className="panel-title">Listado de cobros</h3>
          <span style={{ color: '#6b7280', fontSize: 14 }}>
            {filteredPayments.length} resultados
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {/* Filter buttons - TODO: Move to backend filtering for large datasets */}
          <button
            type="button"
            onClick={() => setFilterStatus(null)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: '1.5px solid',
              borderColor: filterStatus === null ? '#111' : '#d1d5db',
              background: filterStatus === null ? '#111' : 'transparent',
              color: filterStatus === null ? '#fff' : '#374151',
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Todos ({payments.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('paid')}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: '1.5px solid',
              borderColor: filterStatus === 'paid' ? '#111' : '#d1d5db',
              background: filterStatus === 'paid' ? '#111' : 'transparent',
              color: filterStatus === 'paid' ? '#fff' : '#374151',
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Pagado ({payments.filter((p) => p.status === 'paid').length})
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('pending')}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: '1.5px solid',
              borderColor: filterStatus === 'pending' ? '#111' : '#d1d5db',
              background: filterStatus === 'pending' ? '#111' : 'transparent',
              color: filterStatus === 'pending' ? '#fff' : '#374151',
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Por cobrar ({payments.filter((p) => p.status === 'pending').length})
          </button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Reserva</th>
              <th>Servicio</th>
              <th>Importe</th>
              <th>Método</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#6b7280', padding: 24 }}>
                  No hay cobros con este filtro.
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td style={{ fontWeight: 600 }}>{payment.id}</td>
                  <td>#{payment.bookingId}</td>
                  <td>{payment.booking?.serviceName || 'Sin reserva'}</td>
                  <td>{formatCurrency(payment.amount)}</td>
                  <td>{payment.method}</td>
                  <td>{new Date(payment.createdAt).toLocaleDateString('es-ES')}</td>
                  <td>
                    <Badge status={payment.status} />
                  </td>

                  <td style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => openEditForm(payment)}
                      title="Editar cobro"
                      style={{
                        background: 'transparent',
                        border: '1.5px solid #bfdbfe',
                        color: '#1e40af',
                        borderRadius: 8,
                        padding: '4px 10px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = '#eff6ff';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(payment)}
                      title="Eliminar cobro"
                      style={{
                        background: 'transparent',
                        border: '1.5px solid #fca5a5',
                        color: '#dc2626',
                        borderRadius: 8,
                        padding: '4px 10px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = '#fee2e2';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <ConfirmDeleteModal
          payment={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
}