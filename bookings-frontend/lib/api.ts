export type BookingStatus = "pending" | "confirmed" | "paid";

export type PaymentStatus = "paid" | "pending";

export interface Payment {
  id: number;
  code?: string;
  amount: number;
  method: string;
  status: PaymentStatus;
  date: string;
  customerId?: number;
  businessId?: number;
  customer?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    businessId?: number;
  };
  business?: {
    id: number;
    name: string;
  };
  booking?: {
    serviceName: string;
  };
  bookingId?: number;
}

export interface CreatePaymentDto {
  date: string;
  customerId: number;
  businessId: number;
  amount: number;
  method: string;
  status: PaymentStatus;
}

export interface CreatePaymentDto {
  date: string;
  customerId: number;
  businessId: number;
  amount: number;
  method: string;
  status: PaymentStatus;
}

export interface UpdatePaymentDto {
  amount?: number;
  method?: string;
  status?: PaymentStatus;
  date?: string;
  customerId?: number;
  businessId?: number;
}

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// ─── Appointments ────────────────────────────────────────────────────────────

export async function getAppointments(): Promise<Booking[]> {
  const res = await fetch(`${API_URL}/appointments`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Error al obtener las reservas (${res.status})`);
  }

  return res.json();
}

export async function createAppointment(data: CreateBookingDto): Promise<Booking> {
  const res = await fetch(`${API_URL}/appointments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`Error al crear la reserva (${res.status})`);
  }

  return res.json();
}
export async function updatePayment(id: number, data: UpdatePaymentDto): Promise<Payment> {
  const res = await fetch(`${API_URL}/payments/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    let bodyText: string;
    try {
      bodyText = await res.text();
    } catch (e) {
      bodyText = `Status ${res.status}`;
    }
    const message = bodyText ? `Error al actualizar el pago (${res.status}): ${bodyText}` : `Error al actualizar el pago (${res.status})`;
    throw new Error(message);
  }

  return res.json();
}

export async function deletePayment(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/payments/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    let bodyText: string;
    try {
      bodyText = await res.text();
    } catch (e) {
      bodyText = `Status ${res.status}`;
    }
    const message = bodyText ? `Error al eliminar el pago (${res.status}): ${bodyText}` : `Error al eliminar el pago (${res.status})`;
    throw new Error(message);
  }

  return res.json();
}
export async function updateAppointment(
  id: number,
  data: UpdateBookingDto
): Promise<Booking> {
  const res = await fetch(`${API_URL}/appointments/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`Error al editar la reserva (${res.status})`);
  }

  return res.json();
}

export async function deleteAppointment(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/appointments/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error(`Error al eliminar la reserva (${res.status})`);
  }

  return res.json();
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function getPayments(): Promise<Payment[]> {
  const res = await fetch(`${API_URL}/payments`, {
    cache: "no-store",
  });

  if (res.ok) {
    return res.json();
  }

  if (res.status === 404) {
    console.warn('GET /payments no disponible, usando datos mock de ejemplo.');
    return [
      {
        id: 1,
        amount: 65,
        method: 'Tarjeta',
        status: 'paid',
        date: new Date().toISOString(),
        customerId: 1,
        businessId: 1,
        booking: { serviceName: 'Corte de pelo' },
      },
      {
        id: 2,
        amount: 80,
        method: 'Efectivo',
        status: 'pending',
        date: new Date().toISOString(),
        customerId: 2,
        businessId: 1,
        booking: { serviceName: 'Manicura' },
      },
      {
        id: 3,
        amount: 120,
        method: 'Bizum',
        status: 'paid',
        date: new Date().toISOString(),
        customerId: 3,
        businessId: 2,
        booking: { serviceName: 'Sesión de spa' },
      },
    ];
  }

  throw new Error(`Error al obtener los pagos (${res.status})`);
}

export async function createPayment(data: CreatePaymentDto): Promise<Payment> {
  const res = await fetch(`${API_URL}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    let bodyText: string;
    try {
      bodyText = await res.text();
    } catch (e) {
      bodyText = `Status ${res.status}`;
    }
    const message = bodyText ? `Error al crear el pago (${res.status}): ${bodyText}` : `Error al crear el pago (${res.status})`;
    throw new Error(message);
  }

  return res.json();
}

export async function getAppointment(id: number): Promise<Booking> {
  const res = await fetch(`${API_URL}/appointments/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Error al obtener la reserva (${res.status})`);
  }

  return res.json();
}

export async function getCustomers(): Promise<any[]> {
  const res = await fetch(`${API_URL}/customers`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Error al obtener clientes (${res.status})`);
  const json = await res.json();
  // API returns { value: [...] }
  return json.value || json;
}

export async function getBusinesses(): Promise<any[]> {
  const res = await fetch(`${API_URL}/business`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Error al obtener negocios (${res.status})`);
  const json = await res.json();
  return json.value || json;
}