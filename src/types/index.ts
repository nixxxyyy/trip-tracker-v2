export interface Vehicle {
  make: string;
  model: string;
  year: number;
  name?: string;
  trim?: string;
  licensePlate?: string;
  color?: string;
  vin?: string;
  fuelTankCapacity: number; // liters
  initialOdometer: number; // km
  defaultFuelConsumption?: number; // L/100km
  defaultCategory?: string;
  fuelType?: string;
  purchasePrice?: number;
  purchaseDate?: string;
  insuranceExpiry?: string;
  registrationExpiry?: string;
  warrantyExpiry?: string;
  photo?: string; // base64 data URL
  notes?: string;
}

export interface Trip {
  id: string;
  date: string;
  startOdometer?: number;
  endOdometer?: number;
  distance: number; // km
  category: string;
  purpose?: string;
  startLocation?: string;
  endLocation?: string;
  duration?: number; // minutes
  fuelUsed?: number;
  notes?: string;
  createdAt: string;
}

export interface FillUp {
  id: string;
  date: string;
  odometer: number;
  liters: number;
  pricePerUnit: number; // currency per liter
  discount?: number; // cents per liter
  totalCost: number;
  station?: string;
  fuelGrade?: string;
  isFull: boolean;
  fuelEconomy?: number; // L/100km (or mpg)
  notes?: string;
  createdAt: string;
}

export interface MaintenanceReminder {
  type: 'date' | 'distance' | 'both';
  dueDate?: string;
  dueOdometer?: number;
}

export interface Maintenance {
  id: string;
  date: string;
  odometer?: number;
  type: string;
  description?: string;
  cost?: number;
  shop?: string;
  nextDueKm?: number;
  nextDueDate?: string;
  notes?: string;
  createdAt: string;
}

export interface VehicleCost {
  id: string;
  date: string;
  category: "maintenance" | "tires" | "insurance" | "registration" | "other";
  description: string;
  amount: number;
  notes?: string;
  createdAt: string;
}

export interface Units {
  distance: "miles" | "km";
  fuelEfficiency: "mpg" | "L/100km";
  volume: "gallons" | "liters";
  currency: string;
}

export interface Settings {
  vehicleInfo?: Vehicle;
  theme: "light" | "dark" | "system";
  units: Units;
  categories: string[];
  lastBackup?: string;
  defaultCategory?: string;
}

export interface LifetimeStats {
  totalDistance: number;
  totalFuelUsed: number;
  totalFuelCost: number;
  totalDriveTime: number; // minutes
  totalTrips: number;
  avgFuelConsumption: number; // L/100km
  costPerKm: number;
}

export interface StationStat {
  station: string;
  avgPrice: number;
  totalSpend: number;
  visits: number;
}

export interface StatsResult {
  totalTrips: number;
  totalDistance: number;
  totalFuelCost: number;
  costPerDistance: number;
  avgFuelEconomy: number;
  currentMonthSpend: number;
  lastMonthSpend: number;
  monthlySpend: { month: string; spend: number }[];
  monthlyDistance: { month: string; distance: number }[];
  monthlyCostPerKm: { month: string; costPerKm: number }[];
  fuelEconomyHistory: { date: string; value: number }[];
  fuelUsageHistory: { date: string; liters: number }[];
  categoryDistance: { name: string; value: number }[];
  categoryFuelCost: { name: string; value: number }[];
  categoryFuelUsed: { name: string; value: number }[];
  categoryTripCount: { name: string; value: number }[];
  recentTrips: Trip[];
  recentFillUps: FillUp[];
  lifetime: LifetimeStats;
  estimatedFuelRemaining?: number;
  estimatedRangeRemaining?: number;
  stationStats: StationStat[];
  // v2 additions
  currentMonthDistance: number;
  currentMonthTrips: number;
  longestTrip?: Trip;
  mostExpensiveMonth?: { month: string; spend: number };
  cheapestStation?: StationStat;
  avgTripDistance: number;
  yearlySpend: { year: string; spend: number }[];
}
