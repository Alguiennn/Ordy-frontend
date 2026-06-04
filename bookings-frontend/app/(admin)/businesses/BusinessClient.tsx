"use client";

import { useState, useEffect } from "react";
import type { Business } from "@/lib/api";
import { createBusiness, deleteBusiness, updateBusiness, getDecodedToken, type DecodedToken } from "@/lib/api";

// ── Name validation rules ──────────────────────────────────────────
const NAME_MIN = 2;
const NAME_MAX = 50;
const NAME_PATTERN = /^[a-zA-ZÀ-ÿ0-9\s\-']+$/;

function validateName(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0)      return "El nombre no puede estar vacío.";
  if (trimmed.length < NAME_MIN) return `Mínimo ${NAME_MIN} caracteres.`;
  if (value.length > NAME_MAX)   return `Máximo ${NAME_MAX} caracteres.`;
  if (!NAME_PATTERN.test(trimmed))
    return "Solo se permiten letras, números, espacios, guiones y apóstrofes.";
  return "";
}

// ── NameInput defined OUTSIDE the parent so React never remounts it ─
function NameInput({
  value,
  onChange,
  error,
  placeholder = "Nombre del negocio",
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  error: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const remaining = NAME_MAX - value.length;
  const isOver    = value.length > NAME_MAX;
  const isWarning = remaining <= 10 && !isOver;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: 360 }}>
      <input
        className="input"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={!disabled}
        disabled={disabled}
        style={{
          borderColor: error
            ? "var(--danger, #ef4444)"
            : isWarning
            ? "var(--warning, #f59e0b)"
            : undefined,
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? "not-allowed" : undefined,
        }}
      />
      {!disabled && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {error ? (
            <span style={{ fontSize: 12, color: "var(--danger, #ef4444)" }}>
              ⚠ {error}
            </span>
          ) : (
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              {NAME_MIN}–{NAME_MAX} caracteres · letras, números, espacios, guiones
            </span>
          )}
          <span
            style={{
              fontSize: 12,
              fontVariantNumeric: "tabular-nums",
              color: isOver
                ? "var(--danger, #ef4444)"
                : isWarning
                ? "var(--warning, #f59e0b)"
                : "var(--muted)",
              marginLeft: 8,
              flexShrink: 0,
            }}
          >
            {value.length}/{NAME_MAX}
          </span>
        </div>
      )}
    </div>
  );
}
// ──────────────────────────────────────────────────────────────────

export default function BusinessClient({ initialBusinesses }: { initialBusinesses: Business[] }) {
  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses);
  const [createName, setCreateName] = useState("");
  const [createNameError, setCreateNameError] = useState("");
  const [createAddress, setCreateAddress]   = useState("");
  const [createPhone, setCreatePhone]       = useState("");
  const [isCreateOpen, setIsCreateOpen]     = useState(false);
  const [loadingCreate, setLoadingCreate]   = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage]     = useState("");
  const [search, setSearch]                 = useState("");

  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deletingId, setDeletingId]         = useState<number | null>(null);

  const [editingId, setEditingId]           = useState<number | null>(null);
  const [editName, setEditName]             = useState("");
  const [editNameError, setEditNameError]   = useState("");
  const [editAddress, setEditAddress]       = useState("");
  const [editPhone, setEditPhone]           = useState("");
  const [loadingEdit, setLoadingEdit]       = useState(false);

  const [currentUser, setCurrentUser]       = useState<DecodedToken | null>(null);

  useEffect(() => {
    setCurrentUser(getDecodedToken());
  }, []);

  const filtered = businesses.filter(b =>
    !search || b.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleCreateNameChange(value: string) {
    if (value.length <= NAME_MAX + 1) setCreateName(value);
    setCreateNameError(validateName(value));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const err = validateName(createName);
    if (err) { setCreateNameError(err); return; }
    setLoadingCreate(true); setErrorMessage(""); setSuccessMessage("");
    try {
      const created = await createBusiness({
        name: createName.trim(),
        address: createAddress.trim() || undefined,
        phone: createPhone.trim() || undefined,
      });
      setBusinesses(prev => [...prev, created].sort((a, b) => a.id - b.id));
      setCreateName(""); setCreateNameError(""); setCreateAddress(""); setCreatePhone(""); setIsCreateOpen(false);
      setSuccessMessage("Negocio creado correctamente.");
    } catch (err: any) { 
      setErrorMessage(err.message || "No se pudo crear el negocio."); 
    } finally { 
      setLoadingCreate(false); 
    }
  }

  async function confirmDelete() {
    if (deleteTargetId === null) return;
    setDeletingId(deleteTargetId); setErrorMessage(""); setSuccessMessage("");
    try {
      await deleteBusiness(deleteTargetId);
      setBusinesses(prev => prev.filter(b => b.id !== deleteTargetId));
      setSuccessMessage("Negocio eliminado correctamente.");
      setDeleteTargetId(null);
    } catch (err: any) {
      setErrorMessage(err.message || "No se pudo eliminar el negocio.");
    } finally {
      setDeletingId(null);
    }
  }

  function openEdit(business: Business) {
    setErrorMessage(""); setSuccessMessage(""); setEditNameError("");
    setIsCreateOpen(false); setDeleteTargetId(null);
    setEditingId(business.id);
    setEditName(business.name);
    setEditAddress(business.address || "");
    setEditPhone(business.phone || "");
  }

  function handleEditNameChange(value: string) {
    if (value.length <= NAME_MAX + 1) setEditName(value);
    setEditNameError(validateName(value));
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;

    const isManager = currentUser?.role === "manager";
    let payload: any;
    if (isManager) {
      payload = {
        address: editAddress.trim() || undefined,
        phone: editPhone.trim() || undefined,
      };
    } else {
      const err = validateName(editName);
      if (err) { setEditNameError(err); return; }
      payload = {
        name: editName.trim(),
        address: editAddress.trim() || undefined,
        phone: editPhone.trim() || undefined,
      };
    }

    setLoadingEdit(true); setErrorMessage(""); setSuccessMessage("");
    try {
      const updated = await updateBusiness(editingId, payload);
      setBusinesses(prev => prev.map(b => b.id === editingId ? updated : b));
      setEditingId(null); setEditName(""); setEditNameError(""); setEditAddress(""); setEditPhone("");
      setSuccessMessage("Negocio actualizado correctamente.");
    } catch (err: any) {
      setErrorMessage(err.message || "No se pudo actualizar el negocio.");
    } finally {
      setLoadingEdit(false);
    }
  }

  return (
    <div className="page-stack">

      {/* ── Hero ── */}
      <section className="page-hero">
        <div>
          <h2>Negocios</h2>
          <p>Gestiona los negocios registrados en la plataforma.</p>
        </div>
        {currentUser?.role === "admin" && (
          <button
            className="primary-btn"
            type="button"
            onClick={() => {
              setIsCreateOpen(true);
              setErrorMessage(""); setSuccessMessage(""); setCreateNameError("");
            }}
          >
            Nuevo negocio
          </button>
        )}
      </section>

      {/* ── Create form ── */}
      {isCreateOpen && (
        <section className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Nuevo negocio</h3>
            <button className="secondary-btn" onClick={() => { setIsCreateOpen(false); setCreateName(""); setCreateNameError(""); setCreateAddress(""); setCreatePhone(""); }}>
              Cancelar
            </button>
          </div>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <NameInput value={createName} onChange={handleCreateNameChange} error={createNameError} />
            
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 200px" }}>
                <label style={{ fontSize: 12, color: "var(--muted)" }}>Dirección (Opcional)</label>
                <input
                  className="input"
                  placeholder="Dirección del negocio"
                  value={createAddress}
                  onChange={e => setCreateAddress(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 200px" }}>
                <label style={{ fontSize: 12, color: "var(--muted)" }}>Teléfono (Opcional)</label>
                <input
                  className="input"
                  placeholder="Teléfono del negocio"
                  value={createPhone}
                  onChange={e => setCreatePhone(e.target.value)}
                />
              </div>
            </div>

            {errorMessage && <p className="message-error">{errorMessage}</p>}
            <div>
              <button
                className="primary-btn"
                type="submit"
                disabled={loadingCreate || !!createNameError || createName.trim().length < NAME_MIN}
              >
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
            <button className="secondary-btn" onClick={() => { setEditingId(null); setEditName(""); setEditNameError(""); setEditAddress(""); setEditPhone(""); }}>
              Cancelar
            </button>
          </div>
          <form onSubmit={handleEdit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <NameInput
              value={editName}
              onChange={handleEditNameChange}
              error={editNameError}
              disabled={currentUser?.role === "manager"}
            />
            
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 200px" }}>
                <label style={{ fontSize: 12, color: "var(--muted)" }}>Dirección (Opcional)</label>
                <input
                  className="input"
                  placeholder="Dirección del negocio"
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 200px" }}>
                <label style={{ fontSize: 12, color: "var(--muted)" }}>Teléfono (Opcional)</label>
                <input
                  className="input"
                  placeholder="Teléfono del negocio"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                />
              </div>
            </div>

            {errorMessage && <p className="message-error">{errorMessage}</p>}
            <div>
              <button
                className="primary-btn"
                type="submit"
                disabled={loadingEdit || (currentUser?.role !== "manager" && (!!editNameError || editName.trim().length < NAME_MIN))}
              >
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
            <h3 className="modal-title">Eliminar negocio</h3>
            <p className="modal-text">¿Seguro que quieres eliminar el negocio #{deleteTargetId}? Esta acción no se puede deshacer y puede afectar a los clientes y citas asociadas.</p>
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
          <h3 className="panel-title">Negocios registrados</h3>
          <span style={{ color: "var(--muted)", fontSize: 13 }}>
            {filtered.length} de {businesses.length} registros
          </span>
        </div>

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

        <table className="data-table" style={{ tableLayout: "fixed", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ width: 60 }}>ID</th>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              <th style={{ width: 140 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map(b => (
              <tr key={b.id}>
                <td style={{ fontWeight: 600 }}>{b.id}</td>
                <td style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={b.name}>{b.name}</td>
                <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={b.address ?? ""}>{b.address || "—"}</td>
                <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={b.phone ?? ""}>{b.phone || "—"}</td>
                <td>
                  <div style={{ display: "flex", gap: 8 }}>
                    {((currentUser?.role === "admin") || 
                      (currentUser?.role === "manager" && currentUser.businessId === b.id)) && (
                      <button className="secondary-btn" onClick={() => openEdit(b)}>
                        Editar
                      </button>
                    )}
                    {currentUser?.role === "admin" && (
                      <button className="secondary-btn" onClick={() => { setDeleteTargetId(b.id); setErrorMessage(""); setSuccessMessage(""); }}>
                        Eliminar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "var(--muted)", fontSize: "0.88rem" }}>
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