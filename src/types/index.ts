export type VehicleStatus = "active" | "retired" | "sold" | "traded";

export interface Vehicle {
  id: string; // unique per vehicle
  make: string;
  model: string;
  year: number;
  name?: string;
  trim?: string;
  licensePlate?: string;
  color?: string;
  vin?: string;
  fuelTankCapacity: number;
  initialOdometer: number;
  defaultFuelConsumption?: number;
  defaultCategory?: string;
  fuelType?: string;
  status?: VehicleStatus; // default "active"
  purchasePrice?: number;
  purchaseDate?: string;
  saleValue?: number;
  saleDate?: string;
  tradeNotes?: string;
  ownershipNotes?: string;
  insuranceExpiry?: string;
  registrationExpiry?: string;
  warrantyExpiry?: string;
  photo?: string;
  notes?: string;
}

export interface Trip {
  id: string;
  date: string;
  startOdometer?: number;
  endOdometer?: number;
  distance: number;
  category: string;
  purpose?: string;
  startLocation?: string;
  endLocation?: string;
  duration?: number;
  fuelUsed?: number;
  fuelEconomy?: number;
  tripCost?: number;
  notes?: string;
  createdAt: string;
  vehicleId?: string;
}

export interface FillUp {
  id: string;
  date: string;
  odometer: number;
  liters: number;
  pricePerUnit: number;
  discount?: number;
  totalCost: number;
  station?: string;
  fuelGrade?: string;
  isFull: boolean;
  fuelEconomy?: number;
  notes?: string;
  createdAt: string;
  vehicleId?: string;
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
  vehicleId?: string;
}

export interface VehicleCost {
  id: string;
  date: string;
  category: "maintenance" | "tires" | "insurance" | "registration" | "repairs" | "accessories" | "interest" | "other";
  description: string;
  amount: number;
  notes?: string;
  createdAt: string;
  vehicleId?: string;
}

export interface Units {
  distance: "miles" | "km";
  fuelEfficiency: "mpg" | "L/100km";
  volume: "gallons" | "liters";
  currency: string;
}

export interface FuelOverride {
  fuelPercent: number;  // 0-100
  rangeKm: number;
  setAt: string;        // ISO date of when override was set
  afterFillUpId?: string;
}

export interface Settings {
  vehicleInfo?: Vehicle;   // kept for single-vehicle backward compat
  vehicles?: Vehicle[];    // multi-vehicle list
  activeVehicleId?: string;
  theme: "light" | "dark" | "system";
  units: Units;
  categories: string[];
  lastBackup?: string;
  defaultCategory?: string;
  fuelOverride?: FuelOverride;
}

export interface LifetimeStats {
  totalDistance: number;
  totalFuelUsed: number;
  totalFuelCost: number;
  totalDriveTime: number;
  totalTrips: number;
  avgFuelConsumption: number;
  costPerKm: number;
}

export interface StationStat {
  station: string;
  avgPrice: number;
  totalSpend: number;
  visits: number;
}

export interface MonthStats {
  month: string;        // "YYYY-MM"
  label: string;        // "Jan 2025"
  distance: number;
  fuelCost: number;     // fuel consumed cost (allocated to trips)
  fuelPurchased: number;
  fuelEconomy: number;
  costPerKm: number;
  tripCount: number;
  fillUpCount: number;
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
  currentMonthDistance: number;
  currentMonthTrips: number;
  currentMonthFuelEconomy: number;
  currentMonthTripCost: number;
  longestTrip?: Trip;
  mostExpensiveMonth?: { month: string; spend: number };
  cheapestStation?: StationStat;
  avgTripDistance: number;
  yearlySpend: { year: string; spend: number }[];
  allMonths: MonthStats[];
}

export interface OwnershipCostSummary {
  purchasePrice: number;
  maintenance: number;
  fuel: number;
  insurance: number;
  registration: number;
  repairs: number;
  accessories: number;
  interest: number;
  tires: number;
  totalCost: number;
  saleValue: number;
  netCost: number;
  totalKm: number;
  totalDays: number;
  costPerKm: number;
  costPerDay: number;
  totalDepreciation: number;
}
