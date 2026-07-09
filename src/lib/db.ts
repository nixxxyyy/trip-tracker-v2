import { openDB as idbOpenDB, DBSchema } from "idb";
import type {
  Trip, FillUp, Settings, Vehicle, Maintenance, VehicleCost,
  StatsResult, LifetimeStats, MonthStats, FuelOverride, OwnershipCostSummary,
} from "../types";
import { format, subMonths, startOfMonth, endOfMonth, isAfter, isBefore } from "date-fns";

interface TripTrackerDB extends DBSchema {
  trips: { key: string; value: Trip; indexes: { date: string; category: string } };
  fillups: { key: string; value: FillUp; indexes: { date: string } };
  settings: { key: string; value: any };
  maintenance: { key: string; value: Maintenance; indexes: { date: string } };
  vehiclecosts: { key: string; value: VehicleCost; indexes: { date: string; category: string } };
}

const DB_NAME = "trip-tracker-db";
const DB_VERSION = 3;

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
      // v3: no schema change, just settings key additions (fuelOverride, vehicles)
    },
  });
}

// ─── Trips ───────────────────────────────────────────────────────────────────
export async function getTrips(): Promise<Trip[]> {
  const db = await openDB();
  const trips = await db.getAllFromIndex("trips", "date");
  return trips.reverse();
}
export async function addTrip(trip: Trip): Promise<void> {
  const db = await openDB(); await db.put("trips", trip);
}
export async function updateTrip(trip: Trip): Promise<void> {
  const db = await openDB(); await db.put("trips", trip);
}
export async function deleteTrip(id: string): Promise<void> {
  const db = await openDB(); await db.delete("trips", id);
}

// ─── FillUps ─────────────────────────────────────────────────────────────────
export async function getFillUps(): Promise<FillUp[]> {
  const db = await openDB();
  const fillUps = await db.getAllFromIndex("fillups", "date");
  return fillUps.reverse();
}
export async function addFillUp(fillUp: FillUp): Promise<void> {
  const db = await openDB(); await db.put("fillups", fillUp);
}
export async function updateFillUp(fillUp: FillUp): Promise<void> {
  const db = await openDB(); await db.put("fillups", fillUp);
}
export async function deleteFillUp(id: string): Promise<void> {
  const db = await openDB(); await db.delete("fillups", id);
}

// ─── Maintenance ─────────────────────────────────────────────────────────────
export async function getMaintenance(): Promise<Maintenance[]> {
  const db = await openDB();
  const records = await db.getAllFromIndex("maintenance", "date");
  return records.reverse();
}
export async function addMaintenance(record: Maintenance): Promise<void> {
  const db = await openDB(); await db.put("maintenance", record);
}
export async function updateMaintenance(record: Maintenance): Promise<void> {
  const db = await openDB(); await db.put("maintenance", record);
}
export async function deleteMaintenance(id: string): Promise<void> {
  const db = await openDB(); await db.delete("maintenance", id);
}

// ─── Vehicle Costs ───────────────────────────────────────────────────────────
export async function getVehicleCosts(): Promise<VehicleCost[]> {
  const db = await openDB();
  const records = await db.getAllFromIndex("vehiclecosts", "date");
  return records.reverse();
}
export async function addVehicleCost(record: VehicleCost): Promise<void> {
  const db = await openDB(); await db.put("vehiclecosts", record);
}
export async function updateVehicleCost(record: VehicleCost): Promise<void> {
  const db = await openDB(); await db.put("vehiclecosts", record);
}
export async function deleteVehicleCost(id: string): Promise<void> {
  const db = await openDB(); await db.delete("vehiclecosts", id);
}

// ─── Settings ────────────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = ["Commute", "Business", "Personal", "Medical", "Moving", "Partner"];

const defaultSettings: Settings = {
  theme: "system",
  units: { distance: "km", fuelEfficiency: "L/100km", volume: "liters", currency: "$" },
  categories: DEFAULT_CATEGORIES,
};

export async function getSettings(): Promise<Settings> {
  const db = await openDB();
  const [theme, units, categories, vehicleInfo, lastBackup, defaultCategory, vehicles, activeVehicleId, fuelOverride] =
    await Promise.all([
      db.get("settings", "theme"),
      db.get("settings", "units"),
      db.get("settings", "categories"),
      db.get("settings", "vehicleInfo"),
      db.get("settings", "lastBackup"),
      db.get("settings", "defaultCategory"),
      db.get("settings", "vehicles"),
      db.get("settings", "activeVehicleId"),
      db.get("settings", "fuelOverride"),
    ]);

  // Migrate: if old vehicleInfo exists and no vehicles list yet, convert it
  let vehiclesList: Vehicle[] | undefined = vehicles?.value;
  let activeId: string | undefined = activeVehicleId?.value;
  const legacyVehicle: Vehicle | undefined = vehicleInfo?.value;

  if (legacyVehicle && (!vehiclesList || vehiclesList.length === 0)) {
    const migratedId = legacyVehicle.id || "vehicle-1";
    vehiclesList = [{ ...legacyVehicle, id: migratedId, status: "active" }];
    activeId = migratedId;
  }

  return {
    theme: theme?.value ?? defaultSettings.theme,
    units: units?.value ?? defaultSettings.units,
    categories: categories?.value ?? defaultSettings.categories,
    vehicleInfo: vehicleInfo?.value,
    lastBackup: lastBackup?.value,
    defaultCategory: defaultCategory?.value,
    vehicles: vehiclesList,
    activeVehicleId: activeId,
    fuelOverride: fuelOverride?.value,
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
  if (settings.vehicles !== undefined) await tx.store.put({ key: "vehicles", value: settings.vehicles });
  if (settings.activeVehicleId !== undefined) await tx.store.put({ key: "activeVehicleId", value: settings.activeVehicleId });
  if (settings.fuelOverride !== undefined) await tx.store.put({ key: "fuelOverride", value: settings.fuelOverride });
  else await tx.store.delete("fuelOverride");
  await tx.done;
}

export async function getCategories(): Promise<string[]> {
  const s = await getSettings(); return s.categories;
}
export async function saveCategories(categories: string[]): Promise<void> {
  const db = await openDB();
  await db.put("settings", { key: "categories", value: categories });
}
export async function getVehicle(): Promise<Vehicle | null> {
  const s = await getSettings();
  // Return the active vehicle from the vehicles list, or fall back to legacy vehicleInfo
  if (s.vehicles && s.vehicles.length > 0) {
    const active = s.activeVehicleId
      ? s.vehicles.find(v => v.id === s.activeVehicleId)
      : s.vehicles.find(v => !v.status || v.status === "active");
    return active ?? s.vehicles[0];
  }
  return s.vehicleInfo ?? null;
}
export async function saveVehicle(vehicle: Vehicle): Promise<void> {
  const db = await openDB();
  await db.put("settings", { key: "vehicleInfo", value: vehicle });
}

// ─── Backup / Restore ────────────────────────────────────────────────────────
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
  trips: Trip[]; fillUps: FillUp[];
  maintenance?: Maintenance[]; vehicleCosts?: VehicleCost[]; settings: Settings;
}): Promise<void> {
  const db = await openDB();
  const stores: ("trips" | "fillups" | "settings" | "maintenance" | "vehiclecosts")[] =
    ["trips", "fillups", "settings", "maintenance", "vehiclecosts"];
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
  await tx.done;
}

export async function mergeTripsFromCSV(incoming: Trip[]): Promise<{ added: number; skipped: number }> {
  const existing = await getTrips();
  const existingIds = new Set(existing.map(t => t.id));
  let added = 0, skipped = 0;
  for (const t of incoming) {
    if (existingIds.has(t.id)) { skipped++; continue; }
    await addTrip(t); added++;
  }
  return { added, skipped };
}

export async function mergeFillUpsFromCSV(incoming: FillUp[]): Promise<{ added: number; skipped: number }> {
  const existing = await getFillUps();
  const existingIds = new Set(existing.map(f => f.id));
  let added = 0, skipped = 0;
  for (const f of incoming) {
    if (existingIds.has(f.id)) { skipped++; continue; }
    await addFillUp(f); added++;
  }
  return { added, skipped };
}

// ─── Stats ───────────────────────────────────────────────────────────────────
export async function getStatsForRange(_startDate: string, _endDate: string): Promise<StatsResult> {
  const [trips, fillUps, vehicle] = await Promise.all([getTrips(), getFillUps(), getVehicle()]);
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  // Lifetime
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

  // Compute per-trip fuel cost using L/100km + avg price per liter allocation
  const avgPricePerL = fillUps.length > 0
    ? fillUps.reduce((s, f) => s + f.pricePerUnit, 0) / fillUps.length : 0;

  // Monthly aggregates — last 6 months
  const monthlySpend: { month: string; spend: number }[] = [];
  const monthlyDistance: { month: string; distance: number }[] = [];
  const monthlyCostPerKm: { month: string; costPerKm: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(subMonths(now, i));
    const label = format(monthStart, "MMM");
    const monthFillUps = fillUps.filter(f => {
      const d = new Date(f.date); return !isBefore(d, monthStart) && !isAfter(d, monthEnd);
    });
    const monthTrips = trips.filter(t => {
      const d = new Date(t.date); return !isBefore(d, monthStart) && !isAfter(d, monthEnd);
    });
    const dist = monthTrips.reduce((s, t) => s + t.distance, 0);
    // Fuel cost = fuel consumed by trips in month × avg price
    const fuelConsumed = avgFuelConsumption > 0 ? (dist / 100) * avgFuelConsumption : 0;
    const consumedCost = fuelConsumed * avgPricePerL;
    // Fallback to purchase-based if no trips
    const purchaseCost = monthFillUps.reduce((s, f) => s + f.totalCost, 0);
    const spend = dist > 0 ? consumedCost : purchaseCost;
    monthlySpend.push({ month: label, spend: parseFloat(spend.toFixed(2)) });
    monthlyDistance.push({ month: label, distance: parseFloat(dist.toFixed(1)) });
    monthlyCostPerKm.push({ month: label, costPerKm: dist > 0 ? parseFloat((spend / dist).toFixed(4)) : 0 });
  }

  // Fuel economy history
  const fullFills = fillUps.filter(f => f.isFull && f.fuelEconomy != null);
  const fuelEconomyHistory = fullFills.slice(0, 10).map(f => ({
    date: format(new Date(f.date), "MMM d"),
    value: f.fuelEconomy!,
  })).reverse();

  const fuelUsageHistory = fillUps.slice(0, 6).map(f => ({
    date: format(new Date(f.date), "MMM d"),
    liters: parseFloat(f.liters.toFixed(2)),
  })).reverse();

  // This month
  const thisMonthTrips = trips.filter(t => !isBefore(new Date(t.date), thisMonthStart));
  const currentMonthDistance = thisMonthTrips.reduce((s, t) => s + t.distance, 0);
  const currentMonthTrips = thisMonthTrips.length;
  const thisMonthFuelConsumed = avgFuelConsumption > 0 ? (currentMonthDistance / 100) * avgFuelConsumption : 0;
  const currentMonthSpend = thisMonthFuelConsumed * avgPricePerL;
  const currentMonthTripCost = currentMonthSpend;
  const thisMonthFillsWithEcon = fullFills.filter(f => !isBefore(new Date(f.date), thisMonthStart));
  const currentMonthFuelEconomy = thisMonthFillsWithEcon.length > 0
    ? thisMonthFillsWithEcon.reduce((s, f) => s + f.fuelEconomy!, 0) / thisMonthFillsWithEcon.length
    : avgFuelConsumption;

  const lastMonthSpend = fillUps
    .filter(f => { const d = new Date(f.date); return !isBefore(d, lastMonthStart) && !isAfter(d, lastMonthEnd); })
    .reduce((s, f) => s + f.totalCost, 0);

  // Category stats
  const catMap = trips.reduce((acc, t) => {
    const c = t.category;
    if (!acc[c]) acc[c] = { distance: 0, fuelCost: 0, fuelUsed: 0, trips: 0 };
    acc[c].distance += t.distance;
    acc[c].trips += 1;
    // Allocate fuel cost via consumption
    const fuelL = avgFuelConsumption > 0 ? (t.distance / 100) * avgFuelConsumption : 0;
    acc[c].fuelUsed += fuelL;
    acc[c].fuelCost += fuelL * avgPricePerL;
    return acc;
  }, {} as Record<string, { distance: number; fuelCost: number; fuelUsed: number; trips: number }>);

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

  // Fuel remaining estimate
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

  // v2 extras
  const longestTrip = trips.length > 0 ? trips.reduce((b, t) => t.distance > b.distance ? t : b) : undefined;
  const mostExpensiveMonth = monthlySpend.length > 0 ? monthlySpend.reduce((b, m) => m.spend > b.spend ? m : b) : undefined;
  const cheapestStation = stationStats.filter(s => s.visits >= 2 && s.station !== "Unknown").sort((a, b) => a.avgPrice - b.avgPrice)[0];
  const avgTripDistance = totalTrips > 0 ? totalDistance / totalTrips : 0;
  const currentYear = now.getFullYear();
  const yearlySpend: { year: string; spend: number }[] = [];
  for (let y = currentYear - 2; y <= currentYear; y++) {
    const yTrips = trips.filter(t => new Date(t.date).getFullYear() === y);
    const yDist = yTrips.reduce((s, t) => s + t.distance, 0);
    const yFuelConsumed = avgFuelConsumption > 0 ? (yDist / 100) * avgFuelConsumption : 0;
    const spend = yFuelConsumed * avgPricePerL;
    yearlySpend.push({ year: String(y), spend: parseFloat(spend.toFixed(2)) });
  }

  // All months (for the month selector in Analytics)
  const allMonths: MonthStats[] = [];
  if (trips.length > 0 || fillUps.length > 0) {
    const oldest = [...trips.map(t => t.date), ...fillUps.map(f => f.date)].sort()[0];
    const oldestDate = startOfMonth(new Date(oldest));
    let cursor = oldestDate;
    while (!isAfter(cursor, now)) {
      const mEnd = endOfMonth(cursor);
      const mKey = format(cursor, "yyyy-MM");
      const mLabel = format(cursor, "MMM yyyy");
      const mTrips = trips.filter(t => { const d = new Date(t.date); return !isBefore(d, cursor) && !isAfter(d, mEnd); });
      const mFills = fillUps.filter(f => { const d = new Date(f.date); return !isBefore(d, cursor) && !isAfter(d, mEnd); });
      const mDist = mTrips.reduce((s, t) => s + t.distance, 0);
      const mFuelConsumed = avgFuelConsumption > 0 ? (mDist / 100) * avgFuelConsumption : 0;
      const mFuelCost = mFuelConsumed * avgPricePerL;
      const mFuelPurchased = mFills.reduce((s, f) => s + f.totalCost, 0);
      const mEconFills = mFills.filter(f => f.isFull && f.fuelEconomy != null);
      const mEcon = mEconFills.length > 0 ? mEconFills.reduce((s, f) => s + f.fuelEconomy!, 0) / mEconFills.length : 0;
      allMonths.push({
        month: mKey, label: mLabel,
        distance: parseFloat(mDist.toFixed(1)),
        fuelCost: parseFloat(mFuelCost.toFixed(2)),
        fuelPurchased: parseFloat(mFuelPurchased.toFixed(2)),
        fuelEconomy: parseFloat(mEcon.toFixed(2)),
        costPerKm: mDist > 0 ? parseFloat((mFuelCost / mDist).toFixed(4)) : 0,
        tripCount: mTrips.length,
        fillUpCount: mFills.length,
      });
      cursor = startOfMonth(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
    }
  }

  return {
    totalTrips, totalDistance, totalFuelCost,
    costPerDistance: costPerKm, avgFuelEconomy: avgFuelConsumption,
    currentMonthSpend, lastMonthSpend,
    monthlySpend, monthlyDistance, monthlyCostPerKm,
    fuelEconomyHistory, fuelUsageHistory,
    categoryDistance, categoryFuelCost, categoryFuelUsed, categoryTripCount,
    recentTrips: trips.slice(0, 5), recentFillUps: fillUps.slice(0, 3),
    lifetime, estimatedFuelRemaining, estimatedRangeRemaining, stationStats,
    currentMonthDistance, currentMonthTrips, currentMonthFuelEconomy, currentMonthTripCost,
    longestTrip, mostExpensiveMonth, cheapestStation, avgTripDistance, yearlySpend,
    allMonths,
  };
}

// ─── Ownership Cost ───────────────────────────────────────────────────────────
export async function getOwnershipCost(): Promise<OwnershipCostSummary> {
  const [vehicle, vehicleCosts, fillUps, trips] = await Promise.all([
    getVehicle(), getVehicleCosts(), getFillUps(), getTrips(),
  ]);

  const purchasePrice = vehicle?.purchasePrice ?? 0;
  const saleValue = vehicle?.saleValue ?? 0;

  const catSum = (cat: string) => vehicleCosts.filter(c => c.category === cat).reduce((s, c) => s + c.amount, 0);
  const maintenance = catSum("maintenance");
  const insurance = catSum("insurance");
  const registration = catSum("registration");
  const repairs = catSum("repairs");
  const accessories = catSum("accessories");
  const interest = catSum("interest");
  const tires = catSum("tires");

  const totalFuelCost = fillUps.reduce((s, f) => s + f.totalCost, 0);
  const fuel = totalFuelCost;

  const totalCost = purchasePrice + maintenance + fuel + insurance + registration + repairs + accessories + interest + tires;
  const netCost = totalCost - saleValue;

  const totalKm = trips.reduce((s, t) => s + t.distance, 0);

  // Days of ownership
  const purchaseDateStr = vehicle?.purchaseDate;
  const saleDateStr = vehicle?.saleDate;
  const startD = purchaseDateStr ? new Date(purchaseDateStr) : (trips.length > 0 ? new Date(trips[trips.length - 1].date) : new Date());
  const endD = saleDateStr ? new Date(saleDateStr) : new Date();
  const totalDays = Math.max(1, Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)));

  const totalDepreciation = purchasePrice > 0 ? purchasePrice - saleValue : 0;

  return {
    purchasePrice, maintenance, fuel, insurance, registration,
    repairs, accessories, interest, tires,
    totalCost: parseFloat(totalCost.toFixed(2)),
    saleValue,
    netCost: parseFloat(netCost.toFixed(2)),
    totalKm: parseFloat(totalKm.toFixed(1)),
    totalDays,
    costPerKm: totalKm > 0 ? parseFloat((netCost / totalKm).toFixed(4)) : 0,
    costPerDay: parseFloat((netCost / totalDays).toFixed(2)),
    totalDepreciation: parseFloat(totalDepreciation.toFixed(2)),
  };
}
