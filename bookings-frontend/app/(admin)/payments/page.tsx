'use client';

import { useState } from 'react';
import TypewriterGreeting from '@/components/TypewriterGreeting';

type PaymentStatus = "pending" | "paid";

type Payment = {
  id: string;
  client: string;
  business: string;
  amount: string; // Se mantiene como string para respetar tu tipado actual
  method: string;
  date: string;
  status: PaymentStatus;
};

const initialPayments: Payment[] = [
  {
    id: "COB-001",
    client: "María López",
    business: "Peluquería Nova",
    amount: "28 €",
    method: "Tarjeta",
    date: "15/04/2026",
    status: "paid",
  },
  {
    id: "COB-002",
    client: "Carlos Pérez",
    business: "Restaurante Marea",
    amount: "80 €",
    method: "Pendiente",
    date: "15/04/2026",
    status: "pending",
  },
  {
    id: "COB-003",
    client: "Lucía Sánchez",
    business: "Barber Studio",
    amount: "18 €",
    method: "Bizum",
    date: "15/04/2026",
    status: "paid",
  },
  {
    id: "COB-004",
    client: "Pedro Ruiz",
    business: "Peluquería Nova",
    amount: "45 €",
    method: "Efectivo",
    date: "16/04/2026",
    status: "paid",
  },
];

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

function Badge({ status }: { status: PaymentStatus }) {
  return (
    <span className={`badge badge--${status === "pending" ? "pending" : "confirmed"}`}>
      {status === "pending" ? "Por cobrar" : "Pagado"}
    </span>
  );
}

export default function PaymentsPage() {
  // Pasamos el array estático a un estado mutable de React
  const [paymentsList, setPaymentsList] = useState<Payment[]>(initialPayments);

  // 🧮 FUNCIÓN AUXILIAR: Extrae el número puro de un string como "28 €"
  const parseAmount = (amountStr: string): number => {
    return parseFloat(amountStr.replace(/[^0-9.]/g, '')) || 0;
  };

  // 📊 CÁLCULOS AUTOMÁTICOS EN TIEMPO REAL

  // 1. Filtrar transacciones pagadas y sumarlas
  const paidPayments = paymentsList.filter((p) => p.status === "paid");
  const totalCobrado = paidPayments.reduce((acc, curr) => acc + parseAmount(curr.amount), 0);
  const totalOperacionesRegistradas = paidPayments.length;

  // 2. Filtrar transacciones pendientes y sumarlas
  const pendingPayments = paymentsList.filter((p) => p.status === "pending");
  const totalPendiente = pendingPayments.reduce((acc, curr) => acc + parseAmount(curr.amount), 0);
  const totalPendientesCount = pendingPayments.length;

  // 3. Calcular método de pago más usado dinámicamente
  const getMostUsedMethod = (): string => {
    if (paymentsList.length === 0) return "Ninguno";
    
    // Contamos cuántas veces se repite cada método (solo de los que ya están pagados)
    const counts: Record<string, number> = {};
    paidPayments.forEach((p) => {
      counts[p.method] = (counts[p.method] || 0) + 1;
    });

    // Buscamos el mayor
    let mostUsed = "Ninguno";
    let maxCount = 0;
    Object.entries(counts).forEach(([method, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostUsed = method;
      }
    });
    return mostUsed;
  };

  // 4. Calcular tasa de conversión (Pagados / Total)
  const totalTransacciones = paymentsList.length;
  const tasaConversion = totalTransacciones > 0 
    ? Math.round((paidPayments.length / totalTransacciones) * 100) 
    : 0;

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <TypewriterGreeting 
            as="h2"
            messages={['Tus ingresos al día.', 'Controla cada transacción.']} 
            loop={false}
            pause={2500}
          />
          <p>Seguimiento de cobros realizados y pendientes.</p>
        </div>

        <button className="primary-btn" type="button">
          Registrar cobro
        </button>
      </section>

      {/* 🛠️ TARJETAS KPI VINCULADAS AUTOMÁTICAMENTE */}
      <section className="kpi-grid">
        <KpiCard
          title="Cobrado hoy"
          value={`${totalCobrado} €`}
          subtitle={`${totalOperacionesRegistradas} operaciones registradas`}
          variant="positive"
        />
        <KpiCard
          title="Pendiente"
          value={`${totalPendiente} €`}
          subtitle={`${totalPendientesCount} ${totalPendientesCount === 1 ? 'cobro por revisar' : 'cobros por revisar'}`}
          variant={totalPendiente > 0 ? "warning" : undefined}
        />
        <KpiCard 
          title="Método más usado" 
          value={getMostUsedMethod()} 
          subtitle="Mayor volumen del día" 
        />
        <KpiCard 
          title="Conversión" 
          value={`${tasaConversion}%`} 
          subtitle="Cobros cerrados hoy" 
        />
      </section>

      <section className="section-card">
        <div className="panel-title-row">
          <h3 className="panel-title">Listado de cobros</h3>
          <span style={{ color: "#6b7280", fontSize: 14 }}>
            {paymentsList.length} resultados
          </span>
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
            {paymentsList.map((payment) => (
              <tr key={payment.id}>
                <td style={{ fontWeight: 600 }}>{payment.id}</td>
                <td>{payment.client}</td>
                <td>{payment.business}</td>
                <td>{payment.amount}</td>
                <td>{payment.method}</td>
                <td>{payment.date}</td>
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
import { getPayments } from "@/lib/api";
import PaymentsClient from "./PaymentsClient";

export default async function PaymentsPage() {
  const payments = await getPayments();
  return <PaymentsClient initialPayments={payments} />;
}