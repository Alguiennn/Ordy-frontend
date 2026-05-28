"use client";

import { useState } from "react";
import type { Business, CreateBusinessDto, UpdateBusinessDto } from "@/lib/api";
import { createBusiness, updateBusiness, deleteBusiness } from "@/lib/api";

export default function BusinessClient({ initialBusinesses }: { initialBusinesses: Business[] }) {
  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses);
  const [createName, setCreateName] = useState("");
  const [editName, setEditName]     = useState("");
  const [isCreateOpen, setIsCreateOpen]     = useState(false);
  const [editingId, setEditingId]           = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deletingId, setDeletingId]         = useState<number | null>(null);
  const [loadingCreate, setLoadingCreate]   = useState(false);
  const [loadingEdit, setLoadingEdit]       = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage]     = useState("");
  const [search, setSearch]                 = useState("");

  const filtered = businesses.filter(b =>
    !search || b.name.toLowerCase().includes(search.toLowerCase())
  );

  function openEdit(b: Business) {
    setErrorMessage(""); setSuccessMessage("");
    setIsCreateOpen(false); setDeleteTargetId(null);
    setEditingId(b.id);
    setEditName(b.name);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoadingCreate(true); setErrorMessage(""); setSuccessMessage("");
    try {
      const created = await createBusiness({ name: createName });
      setBusinesses(prev => [...prev, created].sort((a, b) => a.id - b.id));
      setCreateName(""); setIsCreateOpen(false);
      setSuccessMessage("Negocio creado correctamente.");
    } catch { setErrorMessage("No se pudo crear el negocio."); }
    finally { setLoadingCreate(false); }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setLoadingEdit(true); setErrorMessage(""); setSuccessMessage("");
    try {
      const updated = await updateBusiness(editingId, { name: editName });
      setBusinesses(prev => prev.map(b => b.id === editingId ? updated : b));
      setEditingId(null); setEditName("");
      setSuccessMessage("Negocio actualizado correctamente.");
    } catch { setErrorMessage("No se pudo actualizar el negocio."); }
    finally { setLoadingEdit(false); }
  }

  async function confirmDelete() {
    if (deleteTargetId === null) return;
    setDeletingId(deleteTargetId); setErrorMessage(""); setSuccessMessage("");
    try {
      await deleteBusiness(deleteTargetId);
      setBusinesses(prev => prev.filter(b => b.id !== deleteTargetId));
      setSuccessMessage("Negocio eliminado correctamente.");
      setDeleteTargetId(null);
    } catch { setErrorMessage("No se pudo eliminar el negocio."); }
    finally { setDeletingId(null); }
  }

  return (
    <div className="page-stack">

      {/* ── Hero ── */}
      <section className="page-hero">
        <div>
          <h2>Negocios</h2>
          <p>Gestiona los negocios registrados en la plataforma.</p>
        </div>
        <button
          className="primary-btn"
          type="button"
          onClick={() => { setIsCreateOpen(true); setEditingId(null); setErrorMessage(""); setSuccessMessage(""); }}
        >
          Nuevo negocio
        </button>
      </section>

      {/* ── Create form ── */}
      {isCreateOpen && (
        <section className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Nuevo negocio</h3>
            <button className="secondary-btn" onClick={() => { setIsCreateOpen(false); setCreateName(""); }}>
              Cancelar
            </button>
          </div>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <input
              className="input"
              placeholder="Nombre del negocio"
              value={createName}
              onChange={e => setCreateName(e.target.value)}
              required
              style={{ maxWidth: 360 }}
            />
            {errorMessage && <p className="message-error">{errorMessage}</p>}
            <div>
              <button className="primary-btn" type="submit" disabled={loadingCreate}>
                {loadingCreate ? "Guardando..." : "Crear negocio"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ── Edit form ── */}
      {editingId !== null && (
        <section className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Editar negocio #{editingId}</h3>
            <button className="secondary-btn" onClick={() => { setEditingId(null); setEditName(""); }}>
              Cancelar
            </button>
          </div>
          <form onSubmit={handleEdit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <input
              className="input"
              placeholder="Nombre del negocio"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              required
              style={{ maxWidth: 360 }}
            />
            {errorMessage && <p className="message-error">{errorMessage}</p>}
            <div>
              <button className="primary-btn" type="submit" disabled={loadingEdit}>
                {loadingEdit ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ── Delete modal ── */}
      {deleteTargetId !== null && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={e => { if (e.target === e.currentTarget) setDeleteTargetId(null); }}
        >
          <div className="modal-card">
            <div className="modal-icon">!</div>
            <h3 className="modal-title">Eliminar negocio</h3>
            <p className="modal-text">
              ¿Seguro que quieres eliminar el negocio #{deleteTargetId}?
              Esto puede afectar a clientes y reservas vinculados.
            </p>
            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => setDeleteTargetId(null)}>Cancelar</button>
              <button
                className="danger-btn"
                onClick={confirmDelete}
                disabled={deletingId === deleteTargetId}
              >
                {deletingId === deleteTargetId ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <section className="section-card">
        <div className="panel-title-row">
          <h3 className="panel-title">Negocios registrados</h3>
          <span style={{ color: "var(--muted)", fontSize: 13 }}>
            {filtered.length} de {businesses.length} registros
          </span>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <input
            className="input"
            style={{ maxWidth: 280, padding: "8px 14px", fontSize: 13 }}
            placeholder="Buscar negocio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {successMessage && <p className="message-success" style={{ marginBottom: 12 }}>{successMessage}</p>}
        {errorMessage   && <p className="message-error"   style={{ marginBottom: 12 }}>{errorMessage}</p>}

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map(b => (
              <tr key={b.id}>
                <td style={{ fontWeight: 600, width: 60 }}>{b.id}</td>
                <td style={{ fontWeight: 500 }}>{b.name}</td>
                <td>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="secondary-btn" onClick={() => openEdit(b)}>Editar</button>
                    <button
                      className="secondary-btn"
                      onClick={() => { setDeleteTargetId(b.id); setErrorMessage(""); setSuccessMessage(""); }}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: "24px", color: "var(--muted)", fontSize: "0.88rem" }}>
                  📭 No hay negocios que coincidan con la búsqueda
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}