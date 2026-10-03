export interface Service {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
}

export interface Business {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  opensAt: string;
  closesAt: string;
  workingDays: number[];
  services: Service[];
}
