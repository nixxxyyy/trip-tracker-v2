import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDistance(value: number, unit: "miles" | "km"): string {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${unit === "miles" ? "mi" : "km"}`;
}

export function formatVolume(value: number, unit: "gallons" | "liters"): string {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit === "gallons" ? "gal" : "L"}`;
}

export function formatCurrency(value: number, symbol: string): string {
  return `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatEfficiency(value: number, unit: "mpg" | "L/100km"): string {
  if (unit === "mpg") {
    return `${value.toFixed(1)} mpg`;
  } else {
    return `${value.toFixed(1)} L/100km`;
  }
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function generateUUID(): string {
  return crypto.randomUUID();
}

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
