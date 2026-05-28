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

  const data: Booking[] = await res.json();
  return data.sort((a, b) => a.id - b.id);
  // Combinamos el mensaje por defecto con el código de estado (ej: 404) y el detalle real
  const finalMessage = `${defaultMsg} (Código Servidor: ${res.status}). Detalle: ${detail || "Ninguno"}`;
  throw new Error(finalMessage);
}

export async function getAppointments(): Promise<Booking[]> {
  const res = await fetch(`${API_URL}/appointments`, { cache: "no-store" });
  if (!res.ok) await handleBackendError(res, "Error al obtener las reservas");
  return res.json();
}

export async function createAppointment(data: CreateBookingDto): Promise<Booking> {
  const res = await fetch(`${API_URL}/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleBackendError(res, "Error al crear la reserva");
  return res.json();
}

export async function updateAppointment(id: number, data: UpdateBookingDto): Promise<Booking> {
  const res = await fetch(`${API_URL}/appointments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleBackendError(res, "Error al editar la reserva");
  return res.json();
}

export async function deleteAppointment(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/appointments/${id}`, { method: "DELETE" });
  if (!res.ok) await handleBackendError(res, "Error al eliminar la reserva");
  return res.json();
}

// Customers - Clientes

export interface Customer {
  id: number;
  code: string;
  name: string;
  phone: string;
  email: string;
  businessId: number;
}

export interface CreateCustomerDto {
  code: string;
  name: string;
  phone?: string;
  email: string;
  businessId: number;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}

export async function getCustomers(): Promise<Customer[]> {
  const res = await fetch(`${API_URL}/customers`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al obtener los clientes");
  const data: Customer[] = await res.json();
  return data.sort((a, b) => a.id - b.id);
}

export async function createCustomer(data: CreateCustomerDto): Promise<Customer> {
  const res = await fetch(`${API_URL}/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleBackendError(res, "Error al crear el cliente");
  return res.json();
}

export async function updateCustomer(id: number, data: UpdateCustomerDto): Promise<Customer> {
  const res = await fetch(`${API_URL}/customers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleBackendError(res, "Error al editar el cliente");
  return res.json();
}

export async function deleteCustomer(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/customers/${id}`, { method: "DELETE" });
  if (!res.ok) await handleBackendError(res, "Error al eliminar el cliente");
  return res.json();
}

// Payments - Pagos

export type PaymentStatus = "pending" | "paid";

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
  const res = await fetch(`${API_URL}/payments`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al obtener los pagos");
  const data: Payment[] = await res.json();
  return data.sort((a, b) => a.id - b.id);
}

// 🛠️ Optimizada la captura de errores en pagos
export async function createPayment(data: CreatePaymentDto): Promise<Payment> {
  const res = await fetch(`${API_URL}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleBackendError(res, "Error al crear el pago");
  return res.json();
}

export async function updatePayment(id: number, data: UpdatePaymentDto): Promise<Payment> {
  const res = await fetch(`${API_URL}/payments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleBackendError(res, "Error al editar el pago");
  return res.json();
}

export async function deletePayment(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/payments/${id}`, { method: "DELETE" });
  if (!res.ok) await handleBackendError(res, "Error al eliminar el pago");
  return res.json();
}

// Businesses - Negocios

export interface Business {
  id: number;
  name: string;
}

export interface CreateBusinessDto {
  name: string;
}

export interface UpdateBusinessDto {
  name?: string;
}

export async function getBusinesses(): Promise<Business[]> {
  const res = await fetch(`${API_URL}/business`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al obtener los negocios");
  const data: Business[] = await res.json();
  return data.sort((a, b) => a.id - b.id);
}

export async function createBusiness(data: CreateBusinessDto): Promise<Business> {
  const res = await fetch(`${API_URL}/business`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear el negocio");
  return res.json();
}

export async function updateBusiness(id: number, data: UpdateBusinessDto): Promise<Business> {
  const res = await fetch(`${API_URL}/business/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al editar el negocio");
  return res.json();
}

export async function deleteBusiness(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/business/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar el negocio");
  return res.json();
}