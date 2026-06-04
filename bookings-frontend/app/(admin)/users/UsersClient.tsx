"use client";

import { useState, useEffect } from "react";
import type { User, CreateUserDto, UpdateUserDto, UserRole, Business } from "@/lib/api";
import { createUser, updateUser, deleteUser, getBusinesses } from "@/lib/api";
import Pagination from "@/components/Pagination";

const ROLES: UserRole[] = ["admin", "manager", "standard"];

function validateUserForm(form: any, isEdit = false): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.firstName.trim()) errors.firstName = "El nombre es obligatorio.";
  if (!form.lastName.trim()) errors.lastName = "El apellido es obligatorio.";
  if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
    errors.email = "Introduce un email válido.";
  }
  if (!isEdit && (!form.password || form.password.length < 6)) {
    errors.password = "La contraseña debe tener al menos 6 caracteres.";
  }
  return errors;
}

export default function UsersClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const emptyForm = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "standard" as UserRole,
    businessId: "",
  };

  const [createForm, setCreateForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);

  const [createErrors, setCreateErrors] = useState<Record<string, string | undefined>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    getBusinesses().then(setBusinesses).catch(() => {});
  }, []);

  const filtered = users.filter(u => {
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    const matchesSearch = !search || 
      fullName.includes(search.toLowerCase()) || 
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filtered.slice(startIndex, endIndex);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const errors = validateUserForm(createForm, false);
    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    setLoadingCreate(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const dto: CreateUserDto = {
        firstName: createForm.firstName.trim(),
        lastName: createForm.lastName.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
      };
      if (createForm.businessId) {
        dto.businessId = Number(createForm.businessId);
      }
      const created = await createUser(dto);
      setUsers(prev => [...prev, created].sort((a, b) => a.id - b.id));
      setCreateForm(emptyForm);
      setCreateErrors({});
      setIsCreateOpen(false);
      setSuccessMessage("Usuario creado correctamente.");
    } catch (err: any) {
      setErrorMessage(err.message || "No se pudo crear el usuario.");
    } finally {
      setLoadingCreate(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    const errors = validateUserForm(editForm, true);
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setLoadingEdit(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const dto: UpdateUserDto = {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim(),
        role: editForm.role,
      };
      if (editForm.businessId) {
        dto.businessId = Number(editForm.businessId);
      }
      if (editForm.password) {
        dto.password = editForm.password;
      }
      const updated = await updateUser(editingId, dto);
      setUsers(prev => prev.map(u => u.id === editingId ? updated : u));
      setEditingId(null);
      setEditForm(emptyForm);
      setEditErrors({});
      setSuccessMessage("Usuario actualizado correctamente.");
    } catch (err: any) {
      setErrorMessage(err.message || "No se pudo actualizar el usuario.");
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
      await deleteUser(deleteTargetId);
      setUsers(prev => prev.filter(u => u.id !== deleteTargetId));
      setSuccessMessage("Usuario eliminado correctamente.");
      setDeleteTargetId(null);
    } catch (err: any) {
      setErrorMessage(err.message || "No se pudo eliminar el usuario.");
    } finally {
      setDeletingId(null);
    }
  }

  function openEdit(user: User) {
    setErrorMessage("");
    setSuccessMessage("");
    setIsCreateOpen(false);
    setDeleteTargetId(null);
    setEditingId(user.id);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: "",
      role: user.role,
      businessId: user.businessId ? String(user.businessId) : "",
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
          <h2>Usuarios</h2>
          <p>Gestiona los usuarios de la plataforma y sus respectivos roles de acceso.</p>
        </div>
        <button
          className="primary-btn"
          type="button"
          onClick={() => {
            setIsCreateOpen(true);
            setEditingId(null);
            setErrorMessage("");
            setSuccessMessage("");
            setCreateForm(emptyForm);
            setCreateErrors({});
          }}
        >
          Nuevo usuario
        </button>
      </section>

      {/* ── Create Form ── */}
      {isCreateOpen && (
        <section className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Nuevo usuario</h3>
            <button className="secondary-btn" onClick={() => { setIsCreateOpen(false); setCreateErrors({}); }}>
              Cancelar
            </button>
          </div>
          <form onSubmit={handleCreate} className="page-stack" style={{ gap: 16 }}>
            <div className="form-grid">
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>Nombre</label>
                <input
                  className="input"
                  placeholder="Nombre"
                  value={createForm.firstName}
                  onChange={e => {
                    updateCreateField("firstName", e.target.value);
                    if (createErrors.firstName) setCreateErrors(prev => ({ ...prev, firstName: undefined }));
                  }}
                  required
                />
                {createErrors.firstName && <span style={{ fontSize: 12, color: "var(--danger)" }}>{createErrors.firstName}</span>}
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>Apellido</label>
                <input
                  className="input"
                  placeholder="Apellido"
                  value={createForm.lastName}
                  onChange={e => {
                    updateCreateField("lastName", e.target.value);
                    if (createErrors.lastName) setCreateErrors(prev => ({ ...prev, lastName: undefined }));
                  }}
                  required
                />
                {createErrors.lastName && <span style={{ fontSize: 12, color: "var(--danger)" }}>{createErrors.lastName}</span>}
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>Email</label>
                <input
                  className="input"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={createForm.email}
                  onChange={e => {
                    updateCreateField("email", e.target.value);
                    if (createErrors.email) setCreateErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  required
                />
                {createErrors.email && <span style={{ fontSize: 12, color: "var(--danger)" }}>{createErrors.email}</span>}
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>Contraseña</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={createForm.password}
                  onChange={e => {
                    updateCreateField("password", e.target.value);
                    if (createErrors.password) setCreateErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  required
                />
                {createErrors.password && <span style={{ fontSize: 12, color: "var(--danger)" }}>{createErrors.password}</span>}
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>Rol</label>
                <select className="select" value={createForm.role} onChange={e => updateCreateField("role", e.target.value as UserRole)} required>
                  {ROLES.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>Negocio Asociado (Opcional)</label>
                <select className="select" value={createForm.businessId} onChange={e => updateCreateField("businessId", e.target.value)}>
                  <option value="">Ninguno / Sin negocio</option>
                  {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            {errorMessage && <p className="message-error">{errorMessage}</p>}
            <div>
              <button className="primary-btn" type="submit" disabled={loadingCreate}>
                {loadingCreate ? "Creando..." : "Crear usuario"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ── Edit Form ── */}
      {editingId !== null && (
        <section className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Editar usuario #{editingId}</h3>
            <button className="secondary-btn" onClick={() => { setEditingId(null); setEditErrors({}); }}>
              Cancelar
            </button>
          </div>
          <form onSubmit={handleEdit} className="page-stack" style={{ gap: 16 }}>
            <div className="form-grid">
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>Nombre</label>
                <input
                  className="input"
                  placeholder="Nombre"
                  value={editForm.firstName}
                  onChange={e => {
                    updateEditField("firstName", e.target.value);
                    if (editErrors.firstName) setEditErrors(prev => ({ ...prev, firstName: undefined }));
                  }}
                  required
                />
                {editErrors.firstName && <span style={{ fontSize: 12, color: "var(--danger)" }}>{editErrors.firstName}</span>}
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>Apellido</label>
                <input
                  className="input"
                  placeholder="Apellido"
                  value={editForm.lastName}
                  onChange={e => {
                    updateEditField("lastName", e.target.value);
                    if (editErrors.lastName) setEditErrors(prev => ({ ...prev, lastName: undefined }));
                  }}
                  required
                />
                {editErrors.lastName && <span style={{ fontSize: 12, color: "var(--danger)" }}>{editErrors.lastName}</span>}
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>Email</label>
                <input
                  className="input"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={editForm.email}
                  onChange={e => {
                    updateEditField("email", e.target.value);
                    if (editErrors.email) setEditErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  required
                />
                {editErrors.email && <span style={{ fontSize: 12, color: "var(--danger)" }}>{editErrors.email}</span>}
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>Nueva Contraseña (Opcional)</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Dejar vacío para no cambiar"
                  value={editForm.password}
                  onChange={e => updateEditField("password", e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>Rol</label>
                <select className="select" value={editForm.role} onChange={e => updateEditField("role", e.target.value as UserRole)} required>
                  {ROLES.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>Negocio Asociado (Opcional)</label>
                <select className="select" value={editForm.businessId} onChange={e => updateEditField("businessId", e.target.value)}>
                  <option value="">Ninguno / Sin negocio</option>
                  {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
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
            <h3 className="modal-title">Eliminar usuario</h3>
            <p className="modal-text">¿Seguro que quieres eliminar el usuario #{deleteTargetId}? Esta acción no se puede deshacer.</p>
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
          <h3 className="panel-title">Usuarios registrados</h3>
          <span style={{ color: "var(--muted)", fontSize: 13 }}>
            {filtered.length} de {users.length} registros
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <input
            className="input"
            style={{ maxWidth: 280, padding: "8px 14px", fontSize: 13 }}
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="select"
            style={{ maxWidth: 220, padding: "6px 12px", fontSize: 13 }}
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as "all" | UserRole)}
          >
            <option value="all">Todos los roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
          </select>
        </div>

        {successMessage && <p className="message-success" style={{ marginBottom: 12 }}>{successMessage}</p>}
        {errorMessage && <p className="message-error" style={{ marginBottom: 12 }}>{errorMessage}</p>}

        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th style={{ width: 140 }}>Rol</th>
              <th>Negocio</th>
              <th style={{ width: 160 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length > 0 ? paginatedItems.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.id}</td>
                <td style={{ fontWeight: 500 }}>{u.firstName} {u.lastName}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge badge--${u.role === "admin" ? "confirmed" : u.role === "manager" ? "paid" : "pending"}`}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td>{u.businessName || "Ninguno"}</td>
                <td>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="secondary-btn" onClick={() => openEdit(u)}>Editar</button>
                    <button className="secondary-btn" onClick={() => setDeleteTargetId(u.id)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "var(--muted)", fontSize: "0.88rem" }}>
                  📭 No hay usuarios registrados
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
