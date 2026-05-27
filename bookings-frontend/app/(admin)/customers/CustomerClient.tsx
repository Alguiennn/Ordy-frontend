"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Customer, CreateCustomerDto, Business } from "@/lib/api";
import { createCustomer, updateCustomer, deleteCustomer, getBusinesses } from "@/lib/api";

// ── FormFields outside parent to prevent remount on every keystroke ──
function FormFields({
  form,
  update,
  businesses,
}: {
  form: CreateCustomerDto;
  update: <K extends keyof CreateCustomerDto>(k: K, v: CreateCustomerDto[K]) => void;
  businesses: Business[];
}) {
  return (
    <div className="form-grid">
      <input className="input" placeholder="Código (C-001)" value={form.code ?? ""} onChange={e => update("code", e.target.value)} required />
      <input className="input" placeholder="Nombre" value={form.name ?? ""} onChange={e => update("name", e.target.value)} required />
      <input className="input" placeholder="Teléfono" value={form.phone ?? ""} onChange={e => update("phone", e.target.value)} />
      <input className="input" type="email" placeholder="Email" value={form.email ?? ""} onChange={e => update("email", e.target.value)} required />
      {businesses.length > 0 ? (
        <select className="select" value={form.businessId} onChange={e => update("businessId", Number(e.target.value))} required>
          <option value="">Selecciona negocio</option>
          {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      ) : (
        <input className="input" type="number" min={1} placeholder="Business ID" value={form.businessId} onChange={e => update("businessId", Number(e.target.value))} required />
      )}
    </div>
  );
}

export default function CustomersClient({ initialCustomers }: { initialCustomers: Customer[] }) {
  const [customers, setCustomers]         = useState<Customer[]>(initialCustomers);
  const [businesses, setBusinesses]       = useState<Business[]>([]);
  const [filterOpen, setFilterOpen]       = useState(false);
  const [filterSearch, setFilterSearch]   = useState("");
  const filterSearchRef                   = useRef<HTMLInputElement>(null);

  useEffect(() => { getBusinesses().then(setBusinesses).catch(() => {}); }, []);

  // Focus the search input when dropdown opens
  useEffect(() => {
    if (filterOpen) setTimeout(() => filterSearchRef.current?.focus(), 50);
    else setFilterSearch("");
  }, [filterOpen]);

  const businessName = useCallback(
    (id: number | null | undefined, embeddedName?: string | null) => {
      if (embeddedName) return embeddedName;
      if (!id) return "Sin negocio";
      return businesses.find(b => b.id === id)?.name ?? "Sin negocio";
    },
    [businesses]
  );

  const emptyForm: CreateCustomerDto = { code: "", name: "", phone: "", email: "", businessId: businesses[0]?.id ?? 1 };

  const [createForm, setCreateForm]         = useState<CreateCustomerDto>(emptyForm);
  const [editForm, setEditForm]             = useState<CreateCustomerDto>(emptyForm);
  const [isCreateOpen, setIsCreateOpen]     = useState(false);
  const [editingId, setEditingId]           = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deletingId, setDeletingId]         = useState<number | null>(null);
  const [loadingCreate, setLoadingCreate]   = useState(false);
  const [loadingEdit, setLoadingEdit]       = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage]     = useState("");
  const [search, setSearch]                 = useState("");
  const [businessFilter, setBusinessFilter] = useState<number | "all">("all");

  const filteredCustomers = customers.filter(c => {
    const matchesBusiness = businessFilter === "all" || (!!c.businessId && c.businessId === businessFilter);
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      (c.name  ?? "").toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.code  ?? "").toLowerCase().includes(q) ||
      (c.phone ?? "").toLowerCase().includes(q);
    return matchesBusiness && matchesSearch;
  });

  function openEditForm(customer: Customer) {
    setErrorMessage(""); setSuccessMessage("");
    setIsCreateOpen(false); setDeleteTargetId(null);
    setEditingId(customer.id);
    setEditForm({ code: customer.code ?? "", name: customer.name ?? "", phone: customer.phone ?? "", email: customer.email ?? "", businessId: customer.businessId });
  }

  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingCreate(true); setErrorMessage(""); setSuccessMessage("");
    try {
      const created = await createCustomer(createForm);
      setCustomers(prev => [...prev, created].sort((a, b) => a.id - b.id));
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

  // All unique business IDs present in customers
  const presentBusinessIds = Array.from(
    new Set(customers.map(c => c.businessId).filter((id): id is number => !!id))
  ).sort((a, b) => a - b);

  // Dropdown options filtered by the in-dropdown search
  const dropdownOptions = [
    { id: "all" as const, label: "Todos los negocios" },
    ...presentBusinessIds.map(id => ({ id, label: businessName(id) })),
  ].filter(o => !filterSearch || o.label.toLowerCase().includes(filterSearch.toLowerCase()));

  const activeFilterLabel = businessFilter === "all" ? "Todos" : businessName(businessFilter);

  return (
    <div className="page-stack">

      {/* ── Hero ── */}
      <section className="page-hero">
        <div><h2>Clientes</h2><p>Directorio de clientes conectado con la API.</p></div>
        <button className="primary-btn" type="button"
          onClick={() => { setIsCreateOpen(true); setEditingId(null); setErrorMessage(""); setSuccessMessage(""); }}>
          Nuevo cliente
        </button>
      </section>

      {/* ── Create form ── */}
      {isCreateOpen && (
        <section className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Nuevo cliente</h3>
            <button className="secondary-btn" onClick={() => { setIsCreateOpen(false); setCreateForm(emptyForm); }}>Cancelar</button>
          </div>
          <form onSubmit={handleCreateSubmit} className="page-stack" style={{ gap: 16 }}>
            <FormFields form={createForm} update={(k, v) => setCreateForm(prev => ({ ...prev, [k]: v }))} businesses={businesses} />
            {errorMessage && <div className="message-error">{errorMessage}</div>}
            <div className="message-row">
              <button className="primary-btn" type="submit" disabled={loadingCreate}>
                {loadingCreate ? "Guardando..." : "Crear cliente"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ── Edit form ── */}
      {editingId !== null && (
        <section className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Editar cliente #{editingId}</h3>
            <button className="secondary-btn" onClick={() => { setEditingId(null); setEditForm(emptyForm); }}>Cancelar</button>
          </div>
          <form onSubmit={handleEditSubmit} className="page-stack" style={{ gap: 16 }}>
            <FormFields form={editForm} update={(k, v) => setEditForm(prev => ({ ...prev, [k]: v }))} businesses={businesses} />
            {errorMessage && <div className="message-error">{errorMessage}</div>}
            <div className="message-row">
              <button className="primary-btn" type="submit" disabled={loadingEdit}>
                {loadingEdit ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ── Delete modal ── */}
      {deleteTargetId !== null && (
        <div className="modal-backdrop" role="dialog" aria-modal="true"
          onClick={e => { if (e.target === e.currentTarget) setDeleteTargetId(null); }}>
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

      {/* ── Table ── */}
      <section className="section-card">
        <div className="panel-title-row">
          <h3 className="panel-title">Clientes registrados</h3>
          <span style={{ color: "var(--muted)", fontSize: 13 }}>
            {filteredCustomers.length} de {customers.length} registros
          </span>
        </div>

        {/* Filters row */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>

          {/* Text search */}
          <input
            className="input"
            style={{ maxWidth: 240, padding: "8px 14px", fontSize: 13 }}
            placeholder="Buscar nombre, email, código..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          {/* Business dropdown */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setFilterOpen(prev => !prev)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 12px", fontSize: 13,
                border: "1px solid var(--border)", borderRadius: 8,
                background: businessFilter !== "all" ? "var(--primary)" : "var(--surface)",
                color: businessFilter !== "all" ? "#fff" : "var(--text)",
                cursor: "pointer", whiteSpace: "nowrap",
                maxWidth: 180,
              }}
            >
              {/* Filter icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              {/* Label truncated */}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 110 }}>
                {activeFilterLabel}
              </span>
              {/* Chevron */}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{ flexShrink: 0, transform: filterOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {filterOpen && (
              <>
                {/* Click-outside overlay */}
                <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setFilterOpen(false)} />

                {/* Dropdown panel */}
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 20,
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  width: 220, overflow: "hidden",
                }}>
                  {/* Search bar inside dropdown */}
                  <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ position: "relative" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }}>
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                      <input
                        ref={filterSearchRef}
                        type="text"
                        placeholder="Buscar negocio..."
                        value={filterSearch}
                        onChange={e => setFilterSearch(e.target.value)}
                        style={{
                          width: "100%", padding: "6px 8px 6px 28px", fontSize: 12,
                          border: "1px solid var(--border)", borderRadius: 6,
                          background: "var(--bg, var(--surface))", color: "var(--text)",
                          outline: "none", boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>

                  {/* Options list */}
                  <div style={{ maxHeight: 200, overflowY: "auto", padding: "4px 0" }}>
                    {dropdownOptions.length > 0 ? dropdownOptions.map(item => (
                      <button
                        key={item.id === "all" ? "all" : `biz-${item.id}`}
                        type="button"
                        onClick={() => { setBusinessFilter(item.id); setFilterOpen(false); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          width: "100%", padding: "9px 14px", fontSize: 13,
                          background: "none", border: "none", cursor: "pointer", textAlign: "left",
                          color: businessFilter === item.id ? "var(--primary)" : "var(--text)",
                          fontWeight: businessFilter === item.id ? 600 : 400,
                          borderLeft: businessFilter === item.id ? "3px solid var(--primary)" : "3px solid transparent",
                          // Truncate long names inside the list too
                          overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                        }}
                        title={item.label}
                      >
                        {item.label}
                      </button>
                    )) : (
                      <p style={{ padding: "10px 14px", fontSize: 12, color: "var(--muted)", margin: 0 }}>
                        Sin resultados
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Clear filters */}
          {(search || businessFilter !== "all") && (
            <button type="button" className="secondary-btn"
              style={{ padding: "6px 12px", fontSize: 12 }}
              onClick={() => { setSearch(""); setBusinessFilter("all"); }}>
              Limpiar filtros
            </button>
          )}
        </div>

        {successMessage && <div className="message-success" style={{ marginBottom: 12 }}>{successMessage}</div>}
        {errorMessage   && <div className="message-error"   style={{ marginBottom: 12 }}>{errorMessage}</div>}

        <table className="data-table" style={{ tableLayout: "fixed", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ width: 48 }}>ID</th>
              <th style={{ width: 90 }}>Código</th>
              <th style={{ width: "18%" }}>Nombre</th>
              <th style={{ width: 120 }}>Teléfono</th>
              <th style={{ width: "22%" }}>Email</th>
              <th style={{ width: "18%" }}>Negocio</th>
              <th style={{ width: 140 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length > 0 ? filteredCustomers.map(customer => (
              <tr key={customer.id}>
                <td style={{ fontWeight: 600 }}>{customer.id}</td>
                {/* All text cells truncate with ellipsis instead of pushing columns */}
                <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 0 }}
                    title={customer.code ?? ""}>{customer.code}</td>
                <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 0 }}
                    title={customer.name ?? ""}>{customer.name}</td>
                <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 0 }}
                    title={customer.phone ?? ""}>{customer.phone}</td>
                <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 0 }}
                    title={customer.email ?? ""}>{customer.email}</td>
                <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 0 }}
                    title={businessName(customer.businessId, customer.businessName)}>
                  {businessName(customer.businessId, customer.businessName)}
                </td>
                <td>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="secondary-btn" onClick={() => openEditForm(customer)}>Editar</button>
                    <button className="secondary-btn"
                      onClick={() => { setDeleteTargetId(customer.id); setErrorMessage(""); setSuccessMessage(""); }}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "var(--muted)", fontSize: "0.88rem" }}>
                  📭 No hay clientes que coincidan con los filtros
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}