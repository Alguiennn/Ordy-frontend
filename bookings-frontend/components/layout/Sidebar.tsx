"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { museoModerno } from '@/lib/fonts';
import Image from "next/image"

const menuItems = [
  { label: "Vista General", href: "/dashboard", icon: "/icons/vistaGeneral.png" },
  { label: "Reservas", href: "/bookings", icon: "/icons/reserva1.png" },
  { label: "Clientes", href: "/customers", icon: "/icons/cliente.png" },
  { label: "Pagos", href: "/payments", icon: "/icons/pagos.png" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">
        <h2 
    className={`${museoModerno.className} admin-sidebar__title`} style={{ 
          fontSize: "32px",    // Ajusta este valor a tu gusto (2rem, 36px, etc.)
          lineHeight: "1.2",   // Evita que se pegue al texto de abajo
          marginLeft: "64px"  // Espaciado extra si lo necesitas
          }}>Ordy</h2>
        <p className={`${museoModerno.className} admin-sidebar__subtitle`} style={{ 
          fontSize: "16px",    // Ajusta este valor a tu gusto (2rem, 36px, etc.)
          lineHeight: "1.2",   // Evita que se pegue al texto de abajo
          marginLeft: "30px"  // Espaciado extra si lo necesitas
          }}>Admin workspace</p>
      </div>

      <nav className="admin-sidebar__nav">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${museoModerno.className} admin-sidebar__link ${isActive ? "admin-sidebar__link--active" : ""}`}
              style={{ fontSize: "15px", marginLeft: "20px" }}
            >
              <span style={{ width: '24px', display: 'flex', justifyContent: 'center' }}>
          {/* LÓGICA PARA DIFERENCIAR ICONO DE IMAGEN */}
          {item.icon.includes(".") ? (
            // Si el icono tiene un punto (ej: .png), es una imagen
            <Image 
              src={item.icon} 
              alt={item.label} 
              width={20} 
              height={20} 
              style={{ objectFit: 'contain' }}
            />
          ) : (
            // Si no, es un icono de texto/carácter
            <span>{item.icon}</span>
          )}
        </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}