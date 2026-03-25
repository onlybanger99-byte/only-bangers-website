export interface Barber {
  id: number;
  name: string;
  specialty: string;
  image: string;
}

export const barbers: Barber[] = [
  {
    id: 1,
    name: "Antonio Prince",
    specialty: "Founder & Lead Barber",
    image: "/images/antonio-prince.jpg"
  },
  {
    id: 2,
    name: "Michael Johnson",
    specialty: "Fade Specialist",
    image: "/images/barber-placeholder.jpg"
  },
  {
    id: 3,
    name: "David Williams",
    specialty: "Beard Expert",
    image: "/images/barber-placeholder.jpg"
  }
];

// Mock availability: for demo, all dates are available except weekends
export function getAvailableTimes(barberId: number, date: string): string[] {
  // Simulate some times – in real app you'd fetch from API
  const availableTimes = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
  // Mock: return first 3 times
  return availableTimes.slice(0, 3);
}

export function isDateAvailable(date: string): boolean {
  const day = new Date(date).getDay();
  // Sunday = 0, Saturday = 6
  return day !== 0 && day !== 6; // only Mon-Fri available
}