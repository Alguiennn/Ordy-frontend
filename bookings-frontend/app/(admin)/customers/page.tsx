"use client";

import { useState } from "react";

type Booking = {
  date: string;
  service: string;
  status: "confirmed" | "pending" | "cancelled";
};

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  business: string;
  nextBooking: string;
  nextBookingOrder: number;
  history: Booking[];
};

type FormFields = { name: string; phone: string; email: string; business: string; nextBooking: string };
type ModalState = null | "new" | { type: "edit"; customer: Customer } | { type: "history"; customer: Customer };

const initialCustomers: Customer[] = [
  {
    id: "C-001",
    name: "María López",
    phone: "600 123 456",
    email: "maria@email.com",
    business: "Peluquería Nova",
    nextBooking: "Hoy · 09:00",
    nextBookingOrder: 1,
    history: [
      { date: "01/05/2026", service: "Corte + Color", status: "confirmed" },
      { date: "10/04/2026", service: "Mechas", status: "confirmed" },
      { date: "20/03/2026", service: "Corte", status: "cancelled" },
    ],
  },
  {
    id: "C-002",
    name: "Carlos Pérez",
    phone: "611 456 789",
    email: "carlos@email.com",
    business: "Restaurante Marea",
    nextBooking: "Hoy · 10:30",
    nextBookingOrder: 2,
    history: [
      { date: "05/05/2026", service: "Consultoría menú", status: "confirmed" },
      { date: "15/04/2026", service: "Auditoría cocina", status: "confirmed" },
    ],
  },
  {
    id: "C-003",
    name: "Lucía Sánchez",
    phone: "622 987 654",
    email: "lucia@email.com",
    business: "Barber Studio",
    nextBooking: "Mañana · 12:00",
    nextBookingOrder: 3,
    history: [
      { date: "08/05/2026", service: "Afeitado + Corte", status: "confirmed" },
      { date: "22/04/2026", service: "Corte", status: "pending" },
      { date: "01/04/2026", service: "Barba", status: "confirmed" },
      { date: "10/03/2026", service: "Corte + Barba", status: "cancelled" },
    ],
  },
];

const FORM_FIELDS = [
  { field: "name", label: "Nombre completo", placeholder: "Ej: Ana García" },
  { field: "phone", label: "Teléfono", placeholder: "Ej: 600 000 000" },
  { field: "email", label: "Email", placeholder: "Ej: ana@email.com" },
  { field: "business", label: "Negocio", placeholder: "Ej: Clínica Dental" },
  { field: "nextBooking", label: "Próxima reserva (opcional)", placeholder: "Ej: Hoy · 15:00" },
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

const StatusBadge = ({ status }: { status: Booking["status"] }) => {
  const badges = { pending: "badge--pending", confirmed: "badge--confirmed", cancelled: "badge--cancelled" };
  const labels = { pending: "Pendiente", confirmed: "Confirmada", cancelled: "Cancelada" };
  return <span className={`badge ${badges[status]}`}>{labels[status]}</span>;
};

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

const CustomerModal = ({ mode, initial, onClose, onSave }: { mode: "new" | "edit"; initial?: Customer; onClose: () => void; onSave: (data: FormFields) => void }) => {
  const [form, setForm] = useState<FormFields>({
    name: initial?.name ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    business: initial?.business ?? "",
    nextBooking: initial?.nextBooking === "Sin reserva" ? "" : (initial?.nextBooking ?? ""),
  });
  const [errors, setErrors] = useState<Partial<FormFields>>({});

  const validate = () => {
    const e: Partial<FormFields> = {};
    if (!form.name.trim()) e.name = "El nombre es obligatorio";
    if (!form.phone.trim()) e.phone = "El teléfono es obligatorio";
    if (!form.email.trim()) e.email = "El email es obligatorio";
    if (!form.business.trim()) e.business = "El negocio es obligatorio";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
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
        </div>

        <div style={{ padding: "14px 24px 20px", display: "flex", gap: 10, justifyContent: "flex-end", borderTop: "1px solid var(--border)" }}>
          <button onClick={onClose} className="secondary-btn">Cancelar</button>
          <button onClick={handleSave} className="primary-btn">{mode === "new" ? "Guardar cliente" : "Guardar cambios"}</button>
        </div>
      </ModalBox>
    </Overlay>
  );
};

const HistoryModal = ({ customer, onClose, onAddBooking }: { customer: Customer; onClose: () => void; onAddBooking: (customerId: string, booking: Booking) => void }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newBooking, setNewBooking] = useState<Booking>({ date: "", service: "", status: "confirmed" });
  const [err, setErr] = useState("");

  const handleAdd = () => {
    if (!newBooking.date.trim() || !newBooking.service.trim()) { setErr("Fecha y servicio son obligatorios"); return; }
    onAddBooking(customer.id, newBooking);
    setNewBooking({ date: "", service: "", status: "confirmed" });
    setShowAdd(false);
    setErr("");
  };

  const totalConfirmed = customer.history.filter((b) => b.status === "confirmed").length;
  const totalCancelled = customer.history.filter((b) => b.status === "cancelled").length;

  return (
    <Overlay onClose={onClose}>
      <ModalBox width={520} fullHeight onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text)" }}>{customer.name}</h3>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--muted)" }}>{customer.business}</p>
          </div>
          <button onClick={onClose} style={STYLES.closeBtn} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}>✕</button>
        </div>

        <div style={{ display: "flex", gap: 10, padding: "14px 24px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          {[
            { label: "Total", value: customer.history.length },
            { label: "Confirmadas", value: totalConfirmed },
            { label: "Canceladas", value: totalCancelled },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, textAlign: "center", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: "10px 8px", border: "1px solid var(--border)" }}>
              <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "var(--accent)" }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: "0.73rem", color: "var(--muted)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.92rem", color: "var(--text)" }}>Historial de reservas</p>
            <button className="primary-btn" style={{ fontSize: "0.78rem", padding: "5px 12px" }} onClick={() => setShowAdd((v) => !v)}>
              {showAdd ? "Cancelar" : "+ Añadir"}
            </button>
          </div>

          {showAdd && (
            <div style={{ background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: 14, marginBottom: 14, border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input placeholder="Fecha (Ej: 20/05/2026)" value={newBooking.date} style={{ flex: 1, minWidth: 130, ...STYLES.input }} onChange={(e) => { setNewBooking((b) => ({ ...b, date: e.target.value })); setErr(""); }} />
                <input placeholder="Servicio (Ej: Corte)" value={newBooking.service} style={{ flex: 2, minWidth: 160, ...STYLES.input }} onChange={(e) => { setNewBooking((b) => ({ ...b, service: e.target.value })); setErr(""); }} />
                <select value={newBooking.status} style={{ flex: 1, minWidth: 130, ...STYLES.input }} onChange={(e) => setNewBooking((b) => ({ ...b, status: e.target.value as Booking["status"] }))}>
                  <option value="confirmed">Confirmada</option>
                  <option value="pending">Pendiente</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
              {err && <span style={STYLES.error}>{err}</span>}
              <button className="primary-btn" style={{ alignSelf: "flex-end", fontSize: "0.82rem" }} onClick={handleAdd}>Guardar</button>
            </div>
          )}

          {customer.history.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--muted)" }}>
              <div style={{ fontSize: "2rem", marginBottom: 6 }}>📋</div>
              <p style={{ margin: 0, fontSize: "0.88rem" }}>Sin reservas registradas</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {customer.history.map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "var(--radius-sm)", background: "var(--surface-2)", border: "1px solid var(--border)", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "8px", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>
                      {b.status === "confirmed" ? "✅" : b.status === "cancelled" ? "❌" : "🕐"}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: "0.88rem", color: "var(--text)" }}>{b.service}</p>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--muted)" }}>{b.date}</p>
                    </div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: "14px 24px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
          <button className="secondary-btn" onClick={onClose}>Cerrar</button>
        </div>
      </ModalBox>
    </Overlay>
  );
};

const CustomerCard = ({ customer, onEdit, onDelete, onHistory }: { customer: Customer; onEdit: (c: Customer) => void; onDelete: (id: string) => void; onHistory: (c: Customer) => void }) => (
  <div className="surface-card" style={{ position: "relative", cursor: "pointer", padding: "18px", transition: "box-shadow 0.2s, transform 0.15s" }} onClick={() => onHistory(customer)}
    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.transform = ""; }}>
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
        <button title="Eliminar" onClick={(e) => { e.stopPropagation(); onDelete(customer.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "0.88rem", padding: "4px 5px", borderRadius: "5px" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}>🗑️</button>
      </div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div><p style={{ margin: 0, fontSize: "0.73rem", color: "var(--muted)", fontWeight: 500 }}>Teléfono</p><p style={{ margin: "3px 0 0", fontSize: "0.88rem", color: "var(--text)" }}>{customer.phone}</p></div>
      <div><p style={{ margin: 0, fontSize: "0.73rem", color: "var(--muted)", fontWeight: 500 }}>Email</p><p style={{ margin: "3px 0 0", fontSize: "0.88rem", color: "var(--text)" }}>{customer.email}</p></div>
      <div><p style={{ margin: 0, fontSize: "0.73rem", color: "var(--muted)", fontWeight: 500 }}>Próxima reserva</p><p style={{ margin: "3px 0 0", fontSize: "0.88rem", color: "var(--accent)", fontWeight: 600 }}>{customer.nextBooking}</p></div>
      {customer.history.length > 0 && <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 5, fontSize: "0.78rem", color: "var(--muted)" }}><span>📋</span><span>{customer.history.length} reserva{customer.history.length !== 1 ? "s" : ""}</span></div>}
    </div>
  </div>
);

const Toast = ({ message }: { message: string }) => (
  <div style={{ position: "fixed", bottom: 24, right: 24, background: "var(--primary)", color: "#fff", padding: "10px 18px", borderRadius: "var(--radius-sm)", fontSize: "0.88rem", fontWeight: 500, boxShadow: "var(--shadow-md)", zIndex: 999999, display: "flex", alignItems: "center", gap: 8 }}>
    <span>✅</span> {message}
  </div>
);console.log("");

// ─── Página principal ─────────────────────────────────────────────────────────
export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [searchText, setSearchText] = useState("");
  const [filterActive, setFilterActive] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const displayed = (() => {
    const q = searchText.trim().toLowerCase();
    const filtered = q ? customers.filter((c) => c.name.toLowerCase().includes(q) || c.business.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q)) : customers;
    return [...filtered].sort((a, b) => a.nextBookingOrder - b.nextBookingOrder);
  })();

  const handleSaveNew = (data: FormFields) => {
    const maxOrder = customers.reduce((m, c) => Math.max(m, c.nextBookingOrder), 0);
    setCustomers((prev) => [...prev, { id: `C-${Date.now()}`, ...data, nextBooking: data.nextBooking.trim() || "Sin reserva", nextBookingOrder: maxOrder + 1, history: [] }]);
    setModal(null);
    showToast(`Cliente "${data.name}" añadido`);
  };

  const handleSaveEdit = (data: FormFields) => {
    if (!modal || modal === "new" || modal.type !== "edit") return;
    setCustomers((prev) => prev.map((c) => c.id === modal.customer.id ? { ...c, ...data, nextBooking: data.nextBooking.trim() || "Sin reserva" } : c));
    setModal(null);
    showToast(`Cambios guardados para "${data.name}"`);
  };

  const handleDelete = (id: string) => {
    const t = customers.find((c) => c.id === id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    if (t) showToast(`Cliente "${t.name}" eliminado`);
  };

  const handleAddBooking = (customerId: string, booking: Booking) => {
    setCustomers((prev) => prev.map((c) => c.id === customerId ? { ...c, history: [booking, ...c.history] } : c));
    showToast("Reserva añadida al historial");
  };

  const historyCustomer = modal && modal !== "new" && modal.type === "history" ? (customers.find((c) => c.id === modal.customer.id) ?? modal.customer) : null;

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <h2>Directorio de clientes</h2>
          <p>Gestiona y consulta el historial de tus clientes.</p>
        </div>
        <button className="primary-btn" type="button" onClick={() => setModal("new")}>+ Nuevo cliente</button>
      </section>

      <section className="section-card">
        <SearchRow value={searchText} onChange={setSearchText} onFilter={() => setFilterActive(true)} onClear={() => { setSearchText(""); setFilterActive(false); }} hasResults={filterActive && searchText.length > 0} />
        <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginTop: 8 }}>
          {filterActive && searchText ? `${displayed.length} resultado${displayed.length !== 1 ? "s" : ""} para "${searchText}"` : `${customers.length} cliente${customers.length !== 1 ? "s" : ""} en total`}
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
        {displayed.length > 0 ? (displayed.map((c) => <CustomerCard key={c.id} customer={c} onEdit={(c) => setModal({ type: "edit", customer: c })} onDelete={handleDelete} onHistory={(c) => setModal({ type: "history", customer: c })} />))
          : (<div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px 16px", color: "var(--muted)" }}><div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🔍</div><p style={{ fontWeight: 600, marginBottom: 4 }}>Sin resultados</p><p style={{ fontSize: "0.88rem" }}>No hay clientes que coincidan con "{searchText}"</p></div>)}
      </section>

      {modal === "new" && <CustomerModal mode="new" onClose={() => setModal(null)} onSave={handleSaveNew} />}
      {modal && modal !== "new" && modal.type === "edit" && <CustomerModal mode="edit" initial={modal.customer} onClose={() => setModal(null)} onSave={handleSaveEdit} />}
      {historyCustomer && <HistoryModal customer={historyCustomer} onClose={() => setModal(null)} onAddBooking={handleAddBooking} />}
      {toast && <Toast message={toast} />}
    </div>
  );
}
