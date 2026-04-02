import { prisma } from './prisma';
import { startOfDay, addDays, format, setHours, setMinutes, isBefore, addMinutes } from 'date-fns';

export interface BusinessHours {
  open: string; // "HH:mm"
  close: string; // "HH:mm"
  enabled: boolean;
}

export type WeeklyAvailability = Record<string, BusinessHours>;

/**
 * Generates available slots for a professional on a given date.
 * Accounts for service availability, existing paid bookings, and buffer times.
 */
export async function generateAvailableSlots(
  professionalId: string,
  serviceId: string,
  dateStr: string // "YYYY-MM-DD"
) {
  const targetDate = startOfDay(new Date(dateStr));
  const tomorrow = startOfDay(addDays(new Date(), 1));

  // 1. Enforce "No same-day bookings"
  if (isBefore(targetDate, tomorrow)) {
    return [];
  }

  // 2. Fetch Professional and Service data
  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: professionalId },
    select: { availability: true, serviceAvailability: true }
  });

  const service = await prisma.professionalService.findUnique({
    where: { id: serviceId },
    select: { durationOverride: true, bufferTime: true, service: { select: { duration: true } } }
  });

  if (!profile || !service) return [];

  // Use serviceAvailability if present, otherwise fallback to business hours
  const availabilityRaw = profile.serviceAvailability || profile.availability;
  if (!availabilityRaw) return [];

  let availability: WeeklyAvailability;
  try {
    availability = JSON.parse(availabilityRaw);
  } catch {
    return [];
  }

  const dayOfWeek = format(targetDate, 'EEEE').toLowerCase();
  const dayHours = availability[dayOfWeek];

  if (!dayHours || !dayHours.enabled) return [];

  // 3. Fetch conflicting bookings (PAID or IN_PERSON)
  // According to requirement: slot is only unavailable if someone has PAID or it's a confirmed IN_PERSON booking.
  const existingBookings = await prisma.booking.findMany({
    where: {
      professionalId,
      bookingDate: {
        gte: targetDate,
        lt: addDays(targetDate, 1)
      },
      OR: [
        { paymentStatus: 'PAID' },
        { paymentMethod: 'IN_PERSON', status: 'CONFIRMED' }
      ]
    },
    select: { bookingDate: true, endTime: true }
  });

  // 4. Generate Slots
  const slots: string[] = [];
  const duration = service.durationOverride || service.service.duration;
  const buffer = service.bufferTime;
  const totalSessionMinutes = duration + buffer;

  const [openH, openM] = dayHours.open.split(':').map(Number);
  const [closeH, closeM] = dayHours.close.split(':').map(Number);

  let currentSlot = setMinutes(setHours(targetDate, openH), openM);
  const endLimit = setMinutes(setHours(targetDate, closeH), closeM);

  while (isBefore(addMinutes(currentSlot, duration), endLimit)) {
    const slotEnd = addMinutes(currentSlot, duration);
    
    // Check for overlap with existing confirmed bookings
    const isOverlapping = existingBookings.some(booking => {
      const bStart = new Date(booking.bookingDate);
      const bEnd = booking.endTime ? new Date(booking.endTime) : addMinutes(bStart, duration); // fallback
      
      // Overlap condition: (StartA < EndB) && (EndA > StartB)
      return currentSlot < bEnd && slotEnd > bStart;
    });

    if (!isOverlapping) {
      slots.push(format(currentSlot, 'HH:mm'));
    }

    // Advance by total session time (duration + buffer) or a fixed interval (e.g. 30 mins)
    // To make it professional, we'll advance by the session + buffer
    currentSlot = addMinutes(currentSlot, totalSessionMinutes);
  }

  return slots;
}

/**
 * Checks if a specific slot is still available for booking.
 */
export async function isSlotAvailable(
  professionalId: string,
  serviceId: string,
  bookingDate: Date,
  duration: number
) {
  const endTime = addMinutes(bookingDate, duration);

  const conflict = await prisma.booking.findFirst({
    where: {
      professionalId,
      OR: [
        { paymentStatus: 'PAID' },
        { paymentMethod: 'IN_PERSON', status: 'CONFIRMED' }
      ],
      AND: [
        { bookingDate: { lt: endTime } },
        { endTime: { gt: bookingDate } }
      ]
    }
  });

  return !conflict;
}
