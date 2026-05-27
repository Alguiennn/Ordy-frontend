"use client";

import { useState } from "react";
import type { Payment, CreatePaymentDto, UpdatePaymentDto, PaymentStatus } from "@/lib/api";
import { createPayment, updatePayment, deletePayment } from "@/lib/api";

function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className={`badge badge--${status === "paid" ? "confirmed" : "pending"}`}>
      {status === "paid" ? "Pagado" : "Pendiente"}
    </span>
  );
}

export default function PaymentsClient({ initialPayments }: { initialPayments: Payment[] }) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);

  const emptyForm: CreatePaymentDto = {
    code: "", customerId: 1, businessId: 1, amount: 0, method: "", date: "", status: "pending",
  };

  const [createForm, setCreateForm] = useState<CreatePaymentDto>(emptyForm);
  const [editForm, setEditForm] = useState<CreatePaymentDto>(emptyForm);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const totalRevenue = payments.filter(p => p.status === "paid").reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingRevenue = payments.filter(p => p.status === "pending").reduce((sum, p) => sum + Number(p.amount), 0);

  function openEditForm(payment: Payment) {
    setErrorMessage(""); setSuccessMessage("");
    setIsCreateOpen(false); setDeleteTargetId(null);
    setEditingId(payment.id);
    setEditForm({ code: payment.code, customerId: payment.customerId, businessId: payment.businessId, amount: payment.amount, method: payment.method, date: payment.date, status: payment.status });
  }

  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingCreate(true); setErrorMessage(""); setSuccessMessage("");
    try {
      const created = await createPayment(createForm);
      setPayments(prev => [created, ...prev]);
      setCreateForm(emptyForm); setIsCreateOpen(false);
      setSuccessMessage("Pago registrado correctamente.");
    } catch { setErrorMessage("No se pudo registrar el pago."); }
    finally { setLoadingCreate(false); }
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingId) return;
    setLoadingEdit(true); setErrorMessage(""); setSuccessMessage("");
    try {
      const updated = await updatePayment(editingId, editForm as UpdatePaymentDto);
      setPayments(prev => prev.map(p => p.id === editingId ? updated : p));
      setEditingId(null); setEditForm(emptyForm);
      setSuccessMessage("Pago actualizado correctamente.");
    } catch { setErrorMessage("No se pudo actualizar el pago."); }
    finally { setLoadingEdit(false); }
  }

  async function confirmDelete() {
    if (deleteTargetId === null) return;
    setDeletingId(deleteTargetId); setErrorMessage(""); setSuccessMessage("");
    try {
      await deletePayment(deleteTargetId);
      setPayments(prev => prev.filter(p => p.id !== deleteTargetId));
      setSuccessMessage("Pago eliminado correctamente.");
      setDeleteTargetId(null);
    } catch { setErrorMessage("No se pudo eliminar el pago."); }
    finally { setDeletingId(null); }
  }

  const FormFields = ({ form, update }: {
    form: CreatePaymentDto;
    update: <K extends keyof CreatePaymentDto>(k: K, v: CreatePaymentDto[K]) => void;
  }) => (
    <div className="form-grid">
      <input className="input" placeholder="Código (COB-001)" value={form.code} onChange={e => update("code", e.target.value)} />
      <input className="input" type="number" min={1} placeholder="Customer ID" value={form.customerId} onChange={e => update("customerId", Number(e.target.value))} required />
      <input className="input" type="number" min={1} placeholder="Business ID" value={form.businessId} onChange={e => update("businessId", Number(e.target.value))} required />
      <input className="input" type="number" min={0} step="0.01" placeholder="Importe" value={form.amount} onChange={e => update("amount", Number(e.target.value))} required />
      <input className="input" placeholder="Método (Tarjeta, Bizum...)" value={form.method} onChange={e => update("method", e.target.value)} required />
      <input className="input" type="date" value={form.date} onChange={e => update("date", e.target.value)} required />
      <select className="select" value={form.status} onChange={e => update("status", e.target.value as PaymentStatus)}>
        <option value="pending">Pendiente</option>
        <option value="paid">Pagado</option>
      </select>
    </div>
  );

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <h2>Pagos</h2>
          <p>Registro de cobros conectado con la API.</p>
        </div>
        <button className="primary-btn" type="button" onClick={() => { setIsCreateOpen(true); setEditingId(null); setErrorMessage(""); setSuccessMessage(""); }}>
          Registrar cobro 💵
        </button>
      </section>

      <section className="kpi-grid">
        <div className="kpi-card">
          <p className="kpi-card__label">Total cobrado</p>
          <h3 className="kpi-card__value">{totalRevenue.toFixed(2)} €</h3>
          <p className="kpi-card__meta kpi-card__meta--positive">{payments.filter(p => p.status === "paid").length} pagos cerrados</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-card__label">Pendiente</p>
          <h3 className="kpi-card__value">{pendingRevenue.toFixed(2)} €</h3>
          <p className="kpi-card__meta kpi-card__meta--warning">{payments.filter(p => p.status === "pending").length} por cobrar</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-card__label">Total registros</p>
          <h3 className="kpi-card__value">{payments.length}</h3>
          <p className="kpi-card__meta">Operaciones totales</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-card__label">Conversión</p>
          <h3 className="kpi-card__value">
            {payments.length ? Math.round((payments.filter(p => p.status === "paid").length / payments.length) * 100) : 0}%
          </h3>
          <p className="kpi-card__meta">Cobros cerrados</p>
        </div>
      </section>

      {isCreateOpen && (
        <section className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Nuevo cobro</h3>
            <button className="secondary-btn" onClick={() => { setIsCreateOpen(false); setCreateForm(emptyForm); }}>Cancelar</button>
          </div>
          <form onSubmit={handleCreateSubmit} className="page-stack" style={{ gap: 16 }}>
            <FormFields form={createForm} update={(k, v) => setCreateForm(prev => ({ ...prev, [k]: v }))} />
            {errorMessage && <div className="message-error">{errorMessage}</div>}
            <div className="message-row">
              <button className="primary-btn" type="submit" disabled={loadingCreate}>
                {loadingCreate ? "Guardando..." : "Registrar cobro"}
              </button>
            </div>
          </form>
        </section>
      )}

      {editingId !== null && (
        <section className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Editar cobro #{editingId}</h3>
            <button className="secondary-btn" onClick={() => { setEditingId(null); setEditForm(emptyForm); }}>Cancelar</button>
          </div>
          <form onSubmit={handleEditSubmit} className="page-stack" style={{ gap: 16 }}>
            <FormFields form={editForm} update={(k, v) => setEditForm(prev => ({ ...prev, [k]: v }))} />
            {errorMessage && <div className="message-error">{errorMessage}</div>}
            <div className="message-row">
              <button className="primary-btn" type="submit" disabled={loadingEdit}>
                {loadingEdit ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </section>
      )}

      {deleteTargetId !== null && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={e => { if (e.target === e.currentTarget) setDeleteTargetId(null); }}>
          <div className="modal-card">
            <div className="modal-icon">!</div>
            <h3 className="modal-title">Eliminar cobro</h3>
            <p className="modal-text">¿Seguro que quieres eliminar el cobro #{deleteTargetId}? Esta acción no se puede deshacer.</p>
            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => setDeleteTargetId(null)}>Cancelar</button>
              <button className="danger-btn" onClick={confirmDelete} disabled={deletingId === deleteTargetId}>
                {deletingId === deleteTargetId ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="section-card">
        <div className="panel-title-row">
          <h3 className="panel-title">Listado de cobros</h3>
          <span style={{ color: "var(--muted)", fontSize: 13 }}>{payments.length} resultados</span>
        </div>

        {successMessage && <div className="message-success" style={{ marginBottom: 12 }}>{successMessage}</div>}
        {errorMessage && <div className="message-error" style={{ marginBottom: 12 }}>{errorMessage}</div>}

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Código</th><th>Customer</th><th>Business</th><th>Importe</th><th>Método</th><th>Fecha</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id}>
                <td style={{ fontWeight: 600 }}>{payment.id}</td>
                <td>{payment.code}</td>
                <td>{payment.customerId}</td>
                <td>{payment.businessId}</td>
                <td>{Number(payment.amount).toFixed(2)} €</td>
                <td>{payment.method}</td>
                <td>{payment.date}</td>
                <td><PaymentBadge status={payment.status} /></td>
                <td>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="secondary-btn" onClick={() => openEditForm(payment)}>Editar</button>
                    <button className="secondary-btn" onClick={() => { setDeleteTargetId(payment.id); setErrorMessage(""); setSuccessMessage(""); }}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}