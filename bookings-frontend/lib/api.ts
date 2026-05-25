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

export interface Business {
  id: number;
  name: string;
}

export interface Customer {
  id: number;
  code?: string;
  name: string;
  phone: string;
  email: string;
  businessId?: number;
  business?: Business;
}

export interface CreateCustomerDto {
  code?: string;
  name: string;
  phone: string;
  email: string;
  businessId: number;
}

export interface UpdateCustomerDto {
  code?: string;
  name?: string;
  phone?: string;
  email?: string;
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

// Utility to make fetch requests with timeout and better error handling
async function apiCall<T>(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<T> {
  const timeout = options.timeout || 30000;
  const controller = new AbortController();
  
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `Error ${response.status}`;
      
      try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } else {
          const text = await response.text();
          if (text) errorMessage = text;
        }
      } catch (e) {
        // Use default error message if parsing fails
      }

      throw new Error(`${errorMessage}`);
    }

    return await response.json() as T;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('No se puede conectar con el servidor. Verifica tu conexión de internet.');
    }
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado. El servidor no responde.');
    }
    
    throw error;
  }
}

// ─── Appointments ────────────────────────────────────────────────────────────

export async function getAppointments(): Promise<Booking[]> {
  return apiCall<Booking[]>(`${API_URL}/appointments`, {
    cache: "no-store",
  });
}

export async function createAppointment(data: CreateBookingDto): Promise<Booking> {
  // Validate required fields
  if (!data.date || !data.time || !data.customerId || !data.businessId) {
    throw new Error('Faltan campos requeridos para crear la reserva');
  }

  return apiCall<Booking>(`${API_URL}/appointments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}
export async function updatePayment(id: number, data: UpdatePaymentDto): Promise<Payment> {
  if (!id || id <= 0) {
    throw new Error('ID de pago inválido');
  }

  return apiCall<Payment>(`${API_URL}/payments/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function deletePayment(id: number): Promise<{ message: string }> {
  if (!id || id <= 0) {
    throw new Error('ID de pago inválido');
  }

  return apiCall<{ message: string }>(`${API_URL}/payments/${id}`, {
    method: "DELETE",
  });
}
export async function updateAppointment(
  id: number,
  data: UpdateBookingDto
): Promise<Booking> {
  if (!id || id <= 0) {
    throw new Error('ID de reserva inválido');
  }

  return apiCall<Booking>(`${API_URL}/appointments/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function deleteAppointment(id: number): Promise<{ message: string }> {
  if (!id || id <= 0) {
    throw new Error('ID de reserva inválido');
  }

  return apiCall<{ message: string }>(`${API_URL}/appointments/${id}`, {
    method: "DELETE",
  });
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function getPayments(): Promise<Payment[]> {
  try {
    return await apiCall<Payment[]>(`${API_URL}/payments`, {
      cache: "no-store",
    });
  } catch (error) {
    // Fallback to mock data if endpoint is unavailable
    if (error instanceof Error && (error.message.includes('404') || error.message.includes('No se puede conectar'))) {
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
    throw error;
  }
}

export async function createPayment(data: CreatePaymentDto): Promise<Payment> {
  if (!data.amount || !data.customerId || !data.businessId || !data.method) {
    throw new Error('Faltan campos requeridos para crear el pago');
  }

  return apiCall<Payment>(`${API_URL}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function getAppointment(id: number): Promise<Booking> {
  if (!id || id <= 0) {
    throw new Error('ID de reserva inválido');
  }

  return apiCall<Booking>(`${API_URL}/appointments/${id}`, {
    cache: "no-store",
  });
}

export async function getCustomers(): Promise<Customer[]> {
  const data = await apiCall<Customer[] | { value: Customer[] }>(
    `${API_URL}/customers`,
    { cache: 'no-store' }
  );
  
  // Handle both array and wrapped response formats
  return Array.isArray(data) ? data : (data.value || []);
}

export async function createCustomer(data: CreateCustomerDto): Promise<Customer> {
  if (!data.name || !data.phone || !data.email || !data.businessId) {
    throw new Error('Faltan campos requeridos para crear el cliente');
  }

  return apiCall<Customer>(`${API_URL}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export async function updateCustomer(id: number, data: UpdateCustomerDto): Promise<Customer> {
  if (!id || id <= 0) {
    throw new Error('ID de cliente inválido');
  }

  return apiCall<Customer>(`${API_URL}/customers/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export async function deleteCustomer(id: number): Promise<{ message: string }> {
  if (!id || id <= 0) {
    throw new Error('ID de cliente inválido');
  }

  return apiCall<{ message: string }>(`${API_URL}/customers/${id}`, {
    method: 'DELETE',
  });
}

export async function getBusinesses(): Promise<Business[]> {
  const data = await apiCall<Business[] | { value: Business[] }>(
    `${API_URL}/business`,
    { cache: 'no-store' }
  );
  
  // Handle both array and wrapped response formats
  return Array.isArray(data) ? data : (data.value || []);
}