"use client";

import { useState, useEffect } from "react";
import type { Service, CreateServiceDto, UpdateServiceDto, Business } from "@/lib/api";
import { createService, updateService, deleteService, getBusinesses } from "@/lib/api";
import Pagination from "@/components/Pagination";

const NAME_MIN = 2;
const NAME_MAX = 100;

function validateServiceForm(name: string, price: string): { name?: string; price?: string } {
  const errors: { name?: string; price?: string } = {};
  if (name.trim().length < NAME_MIN) {
    errors.name = `El nombre debe tener al menos ${NAME_MIN} caracteres.`;
  }
  if (name.length > NAME_MAX) {
    errors.name = `El nombre no puede exceder los ${NAME_MAX} caracteres.`;
  }
  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice < 0) {
    errors.price = "El precio debe ser un número positivo.";
  }
  return errors;
}

export default function ServicesClient({ initialServices }: { initialServices: Service[] }) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [search, setSearch] = useState("");
  const [businessFilter, setBusinessFilter] = useState<number | "all">("all");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const emptyForm = {
    name: "",
    price: "",
    isActive: true,
    businessId: "",
  };

  const [createForm, setCreateForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);

  const [createErrors, setCreateErrors] = useState<{ name?: string; price?: string }>({});
  const [editErrors, setEditErrors] = useState<{ name?: string; price?: string }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  useEffect(() => {
    getBusinesses().then(setBusinesses).catch(() => {});
  }, []);

  useEffect(() => {
    if (businesses.length > 0) {
      setCreateForm(prev => ({
        ...prev,
        businessId: prev.businessId || String(businesses[0].id)
      }));
    }
  }, [businesses]);

  const filtered = services.filter(s => {
    const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    const matchesBusiness = businessFilter === "all" || s.businessId === businessFilter;
    return matchesSearch && matchesBusiness;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, businessFilter]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filtered.slice(startIndex, endIndex);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const errors = validateServiceForm(createForm.name, createForm.price);
    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    setLoadingCreate(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const created = await createService({
        name: createForm.name.trim(),
        price: parseFloat(createForm.price),
        isActive: createForm.isActive,
        businessId: Number(createForm.businessId) || businesses[0]?.id || 1,
      });
      setServices(prev => [...prev, created].sort((a, b) => a.id - b.id));
      setCreateForm(prev => ({
        ...emptyForm,
        businessId: String(businesses[0]?.id || "")
      }));
      setCreateErrors({});
      setIsCreateOpen(false);
      setSuccessMessage("Servicio creado correctamente.");
    } catch (err: any) {
      setErrorMessage(err.message || "No se pudo crear el servicio.");
    } finally {
      setLoadingCreate(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    const errors = validateServiceForm(editForm.name, editForm.price);
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setLoadingEdit(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const updated = await updateService(editingId, {
        name: editForm.name.trim(),
        price: parseFloat(editForm.price),
        isActive: editForm.isActive,
        businessId: Number(editForm.businessId),
      });
      setServices(prev => prev.map(s => s.id === editingId ? updated : s));
      setEditingId(null);
      setEditForm(emptyForm);
      setEditErrors({});
      setSuccessMessage("Servicio actualizado correctamente.");
    } catch (err: any) {
      setErrorMessage(err.message || "No se pudo actualizar el servicio.");
    } finally {
      setLoadingEdit(false);
    }
  }

  async function confirmDelete() {
    if (deleteTargetId === null) return;
    setDeletingId(deleteTargetId);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await deleteService(deleteTargetId);
      setServices(prev => prev.filter(s => s.id !== deleteTargetId));
      setSuccessMessage("Servicio eliminado correctamente.");
      setDeleteTargetId(null);
    } catch (err: any) {
      setErrorMessage(err.message || "No se pudo eliminar el servicio.");
    } finally {
      setDeletingId(null);
    }
  }

  function openEdit(service: Service) {
    setErrorMessage("");
    setSuccessMessage("");
    setIsCreateOpen(false);
    setDeleteTargetId(null);
    setEditingId(service.id);
    setEditForm({
      name: service.name,
      price: String(service.price),
      isActive: service.isActive,
      businessId: String(service.businessId || (businesses[0]?.id ? String(businesses[0].id) : "1")),
    });
    setEditErrors({});
  }

  const updateCreateField = (key: keyof typeof emptyForm, val: any) => {
    setCreateForm(prev => ({ ...prev, [key]: val }));
  };

  const updateEditField = (key: keyof typeof emptyForm, val: any) => {
    setEditForm(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="page-stack">
      {/* ── Hero ── */}
      <section className="page-hero">
        <div>
          <h2>Servicios</h2>
          <p>Gestiona los servicios ofrecidos por cada negocio.</p>
        </div>
        <button
          className="primary-btn"
          type="button"
          onClick={() => {
            setIsCreateOpen(true);
            setEditingId(null);
            setErrorMessage("");
            setSuccessMessage("");
            setCreateForm(prev => ({
              ...prev,
              businessId: prev.businessId || String(businesses[0]?.id || "")
            }));
            setCreateErrors({});
          }}
        >
          Nuevo servicio
        </button>
      </section>

      {/* ── Create Form ── */}
      {isCreateOpen && (
        <section className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Nuevo servicio</h3>
            <button className="secondary-btn" onClick={() => { setIsCreateOpen(false); setCreateErrors({}); }}>
              Cancelar
            </button>
          </div>
          <form onSubmit={handleCreate} className="page-stack" style={{ gap: 16 }}>
            <div className="form-grid">
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>Nombre del Servicio</label>
                <input
                  className="input"
                  placeholder="Ej: Corte de pelo caballero"
                  value={createForm.name}
                  onChange={e => {
                    updateCreateField("name", e.target.value);
                    if (createErrors.name) setCreateErrors(prev => ({ ...prev, name: undefined }));
                  }}
                  required
                  style={{ borderColor: createErrors.name ? "var(--danger, #ef4444)" : undefined }}
                />
                {createErrors.name && <span style={{ fontSize: 12, color: "var(--danger, #ef4444)" }}>{createErrors.name}</span>}
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>Precio (€)</label>
                <input
                  className="input"
                  placeholder="Ej: 15.00"
                  value={createForm.price}
                  onChange={e => {
                    updateCreateField("price", e.target.value.replace(/[^0-9.,]/g, "").replace(",", "."));
                    if (createErrors.price) setCreateErrors(prev => ({ ...prev, price: undefined }));
                  }}
                  required
                  style={{ borderColor: createErrors.price ? "var(--danger, #ef4444)" : undefined }}
                />
                {createErrors.price && <span style={{ fontSize: 12, color: "var(--danger, #ef4444)" }}>{createErrors.price}</span>}
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>Negocio</label>
                <select className="select" value={createForm.businessId} onChange={e => updateCreateField("businessId", e.target.value)} required>
                  <option value="">Selecciona un negocio</option>
                  {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, height: "100%", paddingTop: 20 }}>
                <input
                  type="checkbox"
                  id="create-isActive"
                  checked={createForm.isActive}
                  onChange={e => updateCreateField("isActive", e.target.checked)}
                />
                <label htmlFor="create-isActive" style={{ fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Activo</label>
              </div>
            </div>
            {errorMessage && <p className="message-error">{errorMessage}</p>}
            <div>
              <button className="primary-btn" type="submit" disabled={loadingCreate}>
                {loadingCreate ? "Creando..." : "Crear servicio"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ── Edit Form ── */}
      {editingId !== null && (
        <section className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Editar servicio #{editingId}</h3>
            <button className="secondary-btn" onClick={() => { setEditingId(null); setEditErrors({}); }}>
              Cancelar
            </button>
          </div>
          <form onSubmit={handleEdit} className="page-stack" style={{ gap: 16 }}>
            <div className="form-grid">
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>Nombre del Servicio</label>
                <input
                  className="input"
                  placeholder="Nombre del servicio"
                  value={editForm.name}
                  onChange={e => {
                    updateEditField("name", e.target.value);
                    if (editErrors.name) setEditErrors(prev => ({ ...prev, name: undefined }));
                  }}
                  required
                  style={{ borderColor: editErrors.name ? "var(--danger, #ef4444)" : undefined }}
                />
                {editErrors.name && <span style={{ fontSize: 12, color: "var(--danger, #ef4444)" }}>{editErrors.name}</span>}
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>Precio (€)</label>
                <input
                  className="input"
                  placeholder="Precio"
                  value={editForm.price}
                  onChange={e => {
                    updateEditField("price", e.target.value.replace(/[^0-9.,]/g, "").replace(",", "."));
                    if (editErrors.price) setEditErrors(prev => ({ ...prev, price: undefined }));
                  }}
                  required
                  style={{ borderColor: editErrors.price ? "var(--danger, #ef4444)" : undefined }}
                />
                {editErrors.price && <span style={{ fontSize: 12, color: "var(--danger, #ef4444)" }}>{editErrors.price}</span>}
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>Negocio</label>
                <select className="select" value={editForm.businessId} onChange={e => updateEditField("businessId", e.target.value)} required>
                  <option value="">Selecciona un negocio</option>
                  {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, height: "100%", paddingTop: 20 }}>
                <input
                  type="checkbox"
                  id="edit-isActive"
                  checked={editForm.isActive}
                  onChange={e => updateEditField("isActive", e.target.checked)}
                />
                <label htmlFor="edit-isActive" style={{ fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Activo</label>
              </div>
            </div>
            {errorMessage && <p className="message-error">{errorMessage}</p>}
            <div>
              <button className="primary-btn" type="submit" disabled={loadingEdit}>
                {loadingEdit ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ── Delete Modal ── */}
      {deleteTargetId !== null && (
        <div className="modal-backdrop" role="dialog" onClick={e => { if (e.target === e.currentTarget) setDeleteTargetId(null); }}>
          <div className="modal-card">
            <div className="modal-icon">!</div>
            <h3 className="modal-title">Eliminar servicio</h3>
            <p className="modal-text">¿Seguro que quieres eliminar el servicio #{deleteTargetId}? Esta acción no se puede deshacer.</p>
            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => setDeleteTargetId(null)}>Cancelar</button>
              <button className="danger-btn" onClick={confirmDelete} disabled={deletingId === deleteTargetId}>
                {deletingId === deleteTargetId ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Table & Filters ── */}
      <section className="section-card">
        <div className="panel-title-row">
          <h3 className="panel-title">Catálogo de servicios</h3>
          <span style={{ color: "var(--muted)", fontSize: 13 }}>
            {filtered.length} de {services.length} registros
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <input
            className="input"
            style={{ maxWidth: 280, padding: "8px 14px", fontSize: 13 }}
            placeholder="Buscar por nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="select"
            style={{ maxWidth: 220, padding: "6px 12px", fontSize: 13 }}
            value={String(businessFilter)}
            onChange={e => setBusinessFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
          >
            <option value="all">Todos los negocios</option>
            {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        {successMessage && <p className="message-success" style={{ marginBottom: 12 }}>{successMessage}</p>}
        {errorMessage && <p className="message-error" style={{ marginBottom: 12 }}>{errorMessage}</p>}

        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>ID</th>
              <th>Nombre</th>
              <th style={{ width: 100 }}>Precio</th>
              <th style={{ width: 200 }}>Negocio</th>
              <th style={{ width: 100 }}>Estado</th>
              <th style={{ width: 160 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length > 0 ? paginatedItems.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 600 }}>{s.id}</td>
                <td style={{ fontWeight: 500 }}>{s.name}</td>
                <td>{Number(s.price).toFixed(2)} €</td>
                <td>{businesses.find(b => b.id === s.businessId)?.name || s.businessName || `Negocio ID: ${s.businessId}`}</td>
                <td>
                  <span className={`badge badge--${s.isActive ? "confirmed" : "pending"}`}>
                    {s.isActive ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="secondary-btn" onClick={() => openEdit(s)}>Editar</button>
                    <button className="secondary-btn" onClick={() => setDeleteTargetId(s.id)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "var(--muted)", fontSize: "0.88rem" }}>
                  📭 No hay servicios registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </section>
    </div>
  );
}
