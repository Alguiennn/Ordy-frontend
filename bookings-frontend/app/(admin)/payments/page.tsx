type PaymentStatus = "pending" | "paid";

type Payment = {
  id: string;
  client: string;
  business: string;
  amount: string;
  method: string;
  date: string;
  status: PaymentStatus;
};

const payments: Payment[] = [
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
  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <h2>Payments</h2>
          <p>Seguimiento de cobros realizados y pendientes.</p>
        </div>

        <button className="primary-btn" type="button">
          Registrar cobro
        </button>
      </section>

      <section className="kpi-grid">
        <KpiCard
          title="Cobrado hoy"
          value="171 €"
          subtitle="4 operaciones registradas"
          variant="positive"
        />
        <KpiCard
          title="Pendiente"
          value="80 €"
          subtitle="1 cobro por revisar"
          variant="warning"
        />
        <KpiCard title="Método más usado" value="Tarjeta" subtitle="Mayor volumen del día" />
        <KpiCard title="Conversión" value="84%" subtitle="Cobros cerrados hoy" />
      </section>

      <section className="section-card">
        <div className="panel-title-row">
          <h3 className="panel-title">Listado de cobros</h3>
          <span style={{ color: "#6b7280", fontSize: 14 }}>
            {payments.length} resultados
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
            {payments.map((payment) => (
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
}