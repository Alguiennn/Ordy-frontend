'use client';

import { useState, useEffect } from "react";
import type { Payment, CreatePaymentDto, UpdatePaymentDto, PaymentStatus, Customer, Business } from "@/lib/api";
import { createPayment, updatePayment, deletePayment, getCustomers, getBusinesses, getDecodedToken, type DecodedToken } from "@/lib/api";
import TypewriterGreeting from "@/components/TypewriterGreeting";
import Pagination from "@/components/Pagination";

const PAYMENT_METHODS = ["Tarjeta", "Bizum", "Efectivo", "Transferencia", "Suscripción"];

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const label = status === "paid" ? "Pagado" : status === "cancelled" ? "Cancelado" : "Por cobrar";
  const badgeClass = status === "paid" ? "confirmed" : status === "cancelled" ? "pending" : "pending";
  return (
    <span className={`badge badge--${badgeClass}`} style={status === "cancelled" ? { background: "var(--danger, #ef4444)", color: "#fff" } : undefined}>
      {label}
    </span>
  );
}

export default function PaymentsClient({ initialPayments }: { initialPayments: Payment[] }) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [currentUser, setCurrentUser] = useState<DecodedToken | null>(null);

  // Cargar clientes y negocios para los selectores
  useEffect(() => {
    getCustomers().then(setCustomers).catch(() => {});
    getBusinesses().then(setBusinesses).catch(() => {});
    setCurrentUser(getDecodedToken());
  }, []);

  const emptyForm = {
    code: "", 
    customerId: "", 
    businessId: "", 
    amount: "", 
    method: PAYMENT_METHODS[0], 
    date: new Date().toISOString().split('T')[0], 
    status: "pending" as PaymentStatus,
  };

  const [createForm, setCreateForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deletingId, setDeletingId]         = useState<number | null>(null);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingEdit, setLoadingEdit]       = useState(false);
  
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  // Inicializar ID por defecto cuando cargan los datos
  useEffect(() => {
    if (customers.length > 0 && businesses.length > 0) {
      setCreateForm(prev => ({
        ...prev,
        customerId: prev.customerId || String(customers[0].id),
        businessId: prev.businessId || String(businesses[0].id)
      }));
    }
  }, [customers, businesses]);

  // 📊 CÁLCULOS DINÁMICOS
  const paidPayments = payments.filter(p => p.status === "paid");
  const pendingPayments = payments.filter(p => p.status === "pending");
  
  const totalRevenue = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingRevenue = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  const getMostUsedMethod = (): string => {
    if (paidPayments.length === 0) return "Ninguno";
    const counts: Record<string, number> = {};
    paidPayments.forEach((p) => {
      if (p.method) counts[p.method] = (counts[p.method] || 0) + 1;
    });
    let mostUsed = "Ninguno";
    let maxCount = 0;
    Object.entries(counts).forEach(([method, count]) => {
      if (count > maxCount) { maxCount = count; mostUsed = method; }
    });
    return mostUsed;
  };

  function openEditForm(payment: Payment) {
    setErrorMessage(""); setSuccessMessage("");
    setIsCreateOpen(false); setDeleteTargetId(null);
    setEditingId(payment.id);
    
    const cId = typeof payment.customerId === 'object' ? (payment.customerId as any)?.id : payment.customerId;
    const bId = typeof payment.businessId === 'object' ? (payment.businessId as any)?.id : payment.businessId;

    setEditForm({ 
      code: payment.code || "", 
      customerId: String(cId) || (customers[0]?.id ? String(customers[0].id) : "1"), 
      businessId: String(bId) || (businesses[0]?.id ? String(businesses[0].id) : "1"), 
      amount: String(payment.amount) || "", 
      method: payment.method || PAYMENT_METHODS[0], 
      date: payment.date || "", 
      status: payment.status || "pending" 
    });
  }

  function prepareDto(formValues: typeof emptyForm): CreatePaymentDto {
    return {
      code: formValues.code || `COB-${Date.now().toString().slice(-6)}`,
      customerId: Number(formValues.customerId) || customers[0]?.id || 1,
      businessId: Number(formValues.businessId) || businesses[0]?.id || 1,
      amount: parseFloat(formValues.amount) || 0,
      method: formValues.method,
      date: formValues.date,
      status: formValues.status
    };
  }

  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingCreate(true); setErrorMessage(""); setSuccessMessage("");
    try {
      const dto = prepareDto(createForm);
      const created = await createPayment(dto);
      const cId = created.customerId ?? (created as any).customer?.id;
      const bId = created.businessId ?? (created as any).business?.id;
      const createdWithRelations = {
        ...created,
        customerId: cId,
        businessId: bId,
      };
      setPayments(prev => [createdWithRelations, ...prev]);
      setCreateForm(prev => ({
        ...emptyForm,
        customerId: String(customers[0]?.id || ""),
        businessId: String(businesses[0]?.id || "")
      }));
      setIsCreateOpen(false);
      setSuccessMessage("Pago registrado correctamente.");
    } catch (err: any) { 
      console.error("Error al crear pago:", err);
      setErrorMessage(err.message || "No se pudo registrar el pago.");
    } finally { setLoadingCreate(false); }
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingId) return;
    setLoadingEdit(true); setErrorMessage(""); setSuccessMessage("");
    try {
      const dto = prepareDto(editForm);
      const updated = await updatePayment(editingId, dto as UpdatePaymentDto);
      const cId = updated.customerId ?? (updated as any).customer?.id;
      const bId = updated.businessId ?? (updated as any).business?.id;
      const updatedWithRelations = {
        ...updated,
        customerId: cId,
        businessId: bId,
      };
      setPayments(prev => prev.map(p => p.id === editingId ? updatedWithRelations : p));
      setEditingId(null); setEditForm(emptyForm);
      setSuccessMessage("Pago actualizado correctamente.");
    } catch (err: any) { 
      console.error("Error al editar pago:", err);
      setErrorMessage(err.message || "No se pudo actualizar el pago.");
    } finally { setLoadingEdit(false); }
  }

  async function confirmDelete() {
    if (deleteTargetId === null) return;
    setDeletingId(deleteTargetId); setErrorMessage(""); setSuccessMessage("");
    try {
      await deletePayment(deleteTargetId);
      setPayments(prev => prev.filter(p => p.id !== deleteTargetId));
      setSuccessMessage("Pago eliminado correctamente.");
      setDeleteTargetId(null);
    } catch (err: any) {
      console.error("Error al eliminar pago:", err);
      setErrorMessage(err.message || "No se pudo eliminar el pago.");
    } finally { 
      setDeletingId(null); 
    }
  }

  const updateCreateField = (key: keyof typeof emptyForm, val: any) => {
    setCreateForm(prev => ({ ...prev, [key]: val }));
  };

  const updateEditField = (key: keyof typeof emptyForm, val: any) => {
    setEditForm(prev => ({ ...prev, [key]: val }));
  };

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
          <p>Registro y gestión de cobros con validación en tiempo real.</p>
        </div>
        <button className="primary-btn" type="button" onClick={() => {
          setIsCreateOpen(true);
          setEditingId(null);
          setErrorMessage("");
          setSuccessMessage("");
          setCreateForm(prev => ({
            ...prev,
            customerId: prev.customerId || String(customers[0]?.id || ""),
            businessId: prev.businessId || String(businesses[0]?.id || "")
          }));
        }}>
          Registrar pago
        </button>
      </section>

      <section className="kpi-grid">
        <div className="kpi-card">
          <p className="kpi-card__label">Total cobrado</p>
          <h3 className="kpi-card__value">{totalRevenue.toFixed(2)} €</h3>
          <p className="kpi-card__meta kpi-card__meta--positive">
            {paidPayments.length === 1 ? "1 pago cerrado" : `${paidPayments.length} pagos cerrados`}
          </p>
        </div>
        <div className="kpi-card">
          <p className="kpi-card__label">Pendiente</p>
          <h3 className="kpi-card__value">{pendingRevenue.toFixed(2)} €</h3>
          <p className="kpi-card__meta kpi-card__meta--warning">
            {pendingPayments.length === 1 ? "1 por cobrar" : `${pendingPayments.length} por cobrar`}
          </p>
        </div>
        <div className="kpi-card">
          <p className="kpi-card__label">Método más usado</p>
          <h3 className="kpi-card__value">{getMostUsedMethod()}</h3>
          <p className="kpi-card__meta">Tendencia de hoy</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-card__label">Conversión</p>
          <h3 className="kpi-card__value">
            {payments.length ? Math.round((paidPayments.length / payments.length) * 100) : 0}%
          </h3>
          <p className="kpi-card__meta">Eficiencia operativa</p>
        </div>
      </section>

      {/* FORMULARIO NUEVO COBRO */}
      {isCreateOpen && (
        <div className="form-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) { setIsCreateOpen(false); setErrorMessage(""); } }}>
          <section className="form-modal-card">
            <div className="panel-title-row">
              <h3 className="panel-title">Nuevo cobro</h3>
              <button className="secondary-btn" onClick={() => { setIsCreateOpen(false); setErrorMessage(""); }}>Cancelar</button>
            </div>
            <form onSubmit={handleCreateSubmit} className="page-stack" style={{ gap: 16 }}>
              <div className="form-grid">
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Cliente</label>
                  <select className="select" value={createForm.customerId} onChange={e => updateCreateField("customerId", e.target.value)} required>
                    <option value="">Selecciona un cliente</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Comercio</label>
                  <select className="select" value={createForm.businessId} onChange={e => updateCreateField("businessId", e.target.value)} required>
                    <option value="">Selecciona un negocio</option>
                    {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Importe (€)</label>
                  <input className="input" type="text" placeholder="Ej: 45.50" value={createForm.amount} onChange={e => updateCreateField("amount", e.target.value.replace(/[^0-9.,]/g, "").replace(",", "."))} required />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Método de Pago</label>
                  <select className="select" value={createForm.method} onChange={e => updateCreateField("method", e.target.value)} required>
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Fecha</label>
                  <input className="input" type="date" value={createForm.date} onChange={e => updateCreateField("date", e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Estado</label>
                  <select className="select" value={createForm.status} onChange={e => updateCreateField("status", e.target.value as PaymentStatus)}>
                    <option value="pending">Pendiente</option>
                    <option value="paid">Pagado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>
              {errorMessage && <div className="message-error">{errorMessage}</div>}
              <div className="message-row">
                <button className="primary-btn" type="submit" disabled={loadingCreate}>
                  {loadingCreate ? "Guardando..." : "Registrar cobro"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* FORMULARIO EDITAR COBRO */}
      {editingId !== null && (
        <div className="form-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) { setEditingId(null); setErrorMessage(""); } }}>
          <section className="form-modal-card">
            <div className="panel-title-row">
              <h3 className="panel-title">Editar cobro #{editingId}</h3>
              <button className="secondary-btn" onClick={() => { setEditingId(null); setErrorMessage(""); }}>Cancelar</button>
            </div>
            <form onSubmit={handleEditSubmit} className="page-stack" style={{ gap: 16 }}>
              <div className="form-grid">
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Cliente</label>
                  <select className="select" value={editForm.customerId} onChange={e => updateEditField("customerId", e.target.value)} required disabled={true}>
                    <option value="">Selecciona un cliente</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Comercio</label>
                  <select className="select" value={editForm.businessId} onChange={e => updateEditField("businessId", e.target.value)} required disabled={true}>
                    <option value="">Selecciona un negocio</option>
                    {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Importe (€)</label>
                  <input className="input" type="text" placeholder="Ej: 45.50" value={editForm.amount} onChange={e => updateEditField("amount", e.target.value.replace(/[^0-9.,]/g, "").replace(",", "."))} required />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Método de Pago</label>
                  <select className="select" value={editForm.method} onChange={e => updateEditField("method", e.target.value)} required>
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Fecha</label>
                  <input className="input" type="date" value={editForm.date} onChange={e => updateEditField("date", e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Estado</label>
                  <select className="select" value={editForm.status} onChange={e => updateEditField("status", e.target.value as PaymentStatus)}>
                    <option value="pending">Pendiente</option>
                    <option value="paid">Pagado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>
              {errorMessage && <div className="message-error">{errorMessage}</div>}
              <div className="message-row">
                <button className="primary-btn" type="submit" disabled={loadingEdit}>
                  {loadingEdit ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* MODAL DE BORRADO */}
      {deleteTargetId !== null && (
        <div className="modal-backdrop" role="dialog" onClick={e => { if (e.target === e.currentTarget) setDeleteTargetId(null); }}>
          <div className="modal-card">
            <div className="modal-icon">!</div>
            <h3 className="modal-title">Eliminar registro</h3>
            <p className="modal-text">¿Estás seguro de que quieres borrar el registro #{deleteTargetId}?</p>
            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => setDeleteTargetId(null)}>Cancelar</button>
              <button className="danger-btn" onClick={confirmDelete} disabled={deletingId === deleteTargetId}>
                {deletingId === deleteTargetId ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLA PRINCIPAL */}
      <section className="section-card">
        <div className="panel-title-row">
          <h3 className="panel-title">Historial de cobros</h3>
          <span style={{ color: "var(--muted)", fontSize: 13 }}>{payments.length} resultados encontrados</span>
        </div>

        {successMessage && <div className="message-success" style={{ marginBottom: 12 }}>{successMessage}</div>}
        {errorMessage && <div className="message-error" style={{ marginBottom: 12 }}>{errorMessage}</div>}

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Cliente</th><th>Comercio</th><th>Importe</th><th>Método</th><th>Fecha</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {payments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(payment => (
              <tr key={payment.id}>
                <td style={{ fontWeight: 600 }}>{payment.id}</td>
                
                {/* Cliente */}
                <td>
                  {(() => {
                    const cId = payment.customerId ?? (payment as any).customer?.id;
                    const matchedCustomer = customers.find(c => c.id === Number(cId));
                    if (matchedCustomer) return matchedCustomer.name;
                    if (typeof payment.customerId === 'object') {
                      return (payment.customerId as any).name || `ID: ${(payment.customerId as any).id}`;
                    }
                    if ((payment as any).customer?.name) return (payment as any).customer.name;
                    return `ID: ${cId ?? "N/D"}`;
                  })()}
                </td>

                {/* Comercio */}
                <td>
                  {(() => {
                    const bId = payment.businessId ?? (payment as any).business?.id;
                    const matchedBiz = businesses.find(b => b.id === Number(bId));
                    if (matchedBiz) return matchedBiz.name;
                    if (typeof payment.businessId === 'object') {
                      return (payment.businessId as any).name || `ID: ${(payment.businessId as any).id}`;
                    }
                    if ((payment as any).business?.name) return (payment as any).business.name;
                    return `ID: ${bId ?? "N/D"}`;
                  })()}
                </td>
                
                <td>{Number(payment.amount).toFixed(2)} €</td>
                <td>{payment.method}</td>
                <td>{payment.date}</td>
                <td><PaymentBadge status={payment.status} /></td>
                
                <td>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="secondary-btn" onClick={() => openEditForm(payment)}>Editar</button>
                    {currentUser?.role !== "standard" && (
                      <button className="secondary-btn" onClick={() => setDeleteTargetId(payment.id)}>Eliminar</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Pagination
          currentPage={currentPage}
          totalItems={payments.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </section>
    </div>
  );
}