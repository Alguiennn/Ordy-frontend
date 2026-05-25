'use client';

import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import { toJpeg } from 'html-to-image';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  HeadingLevel,
} from 'docx';
import { Booking, Business, Customer, Payment } from '@/lib/api';

type ExportPage = 'bookings' | 'customers' | 'businesses' | 'payments' | 'all';

const exportPageTitles: Record<ExportPage, string> = {
  bookings: 'Reservas',
  customers: 'Clientes',
  businesses: 'Comercios',
  payments: 'Pagos',
  all: 'Todas las páginas',
};

export async function downloadPdf(
  bookings: Booking[],
  customers: Customer[],
  businesses: Business[],
  page: ExportPage = 'bookings',
  payments: Payment[] = []
) {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
  const margin = 40;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let y = margin;

  pdf.setFontSize(18);
  pdf.text('Informe Ordy', margin, y);
  y += 24;

  pdf.setFontSize(11);
  pdf.text(`Página: ${exportPageTitles[page]}`, margin, y);
  pdf.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, pageWidth - margin - 150, y);
  y += 22;

  const drawTable = (title: string, headers: string[], rows: Array<Array<string | number | undefined>>) => {
    pdf.setFontSize(13);
    pdf.setTextColor('#1f2937');
    pdf.text(title, margin, y);
    y += 18;

    const colWidths = [100, 60, 150, 150, 170, 90];
    const rowHeight = 18;
    const startX = margin;
    let x = startX;
    const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);

    const drawHeader = () => {
      pdf.setFillColor(243, 244, 246);
      pdf.setDrawColor(226, 232, 240);
      pdf.rect(startX, y - 14, tableWidth, rowHeight, 'F');

      pdf.setFontSize(10);
      pdf.setTextColor('#0f172a');
      x = startX;
      headers.forEach((header, index) => {
        pdf.text(String(header), x + 4, y);
        x += colWidths[index];
      });
      y += rowHeight;
    };

    pdf.setFillColor(243, 244, 246);
    pdf.setDrawColor(226, 232, 240);
    pdf.rect(startX, y - 14, tableWidth, rowHeight, 'F');

    pdf.setFontSize(10);
    pdf.setTextColor('#0f172a');
    headers.forEach((header, index) => {
      pdf.text(String(header), x + 4, y);
      x += colWidths[index];
    });
    y += rowHeight;

    const renderRow = (row: Array<string | number | undefined>) => {
      if (y + rowHeight > pageHeight - margin) {
        pdf.addPage();
        y = margin;
        drawHeader();
      }
      x = startX;
      pdf.setDrawColor(226, 232, 240);
      pdf.rect(startX, y - rowHeight + 4, tableWidth, rowHeight, 'S');
      row.forEach((cell, index) => {
        const value = String(cell ?? '');
        pdf.text(value, x + 4, y);
        x += colWidths[index];
      });
      y += rowHeight;
    };

    rows.forEach(renderRow);
    y += 14;
  };

  const customerMap = new Map(customers.map((customer) => [customer.id, customer.name]));
  const businessMap = new Map(businesses.map((business) => [business.id, business.name]));

  const bookingRows = bookings.map((booking) => [
    booking.date,
    booking.time,
    customerMap.get(booking.customerId) ?? (booking as any).customerName ?? `Cliente ${booking.customerId}`,
    businessMap.get(booking.businessId) ?? (booking as any).businessName ?? `Comercio ${booking.businessId}`,
    (booking as any).serviceName ?? '',
    booking.status,
  ]);

  const shouldIncludeBookings = page === 'bookings' || page === 'all';
  const shouldIncludeCustomers = page === 'customers' || page === 'all';
  const shouldIncludeBusinesses = page === 'businesses' || page === 'all';
  const shouldIncludePayments = page === 'payments' || page === 'all';

  if (shouldIncludeBookings) {
    drawTable('Reservas', ['Fecha', 'Hora', 'Cliente', 'Comercio', 'Servicio', 'Estado'], bookingRows);
  }

  if (shouldIncludePayments && payments.length > 0) {
    const paymentRows = payments.map((payment) => [payment.id, payment.amount, payment.status, payment.date]);
    drawTable('Pagos', ['ID', 'Importe', 'Estado', 'Fecha'], paymentRows);
  }

  if (shouldIncludeCustomers) {
    const customerRows = customers.map((customer) => [customer.id, customer.name, (customer as any).email ?? '']);
    drawTable('Clientes', ['ID', 'Nombre', 'Email'], customerRows);
  }

  if (shouldIncludeBusinesses) {
    const businessRows = businesses.map((business) => [business.id, business.name, (business as any).phone ?? '']);
    drawTable('Comercios', ['ID', 'Nombre', 'Teléfono'], businessRows);
  }

  pdf.save(`ordy-${page}-export-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function downloadExcelReport(
  bookings: Booking[],
  customers: Customer[],
  businesses: Business[],
  page: ExportPage = 'bookings',
  payments: Payment[] = []
) {
  const wb = new ExcelJS.Workbook();
  const customerMap = new Map(customers.map((customer) => [customer.id, customer.name]));
  const businessMap = new Map(businesses.map((business) => [business.id, business.name]));

  const addHeaderRow = (sheet: ExcelJS.Worksheet, columns: { header: string; key: string; width: number }[]) => {
    sheet.columns = columns;
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true } as any;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } } as any;
    });
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
  };

  if (page === 'bookings' || page === 'all') {
    const bookingsSheet = wb.addWorksheet('Reservas');
    addHeaderRow(bookingsSheet, [
      { header: 'Fecha', key: 'date', width: 15 },
      { header: 'Hora', key: 'time', width: 12 },
      { header: 'Cliente', key: 'client', width: 28 },
      { header: 'Comercio', key: 'business', width: 28 },
      { header: 'Servicio', key: 'service', width: 28 },
      { header: 'Estado', key: 'status', width: 16 },
    ]);
    bookings.forEach((booking) => {
      bookingsSheet.addRow([
        booking.date,
        booking.time,
        customerMap.get(booking.customerId) ?? (booking as any).customerName ?? `Cliente ${booking.customerId}`,
        businessMap.get(booking.businessId) ?? (booking as any).businessName ?? `Comercio ${booking.businessId}`,
        (booking as any).serviceName ?? '',
        booking.status,
      ]);
    });
  }

  if (page === 'payments' || page === 'all') {
    const paymentsSheet = wb.addWorksheet('Pagos');
    addHeaderRow(paymentsSheet, [
      { header: 'ID', key: 'id', width: 12 },
      { header: 'Importe', key: 'amount', width: 16 },
      { header: 'Estado', key: 'status', width: 14 },
      { header: 'Fecha', key: 'date', width: 20 },
    ]);
    payments.forEach((payment) => paymentsSheet.addRow([payment.id, payment.amount, payment.status, payment.date]));
  }

  if (page === 'customers' || page === 'all') {
    const customersSheet = wb.addWorksheet('Clientes');
    addHeaderRow(customersSheet, [
      { header: 'ID', key: 'id', width: 12 },
      { header: 'Nombre', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
    ]);
    customers.forEach((customer) => customersSheet.addRow([customer.id, customer.name, (customer as any).email ?? '']));
  }

  if (page === 'businesses' || page === 'all') {
    const businessesSheet = wb.addWorksheet('Comercios');
    addHeaderRow(businessesSheet, [
      { header: 'ID', key: 'id', width: 12 },
      { header: 'Nombre', key: 'name', width: 30 },
      { header: 'Teléfono', key: 'phone', width: 20 },
    ]);
    businesses.forEach((business) => businessesSheet.addRow([business.id, business.name, (business as any).phone ?? '']));
  }

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ordy-${page}-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  // Export complete - return to avoid duplicate redeclarations
  return;
}

function buildDocxTable(header: string[], rows: Array<Array<string | number | undefined>>) {
  return new Table({
    rows: [
      new TableRow({
        children: header.map(
          (cell) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: String(cell), bold: true })],
                }),
              ],
            })
        ),
      }),
      ...rows.map(
        (row) =>
          new TableRow({
            children: row.map(
              (cell) =>
                new TableCell({
                  children: [new Paragraph(String(cell ?? ''))],
                })
            ),
          })
      ),
    ],
    width: {
      size: 100,
      type: 'pct',
    },
  });
}

export async function downloadDocx(
  bookings: Booking[],
  customers: Customer[],
  businesses: Business[],
  page: ExportPage = 'bookings',
  payments: Payment[] = []
) {
  const customerMap = new Map(customers.map((customer) => [customer.id, customer.name]));
  const businessMap = new Map(businesses.map((business) => [business.id, business.name]));

  const sectionChildren: any[] = [
    new Paragraph({
      text: 'Informe Ordy',
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      text: `Página: ${exportPageTitles[page]}`,
    }),
  ];

  const addBuildSection = (title: string, header: string[], rows: Array<Array<string | number | undefined>>) => {
    sectionChildren.push(new Paragraph({ text: title, spacing: { before: 200, after: 100 } }));
    sectionChildren.push(buildDocxTable(header, rows));
  };

  if (page === 'bookings' || page === 'all') {
    addBuildSection(
      'Reservas',
      ['Fecha', 'Hora', 'Cliente', 'Comercio', 'Servicio', 'Estado'],
      bookings.map((booking) => [
        booking.date,
        booking.time,
        customerMap.get(booking.customerId) ?? (booking as any).customerName ?? `Cliente ${booking.customerId}`,
        businessMap.get(booking.businessId) ?? (booking as any).businessName ?? `Comercio ${booking.businessId}`,
        (booking as any).serviceName ?? '',
        booking.status,
      ])
    );
  }

  if (page === 'customers' || page === 'all') {
    addBuildSection(
      'Clientes',
      ['ID', 'Nombre', 'Email'],
      customers.map((customer) => [customer.id, customer.name, (customer as any).email ?? ''])
    );
  }

  if (page === 'businesses' || page === 'all') {
    addBuildSection(
      'Comercios',
      ['ID', 'Nombre', 'Teléfono'],
      businesses.map((business) => [business.id, business.name, (business as any).phone ?? ''])
    );
  }

  if (page === 'payments' || page === 'all') {
    addBuildSection(
      'Pagos',
      ['ID', 'Importe', 'Estado', 'Fecha'],
      payments.map((payment) => [payment.id, payment.amount, payment.status, payment.date])
    );
  }

  const docFile = new Document({ sections: [{ children: sectionChildren }] });
  const blob = await Packer.toBlob(docFile);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ordy-${page}-export-${new Date().toISOString().slice(0, 10)}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function downloadJpgFromNode(node: HTMLElement, fileName: string) {
  const dataUrl = await toJpeg(node, { quality: 0.95, backgroundColor: '#ffffff' });
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
