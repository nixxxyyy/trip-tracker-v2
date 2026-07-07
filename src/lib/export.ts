import type { Trip, FillUp } from "../types";
import { parseCSVLine } from "./utils";

export function tripsToCSV(trips: Trip[]): string {
  const headers = [
    "ID", "Date", "Distance (km)", "Start Odometer", "End Odometer",
    "Category", "Purpose", "Start Location", "End Location",
    "Duration (min)", "Fuel Used (L)", "Notes", "Created At"
  ];
  const rows = trips.map(t => [
    t.id, t.date, t.distance,
    t.startOdometer ?? "", t.endOdometer ?? "",
    t.category, t.purpose || "", t.startLocation || "",
    t.endLocation || "", t.duration || "", t.fuelUsed || "",
    t.notes || "", t.createdAt
  ]);
  return [headers.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
}

export function fillUpsToCSV(fillUps: FillUp[]): string {
  const headers = [
    "ID", "Date", "Odometer (km)", "Liters", "Price Per Liter (CAD)",
    "Discount (cents/L)", "Total Cost (CAD)", "Station", "Fuel Grade",
    "Full Tank", "Fuel Economy (L/100km)", "Notes", "Created At"
  ];
  const rows = fillUps.map(f => [
    f.id, f.date, f.odometer, f.liters, f.pricePerUnit,
    f.discount ?? "", f.totalCost, f.station || "",
    f.fuelGrade || "", f.isFull ? "Yes" : "No",
    f.fuelEconomy || "", f.notes || "", f.createdAt
  ]);
  return [headers.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
}

export interface CSVImportResult<T> {
  records: T[];
  errors: string[];
}

export function parseTripsCSV(csvText: string): CSVImportResult<Trip> {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { records: [], errors: ["No data rows found"] };

  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
  const records: Trip[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    try {
      const cols = parseCSVLine(lines[i]);
      const get = (names: string[]) => {
        for (const n of names) {
          const idx = headers.indexOf(n);
          if (idx >= 0) return cols[idx]?.trim() || "";
        }
        return "";
      };

      const distance = parseFloat(get(["distance (km)", "distance", "distance_km"]));
      if (isNaN(distance)) {
        errors.push(`Row ${i + 1}: invalid or missing distance`);
        continue;
      }

      const id = get(["id"]) || crypto.randomUUID();
      const date = get(["date"]);
      if (!date) { errors.push(`Row ${i + 1}: missing date`); continue; }

      const startOdo = parseFloat(get(["start odometer", "start_odometer", "startodometer"]));
      const endOdo = parseFloat(get(["end odometer", "end_odometer", "endodometer"]));

      records.push({
        id,
        date,
        distance,
        startOdometer: isNaN(startOdo) ? undefined : startOdo,
        endOdometer: isNaN(endOdo) ? undefined : endOdo,
        category: get(["category"]) || "Personal",
        purpose: get(["purpose"]) || undefined,
        startLocation: get(["start location", "start_location", "startlocation"]) || undefined,
        endLocation: get(["end location", "end_location", "endlocation"]) || undefined,
        duration: parseFloat(get(["duration (min)", "duration", "duration_min"])) || undefined,
        fuelUsed: parseFloat(get(["fuel used (l)", "fuel used", "fuelused"])) || undefined,
        notes: get(["notes"]) || undefined,
        createdAt: get(["created at", "created_at", "createdat"]) || new Date().toISOString(),
      });
    } catch {
      errors.push(`Row ${i + 1}: parse error`);
    }
  }

  return { records, errors };
}

export function parseFillUpsCSV(csvText: string): CSVImportResult<FillUp> {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { records: [], errors: ["No data rows found"] };

  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
  const records: FillUp[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    try {
      const cols = parseCSVLine(lines[i]);
      const get = (names: string[]) => {
        for (const n of names) {
          const idx = headers.indexOf(n);
          if (idx >= 0) return cols[idx]?.trim() || "";
        }
        return "";
      };

      const liters = parseFloat(get(["liters", "litres", "quantity"]));
      const pricePerUnit = parseFloat(get(["price per liter (cad)", "price per liter", "price per unit", "priceperliter"]));
      if (isNaN(liters) || isNaN(pricePerUnit)) {
        errors.push(`Row ${i + 1}: invalid liters or price`);
        continue;
      }

      const id = get(["id"]) || crypto.randomUUID();
      const date = get(["date"]);
      if (!date) { errors.push(`Row ${i + 1}: missing date`); continue; }

      const odometer = parseFloat(get(["odometer (km)", "odometer", "odometer_km"]));
      const totalCostRaw = parseFloat(get(["total cost (cad)", "total cost", "totalcost"]));
      const totalCost = isNaN(totalCostRaw) ? liters * pricePerUnit : totalCostRaw;
      const isFullStr = get(["full tank", "isfull", "is_full", "full"]).toLowerCase();

      records.push({
        id,
        date,
        odometer: isNaN(odometer) ? 0 : odometer,
        liters,
        pricePerUnit,
        discount: parseFloat(get(["discount (cents/l)", "discount"])) || undefined,
        totalCost,
        station: get(["station"]) || undefined,
        fuelGrade: get(["fuel grade", "fuelgrade"]) || undefined,
        isFull: isFullStr === "yes" || isFullStr === "true" || isFullStr === "1",
        fuelEconomy: parseFloat(get(["fuel economy (l/100km)", "fuel economy", "fueleconomy", "l100km"])) || undefined,
        notes: get(["notes"]) || undefined,
        createdAt: get(["created at", "created_at", "createdat"]) || new Date().toISOString(),
      });
    } catch {
      errors.push(`Row ${i + 1}: parse error`);
    }
  }

  return { records, errors };
}
