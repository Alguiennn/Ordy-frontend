"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import TypewriterGreeting from "@/components/TypewriterGreeting";
import type {
  Booking,
  BookingStatus,
  CreateBookingDto,
  UpdateBookingDto,
  Customer,
  Business,
} from "@/lib/api.ts";
import {
  createAppointment,
  deleteAppointment,
  updateAppointment,
  getCustomers,
  getBusinesses,
} from "@/lib/api";
import { useApi, clearApiCache } from "@/lib/hooks";

type BookingWithRelations = Booking & {
  customer?: { id: number; name: string };
  business?: { id: number; name: string };
};

function StatusBadge({ status }: { status: BookingStatus }) {
  const label =
    status === "pending"
      ? "Pendiente"
      : status === "confirmed"
        ? "Confirmada"
        : "Pagada";

  return <span className={`badge badge--${status}`}>{label}</span>;
}

function formatDate(date: string) {
  try {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return date;
  }
}

export default function BookingsClient({
  initialBookings,
}: {
  initialBookings: BookingWithRelations[];
}) {
  const [bookings, setBookings] = useState<BookingWithRelations[]>(initialBookings);
  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>("all");
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [deletingBookingId, setDeletingBookingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  // Use improved API hooks with caching and retry logic
  const { data: customersData = [], loading: customersLoading, error: customersError, refetch: refetchCustomers } = 
    useApi<Customer[]>(() => getCustomers(), 'customers', { cacheTime: 10 * 60 * 1000 });
  
  const { data: businessesData = [], loading: businessesLoading, error: businessesError, refetch: refetchBusinesses } = 
    useApi<Business[]>(() => getBusinesses(), 'businesses', { cacheTime: 10 * 60 * 1000 });

  const customers = customersData || [];
  const businesses = businessesData || [];
  const loading = customersLoading || businessesLoading;
  const hasError = customersError || businessesError;
  const backendError = !!hasError;

  const defaultBookingForm: CreateBookingDto = {
    date: "",
    time: "",
    status: "pending",
    customerId: customers[0]?.id ?? 0,
    businessId: businesses[0]?.id ?? 0,
    serviceName: "",
  };

  const [createForm, setCreateForm] = useState<CreateBookingDto>(defaultBookingForm);
  const [editForm, setEditForm] = useState<CreateBookingDto>(defaultBookingForm);

  const modalBackdropStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1100,
    padding: 24,
  } as const;

  const modalCardStyle = {
    background: "#fff",
    borderRadius: 18,
    padding: 24,
    width: "min(760px, 100%)",
    maxHeight: "calc(100vh - 64px)",
    overflowY: "auto",
    boxShadow: "0 28px 68px rgba(15, 23, 42, 0.18)",
  } as const;

  // Update forms when data loads
  useEffect(() => {
    if (customers.length > 0 && businesses.length > 0) {
      setCreateForm((prev) => ({
        ...prev,
        customerId: prev.customerId || customers[0].id,
        businessId: prev.businessId || businesses[0].id,
      }));
      setEditForm((prev) => ({
        ...prev,
        customerId: prev.customerId || customers[0].id,
        businessId: prev.businessId || businesses[0].id,
      }));
    }
  }, [customers, businesses]);

  const filteredBookings = useMemo(() => {
    if (statusFilter === "all") return bookings;
    return bookings.filter((booking) => booking.status === statusFilter);
  }, [bookings, statusFilter]);

  const totalCount = bookings.length;
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const paidCount = bookings.filter((b) => b.status === "paid").length;

  function renderBookingRow(booking: BookingWithRelations) {
    const customerName =
      customers.find((c) => c.id === booking.customerId)?.name ||
      booking.customer?.name ||
      (booking.customerId !== undefined ? String(booking.customerId) : "N/D");
    const businessName =
      businesses.find((b) => b.id === booking.businessId)?.name ||
      booking.business?.name ||
      (booking.businessId !== undefined ? String(booking.businessId) : "N/D");

    return (
      <tr key={booking.id}>
        <td style={{ fontWeight: 600 }}>{booking.id}</td>
        <td>{formatDate(booking.date)}</td>
        <td>{booking.time}</td>
        <td>{booking.serviceName}</td>
        <td>{customerName}</td>
        <td>{businessName}</td>
        <td><StatusBadge status={booking.status} /></td>
        <td>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="secondary-btn" onClick={() => openEditForm(booking)}>
              Editar
            </button>
            <button type="button" className="secondary-btn" onClick={() => openDeleteModal(booking.id)}>
              Eliminar
            </button>
          </div>
        </td>
      </tr>
    );
  }

  function updateCreateForm<K extends keyof CreateBookingDto>(
    key: K,
    value: CreateBookingDto[K]
  ) {
    setCreateForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function updateEditForm<K extends keyof CreateBookingDto>(
    key: K,
    value: CreateBookingDto[K]
  ) {
    setEditForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function resetCreateForm() {
    setCreateForm(defaultBookingForm);
  }

  function resetEditForm() {
    setEditForm(defaultBookingForm);
  }

  function openCreateForm() {
    if (backendError) {
      setErrorMessage('🔄 Reconecta con el servidor para crear reservas');
      return;
    }
    if (loading) {
      setErrorMessage('⏳ Espera a que terminen de cargar los datos');
      return;
    }
    setErrorMessage("");
    setSuccessMessage("");
    setEditingBookingId(null);
    setDeleteTargetId(null);
    resetEditForm();
    setCreateForm((prev) => ({
      ...prev,
      customerId: prev.customerId || customers[0]?.id || 0,
      businessId: prev.businessId || businesses[0]?.id || 0,
    }));
    setIsCreateOpen(true);
  }

  function closeCreateForm() {
    setErrorMessage("");
    resetCreateForm();
    setIsCreateOpen(false);
  }

  function openEditForm(booking: BookingWithRelations) {
    setErrorMessage("");
    setSuccessMessage("");
    setIsCreateOpen(false);
    setDeleteTargetId(null);
    setEditingBookingId(booking.id);
    setEditForm({
      date: booking.date,
      time: booking.time,
      status: booking.status,
      customerId: booking.customerId ?? booking.customer?.id ?? customers[0]?.id ?? 1,
      businessId: booking.businessId ?? booking.business?.id ?? businesses[0]?.id ?? 1,
      serviceName: booking.serviceName,
    });
  }

  function closeEditForm() {
    setErrorMessage("");
    setEditingBookingId(null);
    resetEditForm();
  }

  function openDeleteModal(id: number) {
    setErrorMessage("");
    setSuccessMessage("");
    setDeleteTargetId(id);
  }

  function closeDeleteModal() {
    setDeleteTargetId(null);
  }

  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (backendError) {
      setErrorMessage('No se puede crear reservas en modo offline');
      return;
    }
    
    // Validate form
    if (!createForm.date || !createForm.time || !createForm.customerId || !createForm.businessId) {
      setErrorMessage('Por favor completa todos los campos requeridos');
      return;
    }

    setLoadingCreate(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const created = await createAppointment(createForm);
      const createdWithRelations: BookingWithRelations = {
        ...created,
        customer: customers.find((c) => c.id === created.customerId) ?? undefined,
        business: businesses.find((b) => b.id === created.businessId) ?? undefined,
      };
      setBookings((prev) => [createdWithRelations, ...prev]);
      resetCreateForm();
      setIsCreateOpen(false);
      setSuccessMessage("✅ Reserva creada correctamente.");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido al crear la reserva';
      setErrorMessage(`❌ ${errorMsg}`);
      console.error('Error creating booking:', error);
    } finally {
      setLoadingCreate(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!editingBookingId) return;
    if (backendError) {
      setErrorMessage('No se puede editar reservas en modo offline');
      return;
    }

    // Validate form
    if (!editForm.date || !editForm.time || !editForm.customerId || !editForm.businessId) {
      setErrorMessage('Por favor completa todos los campos requeridos');
      return;
    }

    setLoadingEdit(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const payload: UpdateBookingDto = {
        date: editForm.date,
        time: editForm.time,
        status: editForm.status,
        customerId: editForm.customerId,
        businessId: editForm.businessId,
        serviceName: editForm.serviceName,
      };

      const updated = await updateAppointment(editingBookingId, payload);
      const updatedWithRelations: BookingWithRelations = {
        ...updated,
        customer: customers.find((c) => c.id === updated.customerId) ?? undefined,
        business: businesses.find((b) => b.id === updated.businessId) ?? undefined,
      };

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === editingBookingId ? updatedWithRelations : booking
        )
      );

      setEditingBookingId(null);
      resetEditForm();
      setSuccessMessage("✅ Reserva actualizada correctamente.");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido al actualizar la reserva';
      setErrorMessage(`❌ ${errorMsg}`);
      console.error('Error updating booking:', error);
    } finally {
      setLoadingEdit(false);
    }
  }

  async function confirmDelete() {
    if (deleteTargetId === null) return;
    if (backendError) {
      setErrorMessage('No se puede eliminar reservas en modo offline');
      return;
    }

    setDeletingBookingId(deleteTargetId);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await deleteAppointment(deleteTargetId);
      setBookings((prev) => prev.filter((booking) => booking.id !== deleteTargetId));

      if (editingBookingId === deleteTargetId) {
        closeEditForm();
      }

      setSuccessMessage("✅ Reserva eliminada correctamente.");
      setTimeout(() => setSuccessMessage(""), 4000);
      closeDeleteModal();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido al eliminar la reserva';
      setErrorMessage(`❌ ${errorMsg}`);
      console.error('Error deleting booking:', error);
    } finally {
      setDeletingBookingId(null);
    }
  }

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <TypewriterGreeting messages={['Organiza tus próximas citas.', 'Esto es todo lo que tienes para hoy.']} loop={false} />
          <p>Gestión de reservas conectada con la API.</p>
        </div>

        <button className="primary-btn" type="button" onClick={openCreateForm} disabled={backendError || loading}>
          {loading ? "⏳ Cargando..." : " Nueva reserva ✚ "}
        </button>
      </section>

      <section className="kpi-grid">
        <div className="kpi-card">
          <p className="kpi-card__label">Total reservas</p>
          <h3 className="kpi-card__value">{totalCount}</h3>
          <p className="kpi-card__meta">Registros disponibles</p>
        </div>

        <div className="kpi-card">
          <p className="kpi-card__label">Pendientes</p>
          <h3 className="kpi-card__value">{pendingCount}</h3>
          <p className="kpi-card__meta kpi-card__meta--warning">
            Requieren seguimiento
          </p>
        </div>

        <div className="kpi-card">
          <p className="kpi-card__label">Confirmadas</p>
          <h3 className="kpi-card__value">{confirmedCount}</h3>
          <p className="kpi-card__meta kpi-card__meta--positive">
            Estado activo
          </p>
        </div>

        <div className="kpi-card">
          <p className="kpi-card__label">Pagadas</p>
          <h3 className="kpi-card__value">{paidCount}</h3>
          <p className="kpi-card__meta">Reservas cerradas</p>
        </div>
      </section>

      {isCreateOpen && (
        <div style={modalBackdropStyle} onClick={(e) => { if (e.target === e.currentTarget) closeCreateForm(); }}>
          <section className="section-card" style={modalCardStyle}>
            <div className="panel-title-row">
              <h3 className="panel-title">Nueva reserva</h3>
              <button type="button" className="secondary-btn" onClick={closeCreateForm}>
                Cancelar
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="page-stack" style={{ gap: 16 }}>
            <div className="form-grid">
              <input
                className="input"
                type="date"
                value={createForm.date}
                onChange={(e) => updateCreateForm("date", e.target.value)}
                required
              />
              <input
                className="input"
                type="time"
                value={createForm.time}
                onChange={(e) => updateCreateForm("time", e.target.value)}
                required
              />
              <select
                className="select"
                value={createForm.status}
                onChange={(e) =>
                  updateCreateForm("status", e.target.value as BookingStatus)
                }
              >
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmada</option>
                <option value="paid">Pagada</option>
              </select>
              <select
                className="select"
                value={createForm.customerId}
                onChange={(e) =>
                  updateCreateForm("customerId", Number(e.target.value))
                }
                required
              >
                <option value="">Selecciona cliente</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              <select
                className="select"
                value={createForm.businessId}
                onChange={(e) =>
                  updateCreateForm("businessId", Number(e.target.value))
                }
                required
              >
                <option value="">Selecciona negocio</option>
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
              <input
                className="input input--full"
                type="text"
                value={createForm.serviceName}
                onChange={(e) => updateCreateForm("serviceName", e.target.value)}
                placeholder="Servicio"
                required
              />
            </div>

            {errorMessage ? <div className="message-error">{errorMessage}</div> : null}

            <div className="message-row">
              <button className="primary-btn" type="submit" disabled={loadingCreate}>
                {loadingCreate ? "Guardando..." : "Crear reserva"}
              </button>
            </div>
          </form>
        </section>
      </div>
      )}

      {editingBookingId !== null && (
        <div style={modalBackdropStyle} onClick={(e) => { if (e.target === e.currentTarget) closeEditForm(); }}>
          <section className="section-card" style={modalCardStyle}>
            <div className="panel-title-row">
              <h3 className="panel-title">Editar reserva #{editingBookingId}</h3>
              <button type="button" className="secondary-btn" onClick={closeEditForm}>
                Cancelar
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="page-stack" style={{ gap: 16 }}>
            <div className="form-grid">
              <input
                className="input"
                type="date"
                value={editForm.date}
                onChange={(e) => updateEditForm("date", e.target.value)}
                required
              />
              <input
                className="input"
                type="time"
                value={editForm.time}
                onChange={(e) => updateEditForm("time", e.target.value)}
                required
              />
              <select
                className="select"
                value={editForm.status}
                onChange={(e) =>
                  updateEditForm("status", e.target.value as BookingStatus)
                }
              >
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmada</option>
                <option value="paid">Pagada</option>
              </select>
              <select
                className="select"
                value={editForm.customerId}
                onChange={(e) =>
                  updateEditForm("customerId", Number(e.target.value))
                }
                required
              >
                <option value="">Selecciona cliente</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              <select
                className="select"
                value={editForm.businessId}
                onChange={(e) =>
                  updateEditForm("businessId", Number(e.target.value))
                }
                required
              >
                <option value="">Selecciona negocio</option>
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
              <input
                className="input input--full"
                type="text"
                value={editForm.serviceName}
                onChange={(e) => updateEditForm("serviceName", e.target.value)}
                placeholder="Servicio"
                required
              />
            </div>

            {errorMessage ? <div className="message-error">{errorMessage}</div> : null}

            <div className="message-row">
              <button className="primary-btn" type="submit" disabled={loadingEdit}>
                {loadingEdit ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </section>
      </div>
      )}

      {deleteTargetId !== null && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          aria-describedby="delete-modal-description"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDeleteModal();
          }}
        >
          <div className="modal-card">
            <div className="modal-icon">!</div>
            <h3 id="delete-modal-title" className="modal-title">
              Eliminar reserva
            </h3>
            <p id="delete-modal-description" className="modal-text">
              ¿Seguro que quieres eliminar la reserva #{deleteTargetId}? Esta acción no se puede deshacer.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={closeDeleteModal}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="danger-btn"
                onClick={confirmDelete}
                disabled={deletingBookingId === deleteTargetId}
              >
                {deletingBookingId === deleteTargetId ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="section-card">
        <div className="panel-title-row">
          <h3 className="panel-title">Reservas registradas</h3>
          <div className="filter-row">
            <button type="button" className="filter-pill" onClick={() => setStatusFilter("all")}>Todas</button>
            <button type="button" className="filter-pill" onClick={() => setStatusFilter("pending")}>Pendientes</button>
            <button type="button" className="filter-pill" onClick={() => setStatusFilter("confirmed")}>Confirmadas</button>
            <button type="button" className="filter-pill" onClick={() => setStatusFilter("paid")}>Pagadas</button>
          </div>
        </div>

        {backendError && (
          <div style={{ marginBottom: 12, padding: "12px 14px", background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: "var(--radius-sm)", fontSize: "0.82rem", color: "#7F1D1D", display: "flex", gap: 8 }}>
            <span>⚠️</span>
            <div>
              <strong>Modo offline:</strong> Los cambios no se guardarán. 
              <button 
                type="button" 
                onClick={async () => { await Promise.all([refetchCustomers(), refetchBusinesses()]); }} 
                style={{ marginLeft: 8, background: "transparent", color: "#7F1D1D", textDecoration: "underline", cursor: "pointer", border: "none", padding: 0 }}
              >
                Reconectar
              </button>
            </div>
          </div>
        )}
        {loading && (
          <div style={{ marginBottom: 12, padding: "12px 14px", background: "#DBEAFE", border: "1px solid #93C5FD", borderRadius: "var(--radius-sm)", fontSize: "0.82rem", color: "#1E40AF", display: "flex", gap: 8, alignItems: "center" }}>
            <span>⏳</span>
            <div>Cargando datos de clientes y negocios...</div>
          </div>
        )}
        {customersError && (
          <div style={{ marginBottom: 12, padding: "12px 14px", background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: "var(--radius-sm)", fontSize: "0.82rem", color: "#7F1D1D" }}>
            ❌ Error al cargar clientes: {customersError.message}
          </div>
        )}
        {businessesError && (
          <div style={{ marginBottom: 12, padding: "12px 14px", background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: "var(--radius-sm)", fontSize: "0.82rem", color: "#7F1D1D" }}>
            ❌ Error al cargar negocios: {businessesError.message}
          </div>
        )}
        {successMessage ? <div className="message-success" style={{ marginBottom: 12 }}>{successMessage}</div> : null}
        {errorMessage ? <div className="message-error" style={{ marginBottom: 12 }}>{errorMessage}</div> : null}

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Servicio</th>
              <th>Cliente</th>
              <th>Negocio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length > 0 ? (
              filteredBookings.map(renderBookingRow)
            ) : (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "24px", color: "var(--muted)", fontSize: "0.88rem" }}>
                  {bookings.length === 0 ? "📭 No hay reservas registradas" : `📭 No hay reservas con estado "${statusFilter}"`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}