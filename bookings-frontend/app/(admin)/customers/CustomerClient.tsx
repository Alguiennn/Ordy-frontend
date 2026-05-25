"use client";

import { useState } from "react";
import type { Customer, CreateCustomerDto, UpdateCustomerDto } from "@/lib/api";
import { createCustomer, updateCustomer, deleteCustomer } from "@/lib/api";

export default function CustomersClient({ initialCustomers }: { initialCustomers: Customer[] }) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);

  const emptyForm: CreateCustomerDto = {
    code: "", name: "", phone: "", email: "", businessId: 1,
  };

  const [createForm, setCreateForm] = useState<CreateCustomerDto>(emptyForm);
  const [editForm, setEditForm] = useState<CreateCustomerDto>(emptyForm);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function openEditForm(customer: Customer) {
    setErrorMessage(""); setSuccessMessage("");
    setIsCreateOpen(false); setDeleteTargetId(null);
    setEditingId(customer.id);
    setEditForm({ code: customer.code, name: customer.name, phone: customer.phone, email: customer.email, businessId: customer.businessId });
  }

  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingCreate(true); setErrorMessage(""); setSuccessMessage("");
    try {
      const created = await createCustomer(createForm);
      setCustomers(prev => [created, ...prev]);
      setCreateForm(emptyForm); setIsCreateOpen(false);
      setSuccessMessage("Cliente creado correctamente.");
    } catch { setErrorMessage("No se pudo crear el cliente."); }
    finally { setLoadingCreate(false); }
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingId) return;
    setLoadingEdit(true); setErrorMessage(""); setSuccessMessage("");
    try {
      const updated = await updateCustomer(editingId, editForm);
      setCustomers(prev => prev.map(c => c.id === editingId ? updated : c));
      setEditingId(null); setEditForm(emptyForm);
      setSuccessMessage("Cliente actualizado correctamente.");
    } catch { setErrorMessage("No se pudo actualizar el cliente."); }
    finally { setLoadingEdit(false); }
  }

  async function confirmDelete() {
    if (deleteTargetId === null) return;
    setDeletingId(deleteTargetId); setErrorMessage(""); setSuccessMessage("");
    try {
      await deleteCustomer(deleteTargetId);
      setCustomers(prev => prev.filter(c => c.id !== deleteTargetId));
      setSuccessMessage("Cliente eliminado correctamente.");
      setDeleteTargetId(null);
    } catch { setErrorMessage("No se pudo eliminar el cliente."); }
    finally { setDeletingId(null); }
  }

  const FormFields = ({ form, update }: {
    form: CreateCustomerDto;
    update: <K extends keyof CreateCustomerDto>(k: K, v: CreateCustomerDto[K]) => void;
  }) => (
    <div className="form-grid">
      <input className="input" placeholder="Código (C-001)" value={form.code} onChange={e => update("code", e.target.value)} required />
      <input className="input" placeholder="Nombre" value={form.name} onChange={e => update("name", e.target.value)} required />
      <input className="input" placeholder="Teléfono" value={form.phone ?? ""} onChange={e => update("phone", e.target.value)} />
      <input className="input" type="email" placeholder="Email" value={form.email} onChange={e => update("email", e.target.value)} required />
      <input className="input" type="number" min={1} placeholder="Business ID" value={form.businessId} onChange={e => update("businessId", Number(e.target.value))} required />
    </div>
  );

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <h2>Clientes</h2>
          <p>Directorio de clientes conectado con la API.</p>
        </div>
        <button className="primary-btn" type="button" onClick={() => { setIsCreateOpen(true); setEditingId(null); setErrorMessage(""); setSuccessMessage(""); }}>
          Nuevo cliente
        </button>
      </section>

      {isCreateOpen && (
        <section className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Nuevo cliente</h3>
            <button className="secondary-btn" onClick={() => { setIsCreateOpen(false); setCreateForm(emptyForm); }}>Cancelar</button>
          </div>
          <form onSubmit={handleCreateSubmit} className="page-stack" style={{ gap: 16 }}>
            <FormFields form={createForm} update={(k, v) => setCreateForm(prev => ({ ...prev, [k]: v }))} />
            {errorMessage && <div className="message-error">{errorMessage}</div>}
            <div className="message-row">
              <button className="primary-btn" type="submit" disabled={loadingCreate}>
                {loadingCreate ? "Guardando..." : "Crear cliente"}
              </button>
            </div>
          </form>
        </section>
      )}

      {editingId !== null && (
        <section className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Editar cliente #{editingId}</h3>
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
            <h3 className="modal-title">Eliminar cliente</h3>
            <p className="modal-text">¿Seguro que quieres eliminar el cliente #{deleteTargetId}? Esta acción no se puede deshacer.</p>
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
          <h3 className="panel-title">Clientes registrados</h3>
          <span style={{ color: "var(--muted)", fontSize: 13 }}>{customers.length} registros</span>
        </div>

        {successMessage && <div className="message-success" style={{ marginBottom: 12 }}>{successMessage}</div>}
        {errorMessage && <div className="message-error" style={{ marginBottom: 12 }}>{errorMessage}</div>}

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Código</th><th>Nombre</th><th>Teléfono</th><th>Email</th><th>Business</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(customer => (
              <tr key={customer.id}>
                <td style={{ fontWeight: 600 }}>{customer.id}</td>
                <td>{customer.code}</td>
                <td>{customer.name}</td>
                <td>{customer.phone}</td>
                <td>{customer.email}</td>
                <td>{customer.businessId}</td>
                <td>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="secondary-btn" onClick={() => openEditForm(customer)}>Editar</button>
                    <button className="secondary-btn" onClick={() => { setDeleteTargetId(customer.id); setErrorMessage(""); setSuccessMessage(""); }}>Eliminar</button>
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