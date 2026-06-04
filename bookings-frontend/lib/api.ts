export type BookingStatus = "pending" | "confirmed" | "paid";

// Bookings, Appointments - Reservas

export interface Booking {
  id: number;
  date: string;
  time: string;
  status: BookingStatus;
  customerId: number;
  businessId: number;
  serviceName: string;
}

export interface CreateBookingDto {
  date: string;
  time: string;
  status: BookingStatus;
  customerId: number;
  businessId: number;
  serviceName: string;
}

export interface UpdateBookingDto {
  date?: string;
  time?: string;
  status?: BookingStatus;
  customerId?: number;
  businessId?: number;
  serviceName?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// 🎛️ AUTH HELPERS: Extract token from cookies and create headers
async function getAuthToken(): Promise<string | undefined> {
  if (typeof window !== "undefined") {
    // Client-side: parse document.cookie
    const match = document.cookie.match(/(^|;\s*)ordy_auth=([^;]*)/);
    return match ? decodeURIComponent(match[2]) : undefined;
  }
  // Server-side: read using next/headers
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    return cookieStore.get("ordy_auth")?.value;
  } catch {
    return undefined;
  }
}

export interface DecodedToken {
  id: number;
  email: string;
  role: "admin" | "manager" | "standard";
  businessId: number | null;
}

export function getDecodedToken(): DecodedToken | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(/(^|;\s*)ordy_auth=([^;]*)/);
  if (!match) return null;
  const token = decodeURIComponent(match[2]);
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    // decode base64 utf-8 safely
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(decodeURIComponent(escape(window.atob(base64))));
    return payload;
  } catch {
    try {
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch {
      return null;
    }
  }
}

async function getHeaders(customHeaders: Record<string, string> = {}): Promise<HeadersInit> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { ...customHeaders };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// 🎛️ FUNCIÓN AUXILIAR: Extrae el mensaje real del backend para no repetir código
async function handleBackendError(res: Response, defaultMsg: string): Promise<never> {
  let detail = "";
  try {
    // Intentamos leer si el servidor nos mandó un JSON con detalles
    const errorData = await res.json();
    detail = Array.isArray(errorData.message) 
      ? errorData.message.join(", ") 
      : errorData.message;
  } catch {
    try {
      // Si no era un JSON, leemos la respuesta como texto para ver qué dice
      const textData = await res.text();
      detail = textData.slice(0, 100); // Nos quedamos con el primer trozo para que no sature la pantalla
    } catch {
      detail = "No se obtuvo respuesta del servidor";
    }
  }

  // Combinamos el mensaje por defecto con el código de estado (ej: 404) y el detalle real
  const finalMessage = `${defaultMsg} (Código Servidor: ${res.status}). Detalle: ${detail || "Ninguno"}`;
  throw new Error(finalMessage);
}

export async function getAppointments(): Promise<Booking[]> {
  const res = await fetch(`${API_URL}/appointments`, {
    cache: "no-store",
    headers: await getHeaders()
  });
  if (!res.ok) await handleBackendError(res, "Error al obtener las reservas");
  return res.json();
}

export async function createAppointment(data: CreateBookingDto): Promise<Booking> {
  const res = await fetch(`${API_URL}/appointments`, {
    method: "POST",
    headers: await getHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleBackendError(res, "Error al crear la reserva");
  return res.json();
}

export async function updateAppointment(id: number, data: UpdateBookingDto): Promise<Booking> {
  const res = await fetch(`${API_URL}/appointments/${id}`, {
    method: "PATCH",
    headers: await getHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleBackendError(res, "Error al editar la reserva");
  return res.json();
}

export async function deleteAppointment(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/appointments/${id}`, {
    method: "DELETE",
    headers: await getHeaders()
  });
  if (!res.ok) await handleBackendError(res, "Error al eliminar la reserva");
  return res.json();
}

// Customers - Clientes

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  businessId: number | null;    // extracted from nested relation
  businessName?: string | null; // extracted from nested relation
}

export interface CreateCustomerDto {
  name: string;
  phone?: string;
  email: string;
  businessId: number;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}

export async function getCustomers(): Promise<Customer[]> {
  const res = await fetch(`${API_URL}/customers`, {
    cache: "no-store",
    headers: await getHeaders()
  });
  if (!res.ok) await handleBackendError(res, "Error al obtener los clientes");
  const raw = await res.json();
  // The backend returns business as a nested relation object: { business: { id, name } }
  // We normalise it so the frontend can use businessId and businessName directly.
  const data: Customer[] = raw.map((c: any) => ({
    ...c,
    businessId:   c.business?.id   ?? c.businessId   ?? null,
    businessName: c.business?.name ?? c.businessName  ?? null,
  }));
  return data.sort((a, b) => a.id - b.id);
}

export async function createCustomer(data: CreateCustomerDto): Promise<Customer> {
  const res = await fetch(`${API_URL}/customers`, {
    method: "POST",
    headers: await getHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleBackendError(res, "Error al crear el cliente");
  const raw = await res.json();
  return {
    ...raw,
    businessId:   raw.business?.id   ?? raw.businessId   ?? null,
    businessName: raw.business?.name ?? raw.businessName  ?? null,
  };
}

export async function updateCustomer(id: number, data: UpdateCustomerDto): Promise<Customer> {
  const res = await fetch(`${API_URL}/customers/${id}`, {
    method: "PATCH",
    headers: await getHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleBackendError(res, "Error al editar el cliente");
  const raw = await res.json();
  return {
    ...raw,
    businessId:   raw.business?.id   ?? raw.businessId   ?? null,
    businessName: raw.business?.name ?? raw.businessName  ?? null,
  };
}

export async function deleteCustomer(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/customers/${id}`, {
    method: "DELETE",
    headers: await getHeaders()
  });
  if (!res.ok) await handleBackendError(res, "Error al eliminar el cliente");
  return res.json();
}

// Payments - Pagos

export type PaymentStatus = "pending" | "paid" | "cancelled";

export interface Payment {
  id: number;
  code: string;
  customerId: number;
  businessId: number;
  amount: number;
  method: string;
  date: string;
  status: PaymentStatus;
}

export interface CreatePaymentDto {
  code: string;
  customerId: number;
  businessId: number;
  amount: number;
  method: string;
  date: string;
  status: PaymentStatus;
}

export interface UpdatePaymentDto extends Partial<CreatePaymentDto> {}

export async function getPayments(): Promise<Payment[]> {
  const res = await fetch(`${API_URL}/payments`, {
    cache: "no-store",
    headers: await getHeaders()
  });
  if (!res.ok) await handleBackendError(res, "Error al obtener los pagos");
  const data: Payment[] = await res.json();
  return data.sort((a, b) => a.id - b.id);
}

export async function createPayment(data: CreatePaymentDto): Promise<Payment> {
  const res = await fetch(`${API_URL}/payments`, {
    method: "POST",
    headers: await getHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleBackendError(res, "Error al crear el pago");
  return res.json();
}

export async function updatePayment(id: number, data: UpdatePaymentDto): Promise<Payment> {
  const res = await fetch(`${API_URL}/payments/${id}`, {
    method: "PATCH",
    headers: await getHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleBackendError(res, "Error al editar el pago");
  return res.json();
}

export async function deletePayment(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/payments/${id}`, {
    method: "DELETE",
    headers: await getHeaders()
  });
  if (!res.ok) await handleBackendError(res, "Error al eliminar el pago");
  return res.json();
}

// Businesses - Negocios

export interface Business {
  id: number;
  name: string;
  address?: string;
  phone?: string;
}

export interface CreateBusinessDto {
  name: string;
  address?: string;
  phone?: string;
}

export interface UpdateBusinessDto {
  name?: string;
  address?: string;
  phone?: string;
}

export async function getBusinesses(): Promise<Business[]> {
  const res = await fetch(`${API_URL}/business`, {
    cache: "no-store",
    headers: await getHeaders()
  });
  if (!res.ok) await handleBackendError(res, "Error al obtener los negocios");
  const data: Business[] = await res.json();
  return data.sort((a, b) => a.id - b.id);
}

export async function createBusiness(data: CreateBusinessDto): Promise<Business> {
  const res = await fetch(`${API_URL}/business`, {
    method: "POST",
    headers: await getHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleBackendError(res, "Error al crear el negocio");
  return res.json();
}

// Note: update and delete businesses are not defined in the backend API,
// but stubbed here for type compatibility.
export async function updateBusiness(id: number, data: UpdateBusinessDto): Promise<Business> {
  const res = await fetch(`${API_URL}/business/${id}`, {
    method: "PATCH",
    headers: await getHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleBackendError(res, "Error al editar el negocio");
  return res.json();
}

export async function deleteBusiness(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/business/${id}`, {
    method: "DELETE",
    headers: await getHeaders()
  });
  if (!res.ok) await handleBackendError(res, "Error al eliminar el negocio");
  return res.json();
}

// Services - Servicios

export interface Service {
  id: number;
  name: string;
  price: number;
  isActive: boolean;
  businessId: number | null;
  businessName?: string | null;
}

export interface CreateServiceDto {
  name: string;
  price: number;
  isActive?: boolean;
  businessId: number;
}

export interface UpdateServiceDto extends Partial<CreateServiceDto> {}

export async function getServices(): Promise<Service[]> {
  const res = await fetch(`${API_URL}/services`, {
    cache: "no-store",
    headers: await getHeaders()
  });
  if (!res.ok) await handleBackendError(res, "Error al obtener los servicios");
  const raw = await res.json();
  const data: Service[] = raw.map((s: any) => ({
    ...s,
    businessId: s.business?.id ?? s.businessId ?? null,
    businessName: s.business?.name ?? s.businessName ?? null,
  }));
  return data.sort((a, b) => a.id - b.id);
}

export async function createService(data: CreateServiceDto): Promise<Service> {
  const res = await fetch(`${API_URL}/services`, {
    method: "POST",
    headers: await getHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleBackendError(res, "Error al crear el servicio");
  const raw = await res.json();
  return {
    ...raw,
    businessId: raw.business?.id ?? raw.businessId ?? null,
    businessName: raw.business?.name ?? raw.businessName ?? null,
  };
}

export async function updateService(id: number, data: UpdateServiceDto): Promise<Service> {
  const res = await fetch(`${API_URL}/services/${id}`, {
    method: "PATCH",
    headers: await getHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleBackendError(res, "Error al editar el servicio");
  const raw = await res.json();
  return {
    ...raw,
    businessId: raw.business?.id ?? raw.businessId ?? null,
    businessName: raw.business?.name ?? raw.businessName ?? null,
  };
}

export async function deleteService(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/services/${id}`, {
    method: "DELETE",
    headers: await getHeaders()
  });
  if (!res.ok) await handleBackendError(res, "Error al eliminar el servicio");
  return res.json();
}

// Users - Usuarios

export type UserRole = "admin" | "manager" | "standard";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  businessId: number | null;
  businessName?: string | null;
}

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: UserRole;
  businessId?: number;
}

export interface UpdateUserDto extends Partial<CreateUserDto> {}

export async function getUsers(): Promise<User[]> {
  const res = await fetch(`${API_URL}/users`, {
    cache: "no-store",
    headers: await getHeaders()
  });
  if (!res.ok) await handleBackendError(res, "Error al obtener los usuarios");
  const raw = await res.json();
  const data: User[] = raw.map((u: any) => ({
    ...u,
    businessId: u.business?.id ?? u.businessId ?? null,
    businessName: u.business?.name ?? u.businessName ?? null,
  }));
  return data.sort((a, b) => a.id - b.id);
}

export async function createUser(data: CreateUserDto): Promise<User> {
  const res = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: await getHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleBackendError(res, "Error al crear el usuario");
  const raw = await res.json();
  return {
    ...raw,
    businessId: raw.business?.id ?? raw.businessId ?? null,
    businessName: raw.business?.name ?? raw.businessName ?? null,
  };
}

export async function updateUser(id: number, data: UpdateUserDto): Promise<User> {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: "PATCH",
    headers: await getHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleBackendError(res, "Error al editar el usuario");
  const raw = await res.json();
  return {
    ...raw,
    businessId: raw.business?.id ?? raw.businessId ?? null,
    businessName: raw.business?.name ?? raw.businessName ?? null,
  };
}

export async function deleteUser(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: "DELETE",
    headers: await getHeaders()
  });
  if (!res.ok) await handleBackendError(res, "Error al eliminar el usuario");
  return res.json();
}