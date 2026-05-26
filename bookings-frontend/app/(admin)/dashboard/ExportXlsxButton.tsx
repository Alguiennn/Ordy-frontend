'use client';

import * as XLSX from 'xlsx';
import { Booking, Business, Customer } from '@/lib/api';

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

export default function ExportXlsxButton({ bookings, customers, businesses }: Props) {
  function downloadXlsx() {
    const customerMap = new Map(customers.map((c) => [c.id, c.name]));
    const businessMap = new Map(businesses.map((b) => [b.id, b.name]));

    const header = ['Fecha', 'Hora', 'Cliente', 'Comercio', 'Servicio', 'Estado'];
    const rows = bookings.map((booking) => [
      booking.date,
      booking.time,
      resolveName(booking, customerMap, 'customerId', 'Cliente'),
      resolveName(booking, businessMap, 'businessId', 'Comercio'),
      booking.serviceName,
      booking.status,
    ]);

    const aoa = [header, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // try to set header cells bold (may be ignored by some viewers)
    header.forEach((_, i) => {
      const cellAddr = XLSX.utils.encode_cell({ r: 0, c: i });
      if (!ws[cellAddr]) ws[cellAddr] = { t: 's', v: header[i] } as any;
      try {
        // @ts-ignore - style assignment may not be fully supported in community edition
        ws[cellAddr].s = { font: { bold: true } };
      } catch (e) {
        // ignore style failures
      }
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');

    XLSX.writeFile(wb, `ordy-dashboard-${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  return (
    <button className="primary-btn" type="button" onClick={downloadXlsx}>
      Export XLSX
    </button>
  );
}
