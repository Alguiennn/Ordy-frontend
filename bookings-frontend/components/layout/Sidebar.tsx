"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { museoModerno } from "@/lib/fonts";
import Image from "next/image";

const menuItems = [
  { label: "Vista General", href: "/dashboard",  icon: "/icons/vistaGeneral.png" },
  { label: "Reservas",      href: "/bookings",   icon: "/icons/reserva1.png"     },
  { label: "Clientes",      href: "/customers",  icon: "/icons/cliente.png"      },
  { label: "Pagos",         href: "/payments",   icon: "/icons/pagos.png"        },
];

// ── Toggle icons ─────────────────────────────────────────────────────────────
function CollapseIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
      <path d="M14 9l-3 3 3 3" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
      <path d="M14 15l3-3-3-3" />
    </svg>
  );
}

const STORAGE_KEY = "ordy_sidebar_collapsed";

export default function Sidebar() {
  const pathname  = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted,   setMounted]   = useState(false);

  // Restore saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "true") setCollapsed(true);
    setMounted(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  // Prevent flash of wrong sidebar width on first render
  if (!mounted) return null;

  return (
    <aside
      className={`admin-sidebar${collapsed ? " admin-sidebar--collapsed" : ""}`}
    >
      {/* ── Brand + toggle ───────────────────────────────────────────────── */}
      <div className="admin-sidebar__header">

        {/* Brand text – fades out when collapsed */}
        <div
          className="admin-sidebar__brand"
          style={{
            overflow: "hidden",
            transition: "opacity 0.22s ease, width 0.22s ease",
            opacity: collapsed ? 0 : 1,
            width: collapsed ? 0 : "auto",
            pointerEvents: collapsed ? "none" : "auto",
          }}
        >
          <h2
            className={`${museoModerno.className} admin-sidebar__title`}
            style={{ fontSize: "32px", lineHeight: "1.2", marginLeft: "64px" }}
          >
            Ordy
          </h2>
          <p
            className={`${museoModerno.className} admin-sidebar__subtitle`}
            style={{ fontSize: "16px", lineHeight: "1.2", marginLeft: "30px" }}
          >
            Admin workspace
          </p>
        </div>

        {/* Toggle button */}
        <button
          className="sidebar-toggle-btn"
          onClick={toggle}
          aria-label={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
          title={collapsed ? "Expandir" : "Contraer"}
        >
          {collapsed ? <ExpandIcon /> : <CollapseIcon />}
        </button>
      </div>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <nav className="admin-sidebar__nav">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <div key={item.href} className="sidebar-nav-item-wrapper">
              <Link
                href={item.href}
                className={`${museoModerno.className} admin-sidebar__link${isActive ? " admin-sidebar__link--active" : ""}`}
                style={collapsed ? { marginLeft: 0, justifyContent: "center" } : { fontSize: "15px", marginLeft: "20px" }}
              >
                {/* PNG icon – always visible */}
                <span style={{ width: "24px", display: "flex", justifyContent: "center", flexShrink: 0 }}>
                  <Image
                    src={item.icon}
                    alt={item.label}
                    width={20}
                    height={20}
                    style={{ objectFit: "contain" }}
                  />
                </span>

                {/* Label – fades out when collapsed */}
                <span
                  style={{
                    overflow: "hidden",
                    transition: "opacity 0.18s ease, max-width 0.22s ease",
                    opacity: collapsed ? 0 : 1,
                    maxWidth: collapsed ? 0 : "200px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </span>
              </Link>

              {/* Tooltip – only rendered when collapsed */}
              {collapsed && (
                <span className="sidebar-tooltip" role="tooltip">
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}