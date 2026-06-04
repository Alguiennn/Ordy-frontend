// UpcomingCalendar.tsx – rewritten to fix duplicated code and syntax errors
import { useState, useMemo } from 'react';
import type { Booking, BookingStatus } from '@/lib/api';

/* ─── Helpers ─── */
const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/**
 * Compara si dos fechas son el mismo día (ignorando la hora).
 */
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Verifica si una fecha corresponde al día de hoy.
 */
function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

/**
 * Traduce el estado interno de la reserva a una etiqueta legible.
 */
function statusLabel(s: BookingStatus): string {
  return s === 'pending'
    ? 'Pendiente'
    : s === 'confirmed'
    ? 'Confirmada'
    : 'Pagada';
}

/**
 * Genera un arreglo con todas las fechas que aparecen en el calendario
 * para el mes indicado, incluyendo celdas de relleno al inicio y al final.
 */
function buildCalendarDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  // Índice de día de la semana (0 = lun … 6 = dom) según ISO
  const startPad = (first.getDay() + 6) % 7;
  const endPad = (7 - ((last.getDay() + 6) % 7) - 1) % 7;

  const days: Date[] = [];

  // Relleno antes del primer día del mes
  for (let i = startPad; i > 0; i--) {
    days.push(new Date(year, month, 1 - i));
  }

  // Días del mes actual
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  // Relleno después del último día del mes
  for (let i = 1; i <= endPad; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
}

/* ─── Types ─── */
type ViewMode = 'calendar' | 'list';

interface Props {
  bookings: Booking[];
  customerMap: Map<number, string>;
  businessMap: Map<number, string>;
}

/* ─── Component ─── */
export default function UpcomingCalendar({ bookings, customerMap, businessMap }: Props) {
  // Estado interno del componente
  const now = new Date();
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  /* Mapa de reservas por fecha → arreglo de reservas para acceso rápido */
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    bookings.forEach((b) => {
      const key = b.date.slice(0, 10); // yyyy-mm-dd
      const arr = map.get(key) ?? [];
      arr.push(b);
      map.set(key, arr);
    });
    return map;
  }, [bookings]);

  /* Próximas reservas (solo futuras, ordenadas cronológicamente) */
  const upcomingBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        const d = new Date(`${b.date}T${b.time}`);
        return !Number.isNaN(d.getTime()) && d >= now;
      })
      .sort(
        (a, b) =>
          new Date(`${a.date}T${a.time}`).getTime() -
          new Date(`${b.date}T${b.time}`).getTime()
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings]);

  /* Días a renderizar en el calendario del mes actual */
  const calendarDays = useMemo(() => buildCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  /* Reservas del día seleccionado */
  const selectedDayBookings = useMemo(() => {
    if (!selectedDate) return [];
    const key = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    return bookingsByDate.get(key) ?? [];
  }, [selectedDate, bookingsByDate]);

  /* Navegación del calendario */
  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedDate(null);
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedDate(null);
  }

  function goToday() {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDate(now);
  }

  /* Clase CSS para el punto que indica el estado de las reservas del día */
  function dotClass(bookingsForDay: Booking[]): string {
    if (bookingsForDay.some((b) => b.status === 'pending')) return 'cal-dot cal-dot--pending';
    if (bookingsForDay.some((b) => b.status === 'confirmed')) return 'cal-dot cal-dot--confirmed';
    return 'cal-dot cal-dot--paid';
  }

  /* ─── Render ─── */
  return (
    <div className="section-card upcoming-cal-wrapper">
      {/* Header con botones de toggle entre vistas */}
      <div className="panel-title-row">
        <h3 className="panel-title">
          {viewMode === 'calendar' ? 'Calendario de reservas' : 'Próximas reservas'}
        </h3>
        <div className="cal-toggle-group">
          <button
            type="button"
            className={`cal-toggle-btn ${viewMode === 'calendar' ? 'cal-toggle-btn--active' : ''}`}
            onClick={() => setViewMode('calendar')}
            aria-label="Vista calendario"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </button>
          <button
            type="button"
            className={`cal-toggle-btn ${viewMode === 'list' ? 'cal-toggle-btn--active' : ''}`}
            onClick={() => setViewMode('list')}
            aria-label="Vista lista"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* ─── CALENDAR VIEW ─── */}
      {viewMode === 'calendar' && (
        <>
          {/* Navegación del mes */}
          <div className="cal-nav">
            <button type="button" className="cal-nav-btn" onClick={prevMonth} aria-label="Mes anterior">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="cal-nav-center">
              <span className="cal-month-label">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <button type="button" className="cal-today-btn" onClick={goToday}>Hoy</button>
            </div>
            <button type="button" className="cal-nav-btn" onClick={nextMonth} aria-label="Mes siguiente">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Cabecera con nombres de los días */}
          <div className="cal-grid cal-grid--header">
            {DAY_NAMES.map((d) => (
              <div key={d} className="cal-day-name">{d}</div>
            ))}
          </div>

          {/* Celdas del calendario */}
          <div className="cal-grid">
            {calendarDays.map((day, i) => {
              const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
              const dayBookings = bookingsByDate.get(key) ?? [];
              const isCurrentMonth = day.getMonth() === viewMonth;
              const today = isToday(day);
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;

              return (
                <button
                  key={i}
                  type="button"
                  className={[
                    'cal-cell',
                    !isCurrentMonth && 'cal-cell--outside',
                    today && 'cal-cell--today',
                    isSelected && 'cal-cell--selected',
                    dayBookings.length > 0 && 'cal-cell--has-bookings',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setSelectedDate(day)}
                >
                  <span className="cal-cell-number">{day.getDate()}</span>
                  {dayBookings.length > 0 && (
                    <div className="cal-dots">
                      <span className={dotClass(dayBookings)} />
                      {dayBookings.length > 1 && (
                        <span className="cal-dot-count">+{dayBookings.length}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Panel de detalle del día seleccionado */}
          {selectedDate && (
            <div className="cal-detail">
              <h4 className="cal-detail-title">
                {selectedDate.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </h4>
              {selectedDayBookings.length > 0 ? (
                <ul className="cal-detail-list">
                  {selectedDayBookings
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((b) => (
                      <li key={b.id} className="cal-detail-item">
                        <span className="cal-detail-time">{b.time}</span>
                        <div className="cal-detail-info">
                          <span className="cal-detail-service">{b.serviceName}</span>
                          <span className="cal-detail-meta">
                            {customerMap.get(b.customerId) ?? `Cliente ${b.customerId}`} · {businessMap.get(b.businessId) ?? `Negocio ${b.businessId}`}
                          </span>
                        </div>
                        <span className={`badge badge--${b.status}`}>{statusLabel(b.status)}</span>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="cal-detail-empty">Sin citas para este día.</p>
              )}
            </div>
          )}
        </>
      )}

      {/* ─── LIST VIEW ─── */}
      {viewMode === 'list' && (
        <>
          {upcomingBookings.length > 0 ? (
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
                {upcomingBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{new Date(booking.date).toLocaleDateString('es-ES')}</td>
                    <td style={{ fontWeight: 600 }}>{booking.time}</td>
                    <td>{customerMap.get(booking.customerId) ?? `Cliente ${booking.customerId}`}</td>
                    <td>{businessMap.get(booking.businessId) ?? `Comercio ${booking.businessId}`}</td>
                    <td>{booking.serviceName}</td>
                    <td>
                      <span className={`badge badge--${booking.status}`}>{statusLabel(booking.status)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="cal-detail-empty" style={{ padding: '2rem 0', textAlign: 'center' }}>
              No hay reservas próximas en la agenda.
            </div>
          )}
        </>
      )}
    </div>
  );
}
