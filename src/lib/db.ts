import { openDB as idbOpenDB, DBSchema } from "idb";
import type { Trip, FillUp, Settings, Vehicle, Maintenance, VehicleCost, StatsResult, LifetimeStats } from "../types";
import { format, subMonths, startOfMonth, endOfMonth, isAfter, isBefore } from "date-fns";

interface TripTrackerDB extends DBSchema {
  trips: {
    key: string;
    value: Trip;
    indexes: { date: string; category: string };
  };
  fillups: {
    key: string;
    value: FillUp;
    indexes: { date: string };
  };
  settings: {
    key: string;
    value: any;
  };
  maintenance: {
    key: string;
    value: Maintenance;
    indexes: { date: string };
  };
  vehiclecosts: {
    key: string;
    value: VehicleCost;
    indexes: { date: string; category: string };
  };
}

const DB_NAME = "trip-tracker-db";
const DB_VERSION = 2;

export async function openDB() {
  return idbOpenDB<TripTrackerDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const tripStore = db.createObjectStore("trips", { keyPath: "id" });
        tripStore.createIndex("date", "date");
        tripStore.createIndex("category", "category");

        const fillUpStore = db.createObjectStore("fillups", { keyPath: "id" });
        fillUpStore.createIndex("date", "date");

        db.createObjectStore("settings", { keyPath: "key" });
      }
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains("maintenance")) {
          const ms = db.createObjectStore("maintenance", { keyPath: "id" });
          ms.createIndex("date", "date");
        }
        if (!db.objectStoreNames.contains("vehiclecosts")) {
          const vs = db.createObjectStore("vehiclecosts", { keyPath: "id" });
          vs.createIndex("date", "date");
          vs.createIndex("category", "category");
        }
      }
    },
  });
}

// ─── Trips ────────────────────────────────────────────────────────────────────
export async function getTrips(): Promise<Trip[]> {
  const db = await openDB();
  const trips = await db.getAllFromIndex("trips", "date");
  return trips.reverse();
}

export async function addTrip(trip: Trip): Promise<void> {
  const db = await openDB();
  await db.put("trips", trip);
}

export async function updateTrip(trip: Trip): Promise<void> {
  const db = await openDB();
  await db.put("trips", trip);
}

export async function deleteTrip(id: string): Promise<void> {
  const db = await openDB();
  await db.delete("trips", id);
}

// ─── FillUps ──────────────────────────────────────────────────────────────────
export async function getFillUps(): Promise<FillUp[]> {
  const db = await openDB();
  const fillUps = await db.getAllFromIndex("fillups", "date");
  return fillUps.reverse();
}

export async function addFillUp(fillUp: FillUp): Promise<void> {
  const db = await openDB();
  await db.put("fillups", fillUp);
}

export async function updateFillUp(fillUp: FillUp): Promise<void> {
  const db = await openDB();
  await db.put("fillups", fillUp);
}

export async function deleteFillUp(id: string): Promise<void> {
  const db = await openDB();
  await db.delete("fillups", id);
}

// ─── Maintenance ──────────────────────────────────────────────────────────────
export async function getMaintenance(): Promise<Maintenance[]> {
  const db = await openDB();
  const records = await db.getAllFromIndex("maintenance", "date");
  return records.reverse();
}

export async function addMaintenance(record: Maintenance): Promise<void> {
  const db = await openDB();
  await db.put("maintenance", record);
}

export async function updateMaintenance(record: Maintenance): Promise<void> {
  const db = await openDB();
  await db.put("maintenance", record);
}

export async function deleteMaintenance(id: string): Promise<void> {
  const db = await openDB();
  await db.delete("maintenance", id);
}

// ─── Vehicle Costs ────────────────────────────────────────────────────────────
export async function getVehicleCosts(): Promise<VehicleCost[]> {
  const db = await openDB();
  const records = await db.getAllFromIndex("vehiclecosts", "date");
  return records.reverse();
}

export async function addVehicleCost(record: VehicleCost): Promise<void> {
  const db = await openDB();
  await db.put("vehiclecosts", record);
}

export async function updateVehicleCost(record: VehicleCost): Promise<void> {
  const db = await openDB();
  await db.put("vehiclecosts", record);
}

export async function deleteVehicleCost(id: string): Promise<void> {
  const db = await openDB();
  await db.delete("vehiclecosts", id);
}

// ─── Settings ─────────────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = ["Commute", "Business", "Personal", "Medical", "Moving", "Partner"];

const defaultSettings: Settings = {
  theme: "system",
  units: { distance: "km", fuelEfficiency: "L/100km", volume: "liters", currency: "$" },
  categories: DEFAULT_CATEGORIES,
};

export async function getSettings(): Promise<Settings> {
  const db = await openDB();
  const theme = await db.get("settings", "theme");
  const units = await db.get("settings", "units");
  const categories = await db.get("settings", "categories");
  const vehicleInfo = await db.get("settings", "vehicleInfo");
  const lastBackup = await db.get("settings", "lastBackup");
  const defaultCategory = await db.get("settings", "defaultCategory");

  return {
    theme: theme?.value ?? defaultSettings.theme,
    units: units?.value ?? defaultSettings.units,
    categories: categories?.value ?? defaultSettings.categories,
    vehicleInfo: vehicleInfo?.value,
    lastBackup: lastBackup?.value,
    defaultCategory: defaultCategory?.value,
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("settings", "readwrite");
  await tx.store.put({ key: "theme", value: settings.theme });
  await tx.store.put({ key: "units", value: settings.units });
  await tx.store.put({ key: "categories", value: settings.categories });
  if (settings.vehicleInfo) await tx.store.put({ key: "vehicleInfo", value: settings.vehicleInfo });
  if (settings.lastBackup) await tx.store.put({ key: "lastBackup", value: settings.lastBackup });
  if (settings.defaultCategory !== undefined) await tx.store.put({ key: "defaultCategory", value: settings.defaultCategory });
  await tx.done;
}

export async function getCategories(): Promise<string[]> {
  const s = await getSettings();
  return s.categories;
}

export async function saveCategories(categories: string[]): Promise<void> {
  const db = await openDB();
  await db.put("settings", { key: "categories", value: categories });
}

export async function getVehicle(): Promise<Vehicle | null> {
  const s = await getSettings();
  return s.vehicleInfo ?? null;
}

export async function saveVehicle(vehicle: Vehicle): Promise<void> {
  const db = await openDB();
  await db.put("settings", { key: "vehicleInfo", value: vehicle });
}

// ─── Backup / Restore ─────────────────────────────────────────────────────────
export async function exportAllData() {
  return {
    trips: await getTrips(),
    fillUps: await getFillUps(),
    maintenance: await getMaintenance(),
    vehicleCosts: await getVehicleCosts(),
    settings: await getSettings(),
  };
}

export async function importAllData(data: {
  trips: Trip[];
  fillUps: FillUp[];
  maintenance?: Maintenance[];
  vehicleCosts?: VehicleCost[];
  settings: Settings;
}): Promise<void> {
  const db = await openDB();
  const stores: ("trips" | "fillups" | "settings" | "maintenance" | "vehiclecosts")[] = [
    "trips", "fillups", "settings", "maintenance", "vehiclecosts"
  ];
  const tx = db.transaction(stores, "readwrite");
  await tx.objectStore("trips").clear();
  await tx.objectStore("fillups").clear();
  await tx.objectStore("maintenance").clear();
  await tx.objectStore("vehiclecosts").clear();

  for (const t of data.trips) await tx.objectStore("trips").put(t);
  for (const f of data.fillUps) await tx.objectStore("fillups").put(f);
  for (const m of data.maintenance ?? []) await tx.objectStore("maintenance").put(m);
  for (const v of data.vehicleCosts ?? []) await tx.objectStore("vehiclecosts").put(v);

  await tx.objectStore("settings").put({ key: "theme", value: data.settings.theme });
  await tx.objectStore("settings").put({ key: "units", value: data.settings.units });
  await tx.objectStore("settings").put({ key: "categories", value: data.settings.categories });
  if (data.settings.vehicleInfo)
    await tx.objectStore("settings").put({ key: "vehicleInfo", value: data.settings.vehicleInfo });
  if (data.settings.lastBackup)
    await tx.objectStore("settings").put({ key: "lastBackup", value: data.settings.lastBackup });

  await tx.done;
}

export async function mergeTripsFromCSV(incoming: Trip[]): Promise<{ added: number; skipped: number }> {
  const existing = await getTrips();
  const existingIds = new Set(existing.map(t => t.id));
  let added = 0, skipped = 0;
  for (const t of incoming) {
    if (existingIds.has(t.id)) { skipped++; continue; }
    await addTrip(t);
    added++;
  }
  return { added, skipped };
}

export async function mergeFillUpsFromCSV(incoming: FillUp[]): Promise<{ added: number; skipped: number }> {
  const existing = await getFillUps();
  const existingIds = new Set(existing.map(f => f.id));
  let added = 0, skipped = 0;
  for (const f of incoming) {
    if (existingIds.has(f.id)) { skipped++; continue; }
    await addFillUp(f);
    added++;
  }
  return { added, skipped };
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export async function getStatsForRange(_startDate: string, _endDate: string): Promise<StatsResult> {
  const [trips, fillUps, vehicle] = await Promise.all([getTrips(), getFillUps(), getVehicle()]);

  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  // Lifetime stats
  const totalDistance = trips.reduce((s, t) => s + (t.distance || 0), 0);
  const totalFuelUsed = fillUps.reduce((s, f) => s + (f.liters || 0), 0);
  const totalFuelCost = fillUps.reduce((s, f) => s + (f.totalCost || 0), 0);
  const totalDriveTime = trips.reduce((s, t) => s + (t.duration || 0), 0);
  const totalTrips = trips.length;
  const avgFuelConsumption = totalDistance > 0 ? (totalFuelUsed / totalDistance) * 100 : 0;
  const costPerKm = totalDistance > 0 ? totalFuelCost / totalDistance : 0;

  const lifetime: LifetimeStats = {
    totalDistance, totalFuelUsed, totalFuelCost,
    totalDriveTime, totalTrips, avgFuelConsumption, costPerKm,
  };

  // Monthly aggregates (last 6 months)
  const monthlySpend: { month: string; spend: number }[] = [];
  const monthlyDistance: { month: string; distance: number }[] = [];
  const monthlyCostPerKm: { month: string; costPerKm: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(subMonths(now, i));
    const label = format(monthStart, "MMM");

    const monthFillUps = fillUps.filter(f => {
      const d = new Date(f.date);
      return !isBefore(d, monthStart) && !isAfter(d, monthEnd);
    });
    const monthTrips = trips.filter(t => {
      const d = new Date(t.date);
      return !isBefore(d, monthStart) && !isAfter(d, monthEnd);
    });

    const spend = monthFillUps.reduce((s, f) => s + f.totalCost, 0);
    const dist = monthTrips.reduce((s, t) => s + t.distance, 0);

    monthlySpend.push({ month: label, spend: parseFloat(spend.toFixed(2)) });
    monthlyDistance.push({ month: label, distance: parseFloat(dist.toFixed(1)) });
    monthlyCostPerKm.push({ month: label, costPerKm: dist > 0 ? parseFloat((spend / dist).toFixed(4)) : 0 });
  }

  // Fuel economy history (last 10 full fill-ups with calculated economy)
  const fullFills = fillUps.filter(f => f.isFull && f.fuelEconomy != null);
  const fuelEconomyHistory = fullFills.slice(0, 10).map(f => ({
    date: format(new Date(f.date), "MMM d"),
    value: f.fuelEconomy!,
  })).reverse();

  // Fuel usage history (last 6 fill-ups)
  const fuelUsageHistory = fillUps.slice(0, 6).map(f => ({
    date: format(new Date(f.date), "MMM d"),
    liters: parseFloat(f.liters.toFixed(2)),
  })).reverse();

  // Current month spend
  const currentMonthSpend = fillUps
    .filter(f => !isBefore(new Date(f.date), thisMonthStart))
    .reduce((s, f) => s + f.totalCost, 0);

  const lastMonthSpend = fillUps
    .filter(f => {
      const d = new Date(f.date);
      return !isBefore(d, lastMonthStart) && !isAfter(d, lastMonthEnd);
    })
    .reduce((s, f) => s + f.totalCost, 0);

  // Category stats
  const catMap = trips.reduce((acc, t) => {
    const c = t.category;
    if (!acc[c]) acc[c] = { distance: 0, fuelCost: 0, fuelUsed: 0, trips: 0 };
    acc[c].distance += t.distance;
    acc[c].trips += 1;
    return acc;
  }, {} as Record<string, { distance: number; fuelCost: number; fuelUsed: number; trips: number }>);

  // Assign fill-up costs to the trip category that matches the same day (simplified)
  const fillUpsByDate: Record<string, FillUp[]> = {};
  fillUps.forEach(f => {
    const day = f.date.split("T")[0];
    if (!fillUpsByDate[day]) fillUpsByDate[day] = [];
    fillUpsByDate[day].push(f);
  });

  const categoryDistance = Object.entries(catMap).map(([name, v]) => ({ name, value: parseFloat(v.distance.toFixed(1)) }));
  const categoryFuelCost = Object.entries(catMap).map(([name, v]) => ({ name, value: parseFloat(v.fuelCost.toFixed(2)) }));
  const categoryFuelUsed = Object.entries(catMap).map(([name, v]) => ({ name, value: parseFloat(v.fuelUsed.toFixed(2)) }));
  const categoryTripCount = Object.entries(catMap).map(([name, v]) => ({ name, value: v.trips }));

  // Station stats
  const stationMap: Record<string, { totalSpend: number; visits: number; totalPrice: number }> = {};
  fillUps.forEach(f => {
    const s = f.station || "Unknown";
    if (!stationMap[s]) stationMap[s] = { totalSpend: 0, visits: 0, totalPrice: 0 };
    stationMap[s].totalSpend += f.totalCost;
    stationMap[s].visits += 1;
    stationMap[s].totalPrice += f.pricePerUnit;
  });
  const stationStats = Object.entries(stationMap).map(([station, v]) => ({
    station,
    avgPrice: parseFloat((v.totalPrice / v.visits).toFixed(3)),
    totalSpend: parseFloat(v.totalSpend.toFixed(2)),
    visits: v.visits,
  })).sort((a, b) => b.totalSpend - a.totalSpend);

  // Estimated fuel remaining
  let estimatedFuelRemaining: number | undefined;
  let estimatedRangeRemaining: number | undefined;

  const lastFullFillUp = fillUps.find(f => f.isFull);
  if (lastFullFillUp && vehicle?.fuelTankCapacity && avgFuelConsumption > 0) {
    const distanceSinceFill = trips
      .filter(t => t.date > lastFullFillUp.date)
      .reduce((s, t) => s + t.distance, 0);
    const fuelUsedSinceFill = (distanceSinceFill / 100) * avgFuelConsumption;
    const remaining = vehicle.fuelTankCapacity - fuelUsedSinceFill;
    estimatedFuelRemaining = Math.max(0, parseFloat(remaining.toFixed(1)));
    estimatedRangeRemaining = Math.max(0, parseFloat(((estimatedFuelRemaining / avgFuelConsumption) * 100).toFixed(0)));
  }

  // ── v2 additions ──────────────────────────────────────────────────────────

  // Current month stats
  const currentMonthTrips = trips.filter(t => !isBefore(new Date(t.date), thisMonthStart)).length;
  const currentMonthDistance = trips
    .filter(t => !isBefore(new Date(t.date), thisMonthStart))
    .reduce((s, t) => s + t.distance, 0);

  // Longest trip
  const longestTrip = trips.length > 0
    ? trips.reduce((best, t) => t.distance > best.distance ? t : best)
    : undefined;

  // Most expensive month
  const mostExpensiveMonth = monthlySpend.length > 0
    ? monthlySpend.reduce((best, m) => m.spend > best.spend ? m : best)
    : undefined;

  // Cheapest station (with at least 2 visits for reliability)
  const cheapestStation = stationStats.filter(s => s.visits >= 2 && s.station !== "Unknown")
    .sort((a, b) => a.avgPrice - b.avgPrice)[0];

  // Average trip distance
  const avgTripDistance = totalTrips > 0 ? totalDistance / totalTrips : 0;

  // Yearly spend (last 3 years)
  const yearlySpend: { year: string; spend: number }[] = [];
  const currentYear = now.getFullYear();
  for (let y = currentYear - 2; y <= currentYear; y++) {
    const yearFillUps = fillUps.filter(f => new Date(f.date).getFullYear() === y);
    const spend = yearFillUps.reduce((s, f) => s + f.totalCost, 0);
    yearlySpend.push({ year: String(y), spend: parseFloat(spend.toFixed(2)) });
  }

  return {
    totalTrips,
    totalDistance,
    totalFuelCost,
    costPerDistance: costPerKm,
    avgFuelEconomy: avgFuelConsumption,
    currentMonthSpend,
    lastMonthSpend,
    monthlySpend,
    monthlyDistance,
    monthlyCostPerKm,
    fuelEconomyHistory,
    fuelUsageHistory,
    categoryDistance,
    categoryFuelCost,
    categoryFuelUsed,
    categoryTripCount,
    recentTrips: trips.slice(0, 5),
    recentFillUps: fillUps.slice(0, 3),
    lifetime,
    estimatedFuelRemaining,
    estimatedRangeRemaining,
    stationStats,
    currentMonthTrips,
    currentMonthDistance,
    longestTrip,
    mostExpensiveMonth,
    cheapestStation,
    avgTripDistance,
    yearlySpend,
  };
}
