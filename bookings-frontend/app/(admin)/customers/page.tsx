"use client";

import { useEffect, useState } from "react";
import {
  Business,
  CreateCustomerDto,
  createCustomer,
  deleteCustomer,
  getBusinesses,
  getCustomers,
  updateCustomer,
  Customer as ApiCustomer,
} from "@/lib/api";

type Customer = {
  id: number;
  code?: string;
  name: string;
  phone: string;
  email: string;
  businessId?: number;
  business: string;
};

type FormFields = { name: string; phone: string; email: string; businessId: string };
type ModalState = null | "new" | { type: "edit"; customer: Customer };


const initialCustomers: Customer[] = [
  {
    id: 1,
    businessId: 1,
    name: "María López",
    phone: "600 123 456",
    email: "maria@email.com",
    business: "Peluquería Nova",
  },
  {
    id: 2,
    businessId: 2,
    name: "Carlos Pérez",
    phone: "611 456 789",
    email: "carlos@email.com",
    business: "Restaurante Marea",
  },
  {
    id: 3,
    businessId: 3,
    name: "Lucía Sánchez",
    phone: "622 987 654",
    email: "lucia@email.com",
    business: "Barber Studio",
  },
];

const mapApiCustomerToUi = (customer: ApiCustomer, businessName?: string): Customer => ({
  id: customer.id,
  code: customer.code,
  name: customer.name,
  phone: customer.phone,
  email: customer.email,
  businessId: customer.businessId ?? customer.business?.id,
  business: customer.business?.name ?? businessName ?? "Sin negocio",
});

const FORM_FIELDS = [
  { field: "name", label: "Nombre completo", placeholder: "Ej: Ana García" },
  { field: "phone", label: "Teléfono", placeholder: "Ej: 600 000 000" },
  { field: "email", label: "Email", placeholder: "Ej: ana@email.com" },
] as const;

const STYLES = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: "16px" } as const,
  modal: { background: "var(--surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)", width: "100%", overflow: "hidden" } as const,
  closeBtn: { background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", borderRadius: "6px", padding: "2px 6px", lineHeight: 1, color: "var(--muted)" } as const,
  label: { fontSize: "0.82rem", fontWeight: 600, color: "var(--muted)" } as const,
  input: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 12px", fontSize: "0.92rem", outline: "none", transition: "border-color 0.15s" } as const,
  error: { fontSize: "0.78rem", color: "#ef4444" } as const,
};

const getInitials = (name: string) =>
  name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const SearchRow = ({ value, onChange, onFilter, onClear, hasResults }: { value: string; onChange: (v: string) => void; onFilter: () => void; onClear: () => void; hasResults: boolean }) => (
  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
    <input className="input" placeholder="Buscar por nombre, negocio, email o teléfono..." value={value} onChange={(e) => onChange(e.target.value)} style={{ flex: 1, minWidth: "200px" }} />
    <button className="secondary-btn" type="button" onClick={onFilter}>Filtrar</button>
    {hasResults && <button className="secondary-btn" type="button" onClick={onClear} style={{ color: "#ef4444", borderColor: "#ef4444" }}>✕ Limpiar</button>}
  </div>
);

const Overlay = ({ onClose, children }: { onClose: () => void; children: React.ReactNode }) => (
  <div onClick={onClose} style={STYLES.overlay}>{children}</div>
);

const ModalBox = ({ children, width = 460, fullHeight = false, onClick }: { children: React.ReactNode; width?: number; fullHeight?: boolean; onClick?: (e: React.MouseEvent) => void }) => (
  <div onClick={onClick ?? ((e) => e.stopPropagation())} style={{ ...STYLES.modal, maxWidth: width, maxHeight: fullHeight ? "85vh" : undefined, display: fullHeight ? "flex" : "block", flexDirection: fullHeight ? "column" : undefined }}>
    {children}
  </div>
);

const CustomerModal = ({ mode, initial, businesses, onClose, onSave }: { mode: "new" | "edit"; initial?: Customer; businesses: Business[]; onClose: () => void; onSave: (data: FormFields) => void }) => {
  const defaultBusinessId = businesses.length > 0 ? businesses[0].id.toString() : "";
  
  const [form, setForm] = useState<FormFields>({
    name: initial?.name ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    businessId: mode === "edit"
      ? (initial?.businessId?.toString() ?? defaultBusinessId)
      : defaultBusinessId,
  });
  const [errors, setErrors] = useState<Partial<FormFields>>({});

  const validate = () => {
    const e: Partial<FormFields> = {};
    if (!form.name.trim()) e.name = "El nombre es obligatorio";
    if (!form.phone.trim()) e.phone = "El teléfono es obligatorio";
    if (!form.email.trim()) e.email = "El email es obligatorio";
    if (!form.businessId.trim()) e.businessId = "El negocio es obligatorio";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    onSave(form);
  };

  return (
    <Overlay onClose={onClose}>
      <ModalBox onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "var(--text)" }}>
            {mode === "new" ? "Nuevo cliente" : "Editar cliente"}
          </h3>
          <button onClick={onClose} style={{ ...STYLES.closeBtn, color: "var(--muted)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}>✕</button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          {FORM_FIELDS.map(({ field, label, placeholder }) => (
            <div key={field} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={STYLES.label}>{label}</label>
              <input placeholder={placeholder} value={form[field]} onChange={(e) => { setForm((f) => ({ ...f, [field]: e.target.value })); setErrors((er) => ({ ...er, [field]: "" })); }}
                style={STYLES.input} onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")} onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")} />
              {errors[field] && <span style={STYLES.error}>{errors[field]}</span>}
            </div>
          ))}

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={STYLES.label}>Negocio</label>
            <select
              value={form.businessId}
              onChange={(e) => {
                setForm((f) => ({ ...f, businessId: e.target.value }));
                setErrors((er) => ({ ...er, businessId: "" }));
              }}
              style={STYLES.input}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <option value="">Selecciona un negocio</option>
              {businesses.map((business) => (
                <option key={business.id} value={business.id.toString()}>
                  {business.name}
                </option>
              ))}
            </select>
            {errors.businessId && <span style={STYLES.error}>{errors.businessId}</span>}
          </div>
        </div>

        <div style={{ padding: "14px 24px 20px", display: "flex", gap: 10, justifyContent: "flex-end", borderTop: "1px solid var(--border)" }}>
          <button onClick={onClose} className="secondary-btn">Cancelar</button>
          <button onClick={handleSave} className="primary-btn">{mode === "new" ? "Guardar cliente" : "Guardar cambios"}</button>
        </div>
      </ModalBox>
    </Overlay>
  );
};

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
const ConfirmDeleteModal = ({ customer, onClose, onConfirm }: { customer: Customer; onClose: () => void; onConfirm: () => void }) => (
  <Overlay onClose={onClose}>
    <ModalBox width={400} onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#FECACA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "1.2rem" }}>
          🗑️
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: "var(--text)" }}>Eliminar cliente</p>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "#ef4444" }}>Esta acción no se puede deshacer</p>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "20px 24px" }}>
        <p style={{ margin: "0 0 12px", fontSize: "0.88rem", color: "var(--muted)" }}>
          Estás a punto de eliminar a:
        </p>

        {/* Customer preview */}
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "var(--radius-sm)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#FECACA", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem", color: "#991B1B", flexShrink: 0 }}>
            {getInitials(customer.name)}
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "0.92rem", color: "#991B1B" }}>{customer.name}</p>
            <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "#B91C1C" }}>{customer.business}</p>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div style={{ padding: "14px 24px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onClose} className="secondary-btn">Cancelar</button>
        <button
          onClick={onConfirm}
          style={{ background: "#DC2626", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "8px 18px", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#B91C1C")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#DC2626")}
        >
          🗑️ Sí, eliminar
        </button>
      </div>
    </ModalBox>
  </Overlay>
);

const CustomerCard = ({ customer, onEdit, onDelete }: { customer: Customer; onEdit: (c: Customer) => void; onDelete: (c: Customer) => void }) => (
  <div className="surface-card" style={{ position: "relative", padding: "18px", transition: "box-shadow 0.2s, transform 0.15s" }}>
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--primary))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "1rem" }}>
          {getInitials(customer.name)}
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem", color: "var(--text)" }}>{customer.name}</p>
          <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "var(--muted)" }}>{customer.business}</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button title="Editar" onClick={(e) => { e.stopPropagation(); onEdit(customer); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "0.88rem", padding: "4px 5px", borderRadius: "5px" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}>✏️</button>
        <button title="Eliminar" onClick={(e) => { e.stopPropagation(); onDelete(customer); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "0.88rem", padding: "4px 5px", borderRadius: "5px" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}>🗑️</button>
      </div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div><p style={{ margin: 0, fontSize: "0.73rem", color: "var(--muted)", fontWeight: 500 }}>Teléfono</p><p style={{ margin: "3px 0 0", fontSize: "0.88rem", color: "var(--text)" }}>{customer.phone}</p></div>
      <div><p style={{ margin: 0, fontSize: "0.73rem", color: "var(--muted)", fontWeight: 500 }}>Email</p><p style={{ margin: "3px 0 0", fontSize: "0.88rem", color: "var(--text)" }}>{customer.email}</p></div>
    </div>
  </div>
);

const Toast = ({ message }: { message: string }) => (
  <div style={{ position: "fixed", bottom: 24, right: 24, background: "var(--primary)", color: "#fff", padding: "10px 18px", borderRadius: "var(--radius-sm)", fontSize: "0.88rem", fontWeight: 500, boxShadow: "var(--shadow-md)", zIndex: 999999, display: "flex", alignItems: "center", gap: 8 }}>
    <span>✅</span> {message}
  </div>
);

// ─── Página principal ─────────────────────────────────────────────────────────
export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [searchText, setSearchText] = useState("");
  const [filterActive, setFilterActive] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setBackendError(false);
        const [customersData, businessesData] = await Promise.all([getCustomers(), getBusinesses()]);
        setBusinesses(businessesData);
        setCustomers(customersData.map((customer) => mapApiCustomerToUi(customer)));
      } catch (error) {
        console.error('Error cargando datos del backend:', error);
        setBackendError(true);
        setBusinesses([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const displayed = (() => {
    const q = searchText.trim().toLowerCase();
    const filtered = q
      ? customers.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.business.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.phone.includes(q)
        )
      : customers;
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  })();

  const handleSaveNew = async (data: FormFields) => {
    if (backendError) {
      showToast('No se puede crear clientes en modo offline');
      return;
    }

    const payload: CreateCustomerDto = {
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      businessId: Number(data.businessId),
    };

    try {
      const created = await createCustomer(payload);
      const businessName = businesses.find((b) => b.id === Number(data.businessId))?.name;
      setCustomers((prev) => [
        ...prev,
        mapApiCustomerToUi(created, businessName),
      ]);
      setModal(null);
      showToast(`Cliente "${created.name}" añadido correctamente`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al crear el cliente');
    }
  };

  const handleSaveEdit = async (data: FormFields) => {
    if (!modal || modal === 'new' || modal.type !== 'edit') return;

    if (backendError) {
      showToast('No se puede editar clientes en modo offline');
      return;
    }

    try {
      const updated = await updateCustomer(modal.customer.id, {
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: data.email.trim(),
        businessId: Number(data.businessId),
      });

      const businessName = businesses.find((b) => b.id === Number(data.businessId))?.name ?? modal.customer.business;
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === modal.customer.id
            ? mapApiCustomerToUi(updated, businessName)
            : c
        )
      );

      setModal(null);
      showToast(`Cambios guardados para "${updated.name}" correctamente`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al actualizar el cliente');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    if (backendError) {
      showToast('No se puede eliminar clientes en modo offline');
      return;
    }

    try {
      await deleteCustomer(deleteTarget.id);
      setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      showToast(`Cliente "${deleteTarget.name}" eliminado correctamente`);
      setDeleteTarget(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al eliminar el cliente');
    }
  };


  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <h2>Directorio de clientes</h2>
          <p>Gestiona y consulta el historial de tus clientes.</p>
        </div>
        <button className="primary-btn" type="button" onClick={() => setModal("new")} disabled={backendError || loading}>
          + Nuevo cliente
        </button>
      </section>

      <section className="section-card">
        <SearchRow value={searchText} onChange={setSearchText} onFilter={() => setFilterActive(true)} onClear={() => { setSearchText(""); setFilterActive(false); }} hasResults={filterActive && searchText.length > 0} />
        {backendError && (
          <div style={{ marginTop: 12, padding: "10px 12px", background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: "var(--radius-sm)", fontSize: "0.82rem", color: "#92400E" }}>
            ⚠️ Modo offline: usando datos locales. Los cambios no se guardarán en el servidor.
          </div>
        )}
        {loading && (
          <div style={{ marginTop: 12, textAlign: "center", color: "var(--muted)", fontSize: "0.88rem" }}>
            ⏳ Cargando clientes...
          </div>
        )}
        <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginTop: 8 }}>
          {filterActive && searchText ? `${displayed.length} resultado${displayed.length !== 1 ? "s" : ""} para "${searchText}"` : `${customers.length} cliente${customers.length !== 1 ? "s" : ""} en total`}
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
        {loading ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px 16px", color: "var(--muted)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>⏳</div>
            <p style={{ fontWeight: 600 }}>Cargando clientes...</p>
          </div>
        ) : displayed.length > 0 ? (
          displayed.map((c) => (
            <CustomerCard
              key={c.id}
              customer={c}
              onEdit={(c) => setModal({ type: "edit", customer: c })}
              onDelete={(c) => setDeleteTarget(c)}
            />
          ))
        ) : (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px 16px", color: "var(--muted)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🔍</div>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Sin resultados</p>
            <p style={{ fontSize: "0.88rem" }}>No hay clientes que coincidan con &quot;{searchText}&quot;</p>
          </div>
        )}
      </section>

      {modal === "new" && <CustomerModal mode="new" businesses={backendError ? [] : businesses} onClose={() => setModal(null)} onSave={handleSaveNew} />}
      {modal && typeof modal !== 'string' && modal.type === "edit" && <CustomerModal mode="edit" initial={modal.customer} businesses={backendError ? [] : businesses} onClose={() => setModal(null)} onSave={handleSaveEdit} />}
      {deleteTarget && (
        <ConfirmDeleteModal
          customer={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}