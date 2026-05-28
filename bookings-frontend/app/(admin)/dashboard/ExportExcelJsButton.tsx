'use client';

import ExcelJS from 'exceljs';
import { Booking, Business, Customer } from '@/lib/api.ts.cpy';

type Props = {
  bookings: Booking[];
  businesses: Business[];
  customers: Customer[];
};

function resolveName(
  booking: Booking,
  map: Map<number, string>,
  idKey: 'customerId' | 'businessId',
  fallbackPrefix: string
) {
  const id = booking[idKey] as number | undefined;
  const resolved = id !== undefined && id !== null ? map.get(id) : undefined;
  if (resolved) return resolved;

  const bookingAny = booking as any;
  if (idKey === 'customerId') {
    if (typeof bookingAny.customerName === 'string') return bookingAny.customerName;
    if (bookingAny.customer?.name) return bookingAny.customer.name;
  } else {
    if (typeof bookingAny.businessName === 'string') return bookingAny.businessName;
    if (bookingAny.business?.name) return bookingAny.business.name;
  }

  return id !== undefined && id !== null ? `${fallbackPrefix} ${id}` : `${fallbackPrefix} desconocido`;
}

export default function ExportExcelJsButton({ bookings, customers, businesses }: Props) {
  async function downloadExcel() {
    const customerMap = new Map(customers.map((c) => [c.id, c.name]));
    const businessMap = new Map(businesses.map((b) => [b.id, b.name]));

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Próximas reservas');

    ws.columns = [
      { header: 'Fecha', key: 'date', width: 15 },
      { header: 'Hora', key: 'time', width: 12 },
      { header: 'Cliente', key: 'client', width: 30 },
      { header: 'Comercio', key: 'business', width: 28 },
      { header: 'Servicio', key: 'service', width: 28 },
      { header: 'Estado', key: 'status', width: 16 },
    ];

    // Add a title row to make header clearer
    ws.addRow([]);
    const headerRow = ws.addRow(ws.columns.map((c) => c.header));

    // Style header row
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FF1F2937' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' },
      } as any;
      cell.alignment = { vertical: 'middle', horizontal: 'left' } as any;
    });

    // Freeze header row (note: we've inserted a title blank row, so freeze at row 2)
    ws.views = [{ state: 'frozen', ySplit: 2 }];

    // Add data rows
    bookings.forEach((booking) => {
      const dateStr = booking.date;
      const timeStr = booking.time;
      const client = resolveName(booking, customerMap, 'customerId', 'Cliente');
      const biz = resolveName(booking, businessMap, 'businessId', 'Comercio');
      const service = (booking as any).serviceName ?? '';
      const status = booking.status;

      ws.addRow({ date: dateStr, time: timeStr, client, business: biz, service, status });
    });

    // Adjust styles for data rows (optional)
    ws.eachRow((row, rowNumber) => {
      if (rowNumber > headerRow.number) {
        row.alignment = { vertical: 'middle', horizontal: 'left' } as any;
      }
    });

    try {
      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ordy-dashboard-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      // fallback: notify user or fallback to CSV
      console.error('Excel export failed', err);
      alert('No se pudo generar el fichero XLSX. Intenta con el export CSV.');
    }
  }

  return (
    <button className="primary-btn" type="button" onClick={downloadExcel}>
      Export XLSX (estilado)
    </button>
  );
}
