import type { Trip, FillUp } from "../types";
import { parseCSVLine } from "./utils";

export function tripsToCSV(trips: Trip[]): string {
  const headers = [
    "ID", "Date", "Distance (km)", "Start Odometer", "End Odometer",
    "Category", "Purpose", "Start Location", "End Location",
    "Duration (min)", "Fuel Used (L)", "Fuel Economy (L/100km)", "Trip Cost", "Notes", "Created At",
  ];
  const rows = trips.map(t => [
    t.id, t.date, t.distance,
    t.startOdometer ?? "", t.endOdometer ?? "",
    t.category, t.purpose || "", t.startLocation || "",
    t.endLocation || "", t.duration || "", t.fuelUsed || "",
    t.fuelEconomy || "", t.tripCost || "", t.notes || "", t.createdAt,
  ]);
  return [headers.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
}

export function fillUpsToCSV(fillUps: FillUp[]): string {
  const headers = [
    "ID", "Date", "Odometer (km)", "Liters", "Price Per Liter",
    "Discount (cents/L)", "Total Cost", "Station", "Fuel Grade",
    "Full Tank", "Fuel Economy (L/100km)", "Notes", "Created At",
  ];
  const rows = fillUps.map(f => [
    f.id, f.date, f.odometer, f.liters, f.pricePerUnit,
    f.discount ?? "", f.totalCost, f.station || "",
    f.fuelGrade || "", f.isFull ? "Yes" : "No",
    f.fuelEconomy || "", f.notes || "", f.createdAt,
  ]);
  return [headers.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
}

export interface CSVImportResult<T> {
  records: T[];
  errors: string[];
  headerWarnings: string[];
}

// Normalize a header string for flexible matching
function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Map of normalized header → canonical field name for trips
const TRIP_HEADER_MAP: Record<string, string> = {
  id: "id",
  date: "date",
  distancekm: "distance",
  distance: "distance",
  distancekm2: "distance",
  startodometer: "startOdometer",
  startodo: "startOdometer",
  endodometer: "endOdometer",
  endodo: "endOdometer",
  category: "category",
  purpose: "purpose",
  startlocation: "startLocation",
  endlocation: "endLocation",
  durationmin: "duration",
  duration: "duration",
  fuelusedl: "fuelUsed",
  fuelused: "fuelUsed",
  fueleconomyl100km: "fuelEconomy",
  fueleconomy: "fuelEconomy",
  tripcost: "tripCost",
  notes: "notes",
  createdat: "createdAt",
};

const FILLUP_HEADER_MAP: Record<string, string> = {
  id: "id",
  date: "date",
  odometerkm: "odometer",
  odometer: "odometer",
  liters: "liters",
  litres: "liters",
  quantity: "liters",
  priceperliter: "pricePerUnit",
  priceperlitre: "pricePerUnit",
  price: "pricePerUnit",
  priceperunitcad: "pricePerUnit",
  priceperunit: "pricePerUnit",
  discountcentsl: "discount",
  discount: "discount",
  totalcost: "totalCost",
  totalcostcad: "totalCost",
  station: "station",
  fuelgrade: "fuelGrade",
  grade: "fuelGrade",
  fulltank: "isFull",
  isfull: "isFull",
  full: "isFull",
  fueleconomyl100km: "fuelEconomy",
  fueleconomy: "fuelEconomy",
  l100km: "fuelEconomy",
  notes: "notes",
  createdat: "createdAt",
};

export function parseTripsCSV(csvText: string): CSVImportResult<Trip> {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { records: [], errors: ["No data rows found"], headerWarnings: [] };

  const rawHeaders = parseCSVLine(lines[0]).map(h => h.trim());
  const headerWarnings: string[] = [];
  const fieldMap: Record<number, string> = {};

  rawHeaders.forEach((h, i) => {
    const key = norm(h);
    const field = TRIP_HEADER_MAP[key];
    if (field) {
      fieldMap[i] = field;
    } else {
      headerWarnings.push(`Unknown column ignored: "${h}"`);
    }
  });

  const requiredFields = ["date", "distance"];
  const mappedFields = new Set(Object.values(fieldMap));
  const missingRequired = requiredFields.filter(f => !mappedFields.has(f));
  if (missingRequired.length > 0) {
    return {
      records: [],
      errors: [`Missing required columns: ${missingRequired.join(", ")}. Found: ${rawHeaders.join(", ")}`],
      headerWarnings,
    };
  }

  const records: Trip[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    try {
      const cols = parseCSVLine(lines[i]);
      const get = (field: string) => {
        const idx = Object.entries(fieldMap).find(([, f]) => f === field)?.[0];
        return idx !== undefined ? (cols[parseInt(idx)]?.trim() || "") : "";
      };

      const distance = parseFloat(get("distance"));
      if (isNaN(distance) || distance <= 0) {
        errors.push(`Row ${i + 1}: invalid distance "${get("distance")}"`);
        continue;
      }
      const date = get("date");
      if (!date) { errors.push(`Row ${i + 1}: missing date`); continue; }

      const startOdo = parseFloat(get("startOdometer"));
      const endOdo = parseFloat(get("endOdometer"));

      records.push({
        id: get("id") || crypto.randomUUID(),
        date,
        distance,
        startOdometer: isNaN(startOdo) ? undefined : startOdo,
        endOdometer: isNaN(endOdo) ? undefined : endOdo,
        category: get("category") || "Personal",
        purpose: get("purpose") || undefined,
        startLocation: get("startLocation") || undefined,
        endLocation: get("endLocation") || undefined,
        duration: parseFloat(get("duration")) || undefined,
        fuelUsed: parseFloat(get("fuelUsed")) || undefined,
        fuelEconomy: parseFloat(get("fuelEconomy")) || undefined,
        tripCost: parseFloat(get("tripCost")) || undefined,
        notes: get("notes") || undefined,
        createdAt: get("createdAt") || new Date().toISOString(),
      });
    } catch {
      errors.push(`Row ${i + 1}: parse error`);
    }
  }
  return { records, errors, headerWarnings };
}

export function parseFillUpsCSV(csvText: string): CSVImportResult<FillUp> {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { records: [], errors: ["No data rows found"], headerWarnings: [] };

  const rawHeaders = parseCSVLine(lines[0]).map(h => h.trim());
  const headerWarnings: string[] = [];
  const fieldMap: Record<number, string> = {};

  rawHeaders.forEach((h, i) => {
    const key = norm(h);
    const field = FILLUP_HEADER_MAP[key];
    if (field) {
      fieldMap[i] = field;
    } else {
      headerWarnings.push(`Unknown column ignored: "${h}"`);
    }
  });

  const mappedFields = new Set(Object.values(fieldMap));
  const missingRequired = ["date", "liters", "pricePerUnit"].filter(f => !mappedFields.has(f));
  if (missingRequired.length > 0) {
    return {
      records: [],
      errors: [`Missing required columns: ${missingRequired.join(", ")}. Found: ${rawHeaders.join(", ")}`],
      headerWarnings,
    };
  }

  const records: FillUp[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    try {
      const cols = parseCSVLine(lines[i]);
      const get = (field: string) => {
        const idx = Object.entries(fieldMap).find(([, f]) => f === field)?.[0];
        return idx !== undefined ? (cols[parseInt(idx)]?.trim() || "") : "";
      };

      const liters = parseFloat(get("liters"));
      const pricePerUnit = parseFloat(get("pricePerUnit"));
      if (isNaN(liters) || liters <= 0) {
        errors.push(`Row ${i + 1}: invalid liters "${get("liters")}"`);
        continue;
      }
      if (isNaN(pricePerUnit) || pricePerUnit <= 0) {
        errors.push(`Row ${i + 1}: invalid price "${get("pricePerUnit")}"`);
        continue;
      }
      const date = get("date");
      if (!date) { errors.push(`Row ${i + 1}: missing date`); continue; }

      const odometer = parseFloat(get("odometer"));
      const totalCostRaw = parseFloat(get("totalCost"));
      const discount = parseFloat(get("discount"));
      const effectivePrice = !isNaN(discount) ? pricePerUnit - discount / 100 : pricePerUnit;
      const totalCost = isNaN(totalCostRaw) ? parseFloat((liters * effectivePrice).toFixed(2)) : totalCostRaw;
      const isFullStr = get("isFull").toLowerCase();

      records.push({
        id: get("id") || crypto.randomUUID(),
        date,
        odometer: isNaN(odometer) ? 0 : odometer,
        liters,
        pricePerUnit,
        discount: isNaN(discount) ? undefined : discount,
        totalCost,
        station: get("station") || undefined,
        fuelGrade: get("fuelGrade") || undefined,
        isFull: isFullStr === "yes" || isFullStr === "true" || isFullStr === "1",
        fuelEconomy: parseFloat(get("fuelEconomy")) || undefined,
        notes: get("notes") || undefined,
        createdAt: get("createdAt") || new Date().toISOString(),
      });
    } catch {
      errors.push(`Row ${i + 1}: parse error`);
    }
  }
  return { records, errors, headerWarnings };
}
