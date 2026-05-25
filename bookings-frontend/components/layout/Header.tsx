import { museoModerno } from '@/lib/fonts';

export default function Header() {
    return (
      <header className="admin-header-top">
        <h1 style={{ margin: 0, fontSize: "28px" }}>
          Panel de Administración
        </h1>
        <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: "14px", fontFamily: "inherit" }}>
          Plataforma de gestión de reservas y cobros
        </p>
      </header>
    );
  }