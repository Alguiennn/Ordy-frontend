import BookingsClient from "./BookingsClient";
import { getAppointments } from "@/lib/api";

export default async function BookingsPage() {
  const bookings = await getAppointments();

  return <BookingsClient initialBookings={bookings} />;
}