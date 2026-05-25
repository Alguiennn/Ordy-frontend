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

const pageLabels: Record<ExportPage, string> = {
  bookings: 'Reservas',
  customers: 'Clientes',
  businesses: 'Comercios',
  payments: 'Pagos',
  all: 'Todas las páginas',
};

const formatLabels: Record<ExportFormat, string> = {
  xlsx: 'XLSX',
  docx: 'DOCX',
  pdf: 'PDF',
  jpg: 'JPG',
};

export default function ExportReportButton({ bookings, customers, businesses, payments }: ExportReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<ExportPage>('bookings');
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const previewRef = useRef<HTMLDivElement | null>(null);

  function close() {
    setOpen(false);
  }

  async function handleExport() {
    try {
      if (format === 'xlsx') {
        await downloadExcelReport(bookings, customers, businesses, page, payments ?? []);
      } else if (format === 'docx') {
        await downloadDocx(bookings, customers, businesses, page, payments ?? []);
      } else if (format === 'pdf') {
        await downloadPdf(bookings, customers, businesses, page, payments ?? []);
      } else if (format === 'jpg') {
        if (!previewRef.current) throw new Error('Vista previa no disponible');
        await downloadJpgFromNode(previewRef.current, `ordy-${page}-export-${new Date().toISOString().slice(0, 10)}.jpg`);
      }
    } catch (error) {
      console.error('Export failed', error);
      alert('No se pudo generar el archivo. Revisa la consola para más detalles.');
    } finally {
      close();
    }
  }

  const formatButtonStyle = (value: ExportFormat) => ({
    padding: '0.75rem 1rem',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    background: format === value ? '#0f172a' : '#ffffff',
    color: format === value ? '#ffffff' : '#0f172a',
    cursor: 'pointer',
    minWidth: 86,
  });

  const tableRows = bookings.slice(0, 6);

  return (
    <>
      <button className="primary-btn" type="button" onClick={() => setOpen(true)}>
        Export report
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', zIndex: 70 }}>
          <div
            role="dialog"
            aria-modal
            style={{
              width: 720,
              maxWidth: '96%',
              maxHeight: 'calc(100vh - 3rem)',
              margin: '2vh auto',
              background: '#f8fafc',
              borderRadius: 20,
              padding: '1.5rem',
              boxShadow: '0 24px 80px rgba(15,23,42,0.22)',
              overflowY: 'auto',
            }}
          >
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, color: '#0f172a', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1.2 }}>
                  Exportar informe
                </p>
                <h2 style={{ margin: '0.35rem 0 0', fontSize: 24 }}>Selecciona formato y alcance</h2>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar"
                style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', color: '#0f172a' }}
              >
                ×
              </button>
            </header>

            <section style={{ marginTop: 22, display: 'grid', gap: 20 }}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 210 }}>
                  <p style={{ margin: '0 0 8px', fontWeight: 700 }}>Página</p>
                  {(Object.keys(pageLabels) as ExportPage[]).map((value) => (
                    <label key={value} style={{ display: 'block', marginBottom: 10, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="page"
                        checked={page === value}
                        onChange={() => setPage(value)}
                        style={{ marginRight: 8 }}
                      />
                      {pageLabels[value]}
                    </label>
                  ))}
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 8px', fontWeight: 700 }}>Formato</p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {(Object.keys(formatLabels) as ExportFormat[]).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormat(value)}
                        style={formatButtonStyle(value)}
                      >
                        {formatLabels[value]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div ref={previewRef} style={{ background: '#ffffff', borderRadius: 18, padding: '1rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>Vista previa de exportación</p>
                    <h3 style={{ margin: '4px 0 0', fontSize: 18 }}>{pageLabels[page]}</h3>
                  </div>
                  <span style={{ color: '#0f172a', fontWeight: 700, background: '#e2e8f0', borderRadius: 999, padding: '0.35rem 0.8rem' }}>
                    {formatLabels[format]}
                  </span>
                </div>

                {page === 'bookings' && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 660 }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          <th style={{ textAlign: 'left', padding: '0.85rem', color: '#334155' }}>Fecha</th>
                          <th style={{ textAlign: 'left', padding: '0.85rem', color: '#334155' }}>Hora</th>
                          <th style={{ textAlign: 'left', padding: '0.85rem', color: '#334155' }}>Cliente</th>
                          <th style={{ textAlign: 'left', padding: '0.85rem', color: '#334155' }}>Comercio</th>
                          <th style={{ textAlign: 'left', padding: '0.85rem', color: '#334155' }}>Servicio</th>
                          <th style={{ textAlign: 'left', padding: '0.85rem', color: '#334155' }}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableRows.map((b) => (
                          <tr key={b.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '0.85rem' }}>{b.date}</td>
                            <td style={{ padding: '0.85rem' }}>{b.time}</td>
                            <td style={{ padding: '0.85rem' }}>{(b as any).customerName ?? `Cliente ${b.customerId}`}</td>
                            <td style={{ padding: '0.85rem' }}>{(b as any).businessName ?? `Comercio ${b.businessId}`}</td>
                            <td style={{ padding: '0.85rem' }}>{(b as any).serviceName ?? ''}</td>
                            <td style={{ padding: '0.85rem', fontWeight: 600 }}>{b.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {page === 'customers' && (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {customers.slice(0, 8).map((customer) => (
                      <div key={customer.id} style={{ padding: 14, borderRadius: 14, background: '#f8fafc' }}>
                        <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>Cliente</p>
                        <p style={{ margin: '6px 0 0', fontWeight: 700 }}>{customer.name || `Cliente ${customer.id}`}</p>
                        <p style={{ margin: '4px 0 0', color: '#475569' }}>{(customer as any).email ?? 'Sin email'}</p>
                      </div>
                    ))}
                  </div>
                )}

                {page === 'businesses' && (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {businesses.slice(0, 8).map((business) => (
                      <div key={business.id} style={{ padding: 14, borderRadius: 14, background: '#f8fafc' }}>
                        <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>Comercio</p>
                        <p style={{ margin: '6px 0 0', fontWeight: 700 }}>{business.name || `Comercio ${business.id}`}</p>
                        <p style={{ margin: '4px 0 0', color: '#475569' }}>{(business as any).phone ?? 'Sin teléfono'}</p>
                      </div>
                    ))}
                  </div>
                )}

                {page === 'payments' && (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {(payments ?? []).slice(0, 8).map((payment) => (
                      <div key={payment.id} style={{ padding: 14, borderRadius: 14, background: '#f8fafc' }}>
                        <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>Pago</p>
                        <p style={{ margin: '6px 0 0', fontWeight: 700 }}>{payment.amount} €</p>
                        <p style={{ margin: '4px 0 0', color: '#475569' }}>{payment.date} · {payment.status}</p>
                      </div>
                    ))}
                  </div>
                )}

                {page === 'all' && (
                  <div style={{ display: 'grid', gap: 18 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div style={{ background: '#f8fafc', borderRadius: 14, padding: 14 }}>
                        <p style={{ margin: '0 0 8px', fontSize: 13, color: '#475569' }}>Clientes</p>
                        <p style={{ margin: 0, fontWeight: 700 }}>{customers.length}</p>
                      </div>
                      <div style={{ background: '#f8fafc', borderRadius: 14, padding: 14 }}>
                        <p style={{ margin: '0 0 8px', fontSize: 13, color: '#475569' }}>Comercios</p>
                        <p style={{ margin: 0, fontWeight: 700 }}>{businesses.length}</p>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: 14 }}>
                      <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 14 }}>
                        <p style={{ margin: '0 0 8px', fontSize: 13, color: '#475569' }}>Reservas</p>
                        <p style={{ margin: 0, fontWeight: 700 }}>{bookings.length}</p>
                      </div>
                      <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 14 }}>
                        <p style={{ margin: '0 0 8px', fontSize: 13, color: '#475569' }}>Pagos</p>
                        <p style={{ margin: 0, fontWeight: 700 }}>{payments?.length ?? 0}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <footer style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" className="secondary-btn" onClick={close}>
                Cancelar
              </button>
              <button type="button" className="primary-btn" onClick={handleExport}>
                Exportar {formatLabels[format]}
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
