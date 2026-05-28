'use client';

import { useRef, useState } from 'react';
import { Booking, Business, Customer, Payment } from '@/lib/api';
import {
  downloadDocx,
  downloadExcelReport,
  downloadJpgFromNode,
  downloadPdf,
} from './exporters';

type ExportReportButtonProps = {
  bookings: Booking[];
  businesses: Business[];
  customers: Customer[];
  payments?: Payment[];
};

type ExportPage = 'bookings' | 'customers' | 'businesses' | 'payments' | 'all';
type ExportFormat = 'xlsx' | 'docx' | 'pdf' | 'jpg';

const pages: { id: ExportPage; label: string; sub: string }[] = [
  { id: 'bookings',   label: 'Reservas',         sub: 'Citas y horarios'       },
  { id: 'customers',  label: 'Clientes',          sub: 'Directorio de clientes' },
  { id: 'businesses', label: 'Comercios',         sub: 'Negocios registrados'   },
  { id: 'payments',   label: 'Pagos',             sub: 'Historial de cobros'    },
  { id: 'all',        label: 'Todas las páginas', sub: 'Informe completo'        },
];

const formats: { id: ExportFormat; label: string; desc: string }[] = [
  { id: 'xlsx', label: 'XLSX', desc: 'Excel · Datos tabulares'  },
  { id: 'docx', label: 'DOCX', desc: 'Word · Documento'         },
  { id: 'pdf',  label: 'PDF',  desc: 'Portable · Imprimible'    },
  { id: 'jpg',  label: 'JPG',  desc: 'Imagen · Captura visual'  },
];

const fileNames: Record<ExportPage, string> = {
  bookings:   'reservas',
  customers:  'clientes',
  businesses: 'comercios',
  payments:   'pagos',
  all:        'ordy-completo',
};

/* ─── Tiny style helpers ──────────────────────────────────── */
const TH: React.CSSProperties = {
  padding: '8px 12px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  background: '#f8fafc',
  borderBottom: '1px solid #e2e8f0',
};
const TD: React.CSSProperties = {
  padding: '9px 12px',
  fontSize: 13,
  color: '#1e293b',
  borderBottom: '1px solid #f1f5f9',
};

/* ─── JPG Report Node ─────────────────────────────────────── */
function JpgReportNode({
  page,
  bookings,
  customers,
  businesses,
  payments,
}: {
  page: ExportPage;
  bookings: Booking[];
  customers: Customer[];
  businesses: Business[];
  payments: Payment[];
}) {
  const customerMap = new Map(customers.map((c) => [c.id, c.name]));
  const businessMap = new Map(businesses.map((b) => [b.id, b.name]));
  const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

  const show = (section: ExportPage) => page === section || page === 'all';

  return (
    <div style={{ background: '#ffffff', padding: '32px 36px', width: 860, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      {/* Report header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, paddingBottom: 20, borderBottom: '2px solid #0f172a' }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>Ordy</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Plataforma de gestión de reservas y cobros</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>Informe exportado</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{dateStr}</div>
        </div>
      </div>

      {/* Bookings */}
      {show('bookings') && bookings.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Reservas <span style={{ color: '#94a3b8', fontWeight: 500 }}>({bookings.length})</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
            <thead>
              <tr>
                {['Fecha', 'Hora', 'Cliente', 'Comercio', 'Servicio', 'Estado'].map((h) => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td style={TD}>{b.date}</td>
                  <td style={TD}>{b.time}</td>
                  <td style={TD}>{customerMap.get(b.customerId) ?? `Cliente ${b.customerId}`}</td>
                  <td style={TD}>{businessMap.get(b.businessId) ?? `Comercio ${b.businessId}`}</td>
                  <td style={TD}>{(b as any).serviceName ?? '—'}</td>
                  <td style={TD}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 5,
                      fontSize: 11,
                      fontWeight: 600,
                      background: b.status === 'paid' ? '#dcfce7' : b.status === 'confirmed' ? '#dbeafe' : '#fef9c3',
                      color: b.status === 'paid' ? '#166534' : b.status === 'confirmed' ? '#1e40af' : '#854d0e',
                    }}>
                      {b.status === 'paid' ? 'Pagada' : b.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Customers */}
      {show('customers') && customers.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Clientes <span style={{ color: '#94a3b8', fontWeight: 500 }}>({customers.length})</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0' }}>
            <thead>
              <tr>
                {['ID', 'Nombre', 'Email'].map((h) => <th key={h} style={TH}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td style={{ ...TD, color: '#94a3b8', width: 60 }}>#{c.id}</td>
                  <td style={{ ...TD, fontWeight: 600 }}>{c.name}</td>
                  <td style={{ ...TD, color: '#64748b' }}>{(c as any).email ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Businesses */}
      {show('businesses') && businesses.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Comercios <span style={{ color: '#94a3b8', fontWeight: 500 }}>({businesses.length})</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0' }}>
            <thead>
              <tr>
                {['ID', 'Nombre', 'Teléfono'].map((h) => <th key={h} style={TH}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {businesses.map((b) => (
                <tr key={b.id}>
                  <td style={{ ...TD, color: '#94a3b8', width: 60 }}>#{b.id}</td>
                  <td style={{ ...TD, fontWeight: 600 }}>{b.name}</td>
                  <td style={{ ...TD, color: '#64748b' }}>{(b as any).phone ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payments */}
      {show('payments') && payments.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Pagos <span style={{ color: '#94a3b8', fontWeight: 500 }}>({payments.length})</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0' }}>
            <thead>
              <tr>
                {['ID', 'Importe', 'Estado', 'Fecha'].map((h) => <th key={h} style={TH}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td style={{ ...TD, color: '#94a3b8', width: 60 }}>#{p.id}</td>
                  <td style={{ ...TD, fontWeight: 600 }}>{p.amount} €</td>
                  <td style={TD}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 5,
                      fontSize: 11,
                      fontWeight: 600,
                      background: p.status === 'paid' ? '#dcfce7' : '#fef9c3',
                      color: p.status === 'paid' ? '#166534' : '#854d0e',
                    }}>
                      {p.status === 'paid' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </td>
                  <td style={{ ...TD, color: '#64748b' }}>{p.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>Generado por Ordy · {dateStr}</div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>ordy.app</div>
      </div>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────── */
export default function ExportReportButton({
  bookings,
  customers,
  businesses,
  payments,
}: ExportReportButtonProps) {
  const [open, setOpen]       = useState(false);
  const [page, setPage]       = useState<ExportPage>('bookings');
  const [format, setFormat]   = useState<ExportFormat>('xlsx');
  const [loading, setLoading] = useState(false);
  const jpgRef = useRef<HTMLDivElement>(null);

  function close() { setOpen(false); }

  async function handleExport() {
    setLoading(true);
    try {
      if (format === 'xlsx') {
        await downloadExcelReport(bookings, customers, businesses, page, payments ?? []);
      } else if (format === 'docx') {
        await downloadDocx(bookings, customers, businesses, page, payments ?? []);
      } else if (format === 'pdf') {
        await downloadPdf(bookings, customers, businesses, page, payments ?? []);
      } else if (format === 'jpg') {
        if (!jpgRef.current) throw new Error('Nodo de captura no disponible');
        await downloadJpgFromNode(
          jpgRef.current,
          `ordy-${fileNames[page]}-export-${new Date().toISOString().slice(0, 10)}.jpg`
        );
      }
      close();
    } catch (err) {
      console.error('Export failed', err);
      alert('No se pudo generar el archivo. Revisa la consola para más detalles.');
    } finally {
      setLoading(false);
    }
  }

  const selPage   = pages.find((p) => p.id === page)!;
  const selFormat = formats.find((f) => f.id === format)!;
  const fileName  = `${fileNames[page]}.${format}`;
  const dateStr   = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <>
      {/* ── Trigger button ── */}
      <button 
        type="button"
        className="primary-btn"
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 18px',
          background: 'primary',
          color: 'primary',
          border: 'none',
          borderRadius: 14,
          fontSize: 16,
          fontWeight: 600,
          cursor: 'pointer',
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
        }}
      >
        Exportar informe
      </button>

      {/* ── Hidden JPG capture node — off-screen ── */}
      {open && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: '-9999px',
            pointerEvents: 'none',
            zIndex: -1,
          }}
          aria-hidden
        >
          <div ref={jpgRef}>
            <JpgReportNode
              page={page}
              bookings={bookings}
              customers={customers}
              businesses={businesses}
              payments={payments ?? []}
            />
          </div>
        </div>
      )}

      {/* ── Modal ── */}
      {open && (
        <>
          {/* Overlay */}
          <div
            onClick={close}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15,23,42,0.35)',
              zIndex: 60,
              backdropFilter: 'blur(2px)',
              // Prevent page scroll from leaking through overlay on iOS
              overscrollBehavior: 'contain',
            }}
          />

          {/* Dialog */}
          <div
            role="dialog"
            aria-modal
            aria-label="Exportar informe"
            className="ordy-export-dialog"
          >
            {/* ── Header (sticky) ── */}
            <div
              style={{
                padding: '18px 20px 14px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
                // Keep header visible while body scrolls
                flexShrink: 0,
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                  Ordy · Exportar informe
                </p>
                <h2 style={{ margin: '3px 0 0', fontSize: 18, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  Selecciona sección y formato
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  width: 30,
                  height: 30,
                  fontSize: 18,
                  lineHeight: 1,
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                ×
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div
              style={{
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
                overflowY: 'auto',
                // Smooth momentum scrolling on iOS
                WebkitOverflowScrolling: 'touch',
                // Fill remaining space so footer stays at bottom
                flex: 1,
                minHeight: 0,
              }}
            >
              {/* Section picker */}
              <div>
                <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Sección
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {pages.map((p) => {
                    const active = page === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPage(p.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 9,
                          border: active ? '1px solid #c7d7fd' : '1px solid transparent',
                          background: active ? '#eef2ff' : 'transparent',
                          color: active ? '#3730a3' : '#475569',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.1s',
                          // Comfortable tap target on mobile
                          minHeight: 44,
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: active ? 600 : 400 }}>{p.label}</span>
                        <span style={{ fontSize: 11, color: active ? '#6366f1' : '#94a3b8' }}>{p.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Format picker */}
              <div>
                <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Formato
                </p>
                {/* 4-col on ≥400px, 2-col on small phones — handled via className */}
                <div className="ordy-format-grid">
                  {formats.map((f) => {
                    const active = format === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFormat(f.id)}
                        style={{
                          padding: '12px 8px',
                          borderRadius: 9,
                          border: active ? '1px solid #0f172a' : '1px solid #e2e8f0',
                          background: active ? '#0f172a' : '#f8fafc',
                          color: active ? '#ffffff' : '#475569',
                          cursor: 'pointer',
                          fontWeight: active ? 700 : 500,
                          fontSize: 14,
                          transition: 'all 0.1s',
                          textAlign: 'center',
                          // Comfortable tap target
                          minHeight: 44,
                        }}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
                <p style={{ margin: '8px 0 0', fontSize: 12, color: '#94a3b8' }}>{selFormat.desc}</p>
              </div>

              {/* File preview card */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Archivo generado</p>
                  <p style={{ margin: '3px 0 0', fontSize: 15, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em', wordBreak: 'break-all' }}>
                    {fileName}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{dateStr} · {selPage.label}</p>
                </div>
                <div
                  style={{
                    background: '#e2e8f0',
                    borderRadius: 7,
                    padding: '5px 11px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#334155',
                    flexShrink: 0,
                  }}
                >
                  {selFormat.label}
                </div>
              </div>
            </div>

            {/* ── Footer (sticky) ── */}
            <div
              style={{
                padding: '12px 20px 16px',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexShrink: 0,
                // Safe area padding for phones with home bar
                paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
              }}
            >
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selPage.label} · {selFormat.label}
              </p>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={close}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 9,
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    minHeight: 40,
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={loading}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 9,
                    background: loading ? '#94a3b8' : '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    letterSpacing: '-0.01em',
                    transition: 'background 0.1s',
                    minHeight: 40,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {loading ? (
                    <>
                      <span style={{
                        width: 12,
                        height: 12,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'ordy-spin 0.65s linear infinite',
                        flexShrink: 0,
                      }} />
                      Generando…
                    </>
                  ) : 'Exportar'}
                </button>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes ordy-spin {
              to { transform: rotate(360deg); }
            }

            /* ── Dialog positioning & scroll ── */
            .ordy-export-dialog {
              position: fixed;
              /* Centre on desktop */
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              z-index: 70;

              width: calc(100% - 32px);
              max-width: 540px;

              /* Cap height so body scroll kicks in on short viewports */
              max-height: calc(100dvh - 32px);

              background: #ffffff;
              border-radius: 16px;
              border: 1px solid #e2e8f0;
              box-shadow: 0 20px 60px rgba(15,23,42,0.15), 0 4px 16px rgba(15,23,42,0.08);

              /* Flex column: header | scrollable body | footer */
              display: flex;
              flex-direction: column;
              overflow: hidden;
            }

            /* Format grid: 4-col on wide screens, 2-col on small phones */
            .ordy-format-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
            }

            /* ── Mobile: stick to bottom like a sheet ── */
            @media (max-width: 480px) {
              .ordy-export-dialog {
                top: auto;
                left: 0;
                right: 0;
                bottom: 0;
                transform: none;
                width: 100%;
                max-width: 100%;
                /* Nearly full height on phones */
                max-height: 92dvh;
                border-radius: 20px 20px 0 0;
              }

              .ordy-format-grid {
                grid-template-columns: repeat(2, 1fr);
              }
            }

            /* ── Tablet: centred, a little more breathing room ── */
            @media (min-width: 481px) and (max-width: 768px) {
              .ordy-export-dialog {
                max-height: calc(100dvh - 48px);
              }
            }
          `}</style>
        </>
      )}
    </>
  );
}