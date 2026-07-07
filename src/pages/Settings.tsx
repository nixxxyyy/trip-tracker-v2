import { useState, useRef } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Car, Download, Upload, Moon, Sun, Monitor, X, Plus,
  Wrench, DollarSign, ChevronRight, AlertCircle, CheckCircle2,
  Palette, Settings2, Database, Hash,
} from "lucide-react";
import { tripsToCSV, fillUpsToCSV, parseTripsCSV, parseFillUpsCSV } from "@/lib/export";
import {
  exportAllData, importAllData, mergeTripsFromCSV, mergeFillUpsFromCSV,
  deleteTrip, addTrip, deleteFillUp, addFillUp,
} from "@/lib/db";
import { useData } from "@/contexts/DataContext";
import { toast } from "sonner";
import { Link } from "wouter";
import type { Trip, FillUp } from "@/types";
import { cn } from "@/lib/utils";

type ImportMode = "merge" | "replace";
interface ImportPreview<T> { records: T[]; errors: string[]; existingIds: Set<string>; }

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 px-1">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <h2 className="section-label">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function RowButton({ icon, iconColor, title, sub, onClick, href }: {
  icon: React.ReactNode; iconColor: string; title: string; sub: string;
  onClick?: () => void; href?: string;
}) {
  const inner = (
    <div className="w-full flex items-center gap-3 p-4 hover:bg-muted/40 active:bg-muted/60 transition-colors text-left">
      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", iconColor)}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </div>
  );
  if (href) return <Link href={href}><button className="w-full">{inner}</button></Link>;
  return <button onClick={onClick} className="w-full">{inner}</button>;
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-4 border-b border-border last:border-0">
      <Label className="text-sm font-medium">{label}</Label>
      <div>{children}</div>
    </div>
  );
}

function ImportPreviewCard({ title, total, duplicates, errors, mode, onConfirm, onCancel, preview }: {
  title: string; total: number; duplicates: number; errors: string[];
  mode: ImportMode; onConfirm: () => void; onCancel: () => void; preview: string[];
}) {
  const newRecords = mode === "merge" ? total - duplicates : total;
  return (
    <div className="border border-card-border rounded-2xl p-4 space-y-3 bg-muted/20">
      <h3 className="font-semibold text-sm">{title}</h3>
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>{total} records found · {duplicates} duplicate{duplicates !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2 text-primary font-semibold">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Will {mode === "merge" ? `add ${newRecords} new` : `replace all with ${total}`} records</span>
        </div>
        {errors.length > 0 && (
          <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errors.length} row{errors.length !== 1 ? "s" : ""} had errors and will be skipped</span>
          </div>
        )}
      </div>
      {preview.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-3 space-y-1">
          <p className="text-xs text-muted-foreground font-semibold">Preview (first {preview.length})</p>
          {preview.map((p, i) => <p key={i} className="text-xs font-mono text-muted-foreground">{p}</p>)}
          {total > 3 && <p className="text-xs text-muted-foreground">…and {total - 3} more</p>}
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={onConfirm} className="flex-1 rounded-xl">Import</Button>
        <Button size="sm" variant="outline" onClick={onCancel} className="rounded-xl">Cancel</Button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { settings, updateSettings } = useAppContext();
  const { trips, fillUps, refreshData } = useData();
  const [newCategory, setNewCategory] = useState("");

  const [tripPreview, setTripPreview] = useState<ImportPreview<Trip> | null>(null);
  const [fillUpPreview, setFillUpPreview] = useState<ImportPreview<FillUp> | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("merge");
  const tripFileRef = useRef<HTMLInputElement>(null);
  const fillUpFileRef = useRef<HTMLInputElement>(null);
  const jsonFileRef = useRef<HTMLInputElement>(null);

  const v = settings?.vehicleInfo;
  const [vehicle, setVehicle] = useState({
    make: v?.make || "",
    model: v?.model || "",
    year: v?.year ? String(v.year) : "",
    name: v?.name || "",
    trim: v?.trim || "",
    licensePlate: v?.licensePlate || "",
    vin: v?.vin || "",
    fuelType: v?.fuelType || "Gasoline",
    color: v?.color || "",
    fuelTankCapacity: v?.fuelTankCapacity ? String(v.fuelTankCapacity) : "",
    initialOdometer: v?.initialOdometer ? String(v.initialOdometer) : "",
    defaultFuelConsumption: v?.defaultFuelConsumption ? String(v.defaultFuelConsumption) : "",
    purchasePrice: v?.purchasePrice ? String(v.purchasePrice) : "",
    purchaseDate: v?.purchaseDate || "",
    insuranceExpiry: v?.insuranceExpiry || "",
    registrationExpiry: v?.registrationExpiry || "",
    warrantyExpiry: v?.warrantyExpiry || "",
    notes: v?.notes || "",
  });

  if (!settings) return <div className="pt-8 text-center text-muted-foreground">Loading…</div>;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveVehicle = async () => {
    await updateSettings({
      vehicleInfo: {
        make: vehicle.make || "Unknown",
        model: vehicle.model || "Unknown",
        year: parseInt(vehicle.year) || new Date().getFullYear(),
        name: vehicle.name || undefined,
        trim: vehicle.trim || undefined,
        licensePlate: vehicle.licensePlate || undefined,
        vin: vehicle.vin || undefined,
        color: vehicle.color || undefined,
        fuelType: vehicle.fuelType || undefined,
        fuelTankCapacity: parseFloat(vehicle.fuelTankCapacity) || 60,
        initialOdometer: parseFloat(vehicle.initialOdometer) || 0,
        defaultFuelConsumption: parseFloat(vehicle.defaultFuelConsumption) || undefined,
        purchasePrice: vehicle.purchasePrice ? parseFloat(vehicle.purchasePrice) : undefined,
        purchaseDate: vehicle.purchaseDate || undefined,
        insuranceExpiry: vehicle.insuranceExpiry || undefined,
        registrationExpiry: vehicle.registrationExpiry || undefined,
        warrantyExpiry: vehicle.warrantyExpiry || undefined,
        notes: vehicle.notes || undefined,
      },
    });
    toast.success("Vehicle saved");
  };

  const handleExportJSON = async () => {
    const data = await exportAllData();
    downloadFile(JSON.stringify(data, null, 2), "application/json",
      `trip-tracker-backup-${today()}.json`);
    toast.success("Backup exported");
  };

  const handleExportTripsCSV = () => {
    downloadFile(tripsToCSV(trips), "text/csv", `trips-${today()}.csv`);
    toast.success("Trips CSV exported");
  };

  const handleExportFillUpsCSV = () => {
    downloadFile(fillUpsToCSV(fillUps), "text/csv", `fillups-${today()}.csv`);
    toast.success("Fill-ups CSV exported");
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data.trips || !data.fillUps || !data.settings) throw new Error("Invalid backup");
      await importAllData(data);
      await refreshData();
      toast.success("Data restored from backup");
    } catch { toast.error("Failed to read backup file"); }
    if (jsonFileRef.current) jsonFileRef.current.value = "";
  };

  const handleTripFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = parseTripsCSV(await file.text());
    setTripPreview({ ...result, existingIds: new Set(trips.map(t => t.id)) });
    if (tripFileRef.current) tripFileRef.current.value = "";
  };

  const handleFillUpFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = parseFillUpsCSV(await file.text());
    setFillUpPreview({ ...result, existingIds: new Set(fillUps.map(f => f.id)) });
    if (fillUpFileRef.current) fillUpFileRef.current.value = "";
  };

  const handleImportTrips = async () => {
    if (!tripPreview) return;
    try {
      if (importMode === "replace") {
        for (const t of trips) await deleteTrip(t.id);
        for (const t of tripPreview.records) await addTrip(t);
        toast.success(`Replaced with ${tripPreview.records.length} trips`);
      } else {
        const r = await mergeTripsFromCSV(tripPreview.records);
        toast.success(`Added ${r.added} trips, skipped ${r.skipped} duplicates`);
      }
      await refreshData();
      setTripPreview(null);
    } catch { toast.error("Import failed"); }
  };

  const handleImportFillUps = async () => {
    if (!fillUpPreview) return;
    try {
      if (importMode === "replace") {
        for (const f of fillUps) await deleteFillUp(f.id);
        for (const f of fillUpPreview.records) await addFillUp(f);
        toast.success(`Replaced with ${fillUpPreview.records.length} fill-ups`);
      } else {
        const r = await mergeFillUpsFromCSV(fillUpPreview.records);
        toast.success(`Added ${r.added} fill-ups, skipped ${r.skipped} duplicates`);
      }
      await refreshData();
      setFillUpPreview(null);
    } catch { toast.error("Import failed"); }
  };

  const handleAddCategory = () => {
    const cat = newCategory.trim();
    if (!cat || settings.categories.includes(cat)) return;
    updateSettings({ categories: [...settings.categories, cat] });
    setNewCategory("");
  };

  const handleRemoveCategory = (cat: string) => {
    updateSettings({ categories: settings.categories.filter(c => c !== cat) });
  };

  const handleResetData = async () => {
    if (!confirm("This will permanently delete ALL trips, fill-ups, and maintenance records. Continue?")) return;
    for (const t of trips) await deleteTrip(t.id);
    for (const f of fillUps) await deleteFillUp(f.id);
    await refreshData();
    toast.success("All data cleared");
  };

  const duplicatesInTrips = tripPreview
    ? tripPreview.records.filter(r => tripPreview.existingIds.has(r.id)).length : 0;
  const duplicatesInFillUps = fillUpPreview
    ? fillUpPreview.records.filter(r => fillUpPreview.existingIds.has(r.id)).length : 0;

  const vf = (key: keyof typeof vehicle) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setVehicle(p => ({ ...p, [key]: e.target.value }));

  const FieldInput = ({ label, k, type = "text", placeholder = "" }: {
    label: string; k: keyof typeof vehicle; type?: string; placeholder?: string;
  }) => (
    <div>
      <Label className="text-xs text-muted-foreground mb-1 block">{label}</Label>
      <Input type={type} placeholder={placeholder} value={vehicle[k] as string} onChange={vf(k)} className="h-10" />
    </div>
  );

  return (
    <div className="flex flex-col gap-6 page-enter pb-10 pt-4">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      {/* ── Appearance ── */}
      <Section title="Appearance" icon={<Palette className="h-3.5 w-3.5" />}>
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Label className="text-sm font-medium">Theme</Label>
            <div className="flex gap-1 bg-muted/60 rounded-xl p-1">
              {([
                { value: "light", icon: <Sun className="h-3.5 w-3.5" /> },
                { value: "system", icon: <Monitor className="h-3.5 w-3.5" /> },
                { value: "dark", icon: <Moon className="h-3.5 w-3.5" /> },
              ] as const).map(t => (
                <button
                  key={t.value}
                  onClick={() => updateSettings({ theme: t.value })}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize",
                    settings.theme === t.value
                      ? "bg-card shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.icon} {t.value}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Vehicle ── */}
      <Section title="Vehicle" icon={<Car className="h-3.5 w-3.5" />}>
        <div className="bg-card border border-card-border rounded-2xl p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FieldInput label="Nickname" k="name" placeholder="My Car" />
            <FieldInput label="Year" k="year" type="number" placeholder="2022" />
            <FieldInput label="Make" k="make" placeholder="Honda" />
            <FieldInput label="Model" k="model" placeholder="Civic" />
            <FieldInput label="Trim" k="trim" placeholder="Sport" />
            <FieldInput label="Colour" k="color" placeholder="Midnight Blue" />
            <FieldInput label="License Plate" k="licensePlate" placeholder="ABC-1234" />
            <FieldInput label="VIN" k="vin" placeholder="1HGBH41…" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Fuel Type</Label>
              <select
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                value={vehicle.fuelType}
                onChange={vf("fuelType")}
              >
                {["Gasoline", "Diesel", "Electric", "Hybrid", "E85", "Other"].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <FieldInput label="Tank Size (L)" k="fuelTankCapacity" type="number" placeholder="60" />
            <FieldInput label="Initial Odometer (km)" k="initialOdometer" type="number" placeholder="0" />
            <FieldInput label="Default L/100km" k="defaultFuelConsumption" type="number" placeholder="8.5" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FieldInput label="Purchase Price" k="purchasePrice" type="number" placeholder="25000" />
            <FieldInput label="Purchase Date" k="purchaseDate" type="date" />
            <FieldInput label="Insurance Expiry" k="insuranceExpiry" type="date" />
            <FieldInput label="Registration Expiry" k="registrationExpiry" type="date" />
            <FieldInput label="Warranty Expiry" k="warrantyExpiry" type="date" />
          </div>

          <Button onClick={handleSaveVehicle} className="w-full rounded-xl">Save Vehicle</Button>
        </div>
      </Section>

      {/* ── Units ── */}
      <Section title="Units & Currency" icon={<Settings2 className="h-3.5 w-3.5" />}>
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden divide-y divide-border">
          <SettingRow label="Distance">
            <select
              className="bg-background border border-input rounded-lg px-2 py-1 text-sm"
              value={settings.units.distance}
              onChange={e => updateSettings({ units: { ...settings.units, distance: e.target.value as "km" | "miles" } })}
            >
              <option value="km">Kilometres (km)</option>
              <option value="miles">Miles (mi)</option>
            </select>
          </SettingRow>
          <SettingRow label="Fuel Economy">
            <select
              className="bg-background border border-input rounded-lg px-2 py-1 text-sm"
              value={settings.units.fuelEfficiency}
              onChange={e => updateSettings({ units: { ...settings.units, fuelEfficiency: e.target.value as "L/100km" | "mpg" } })}
            >
              <option value="L/100km">L/100km</option>
              <option value="mpg">MPG</option>
            </select>
          </SettingRow>
          <SettingRow label="Volume">
            <select
              className="bg-background border border-input rounded-lg px-2 py-1 text-sm"
              value={settings.units.volume}
              onChange={e => updateSettings({ units: { ...settings.units, volume: e.target.value as "liters" | "gallons" } })}
            >
              <option value="liters">Litres</option>
              <option value="gallons">Gallons</option>
            </select>
          </SettingRow>
          <SettingRow label="Currency Symbol">
            <Input
              className="w-16 h-8 text-center text-sm"
              value={settings.units.currency}
              onChange={e => updateSettings({ units: { ...settings.units, currency: e.target.value } })}
            />
          </SettingRow>
        </div>
      </Section>

      {/* ── Categories ── */}
      <Section title="Trip Categories" icon={<Hash className="h-3.5 w-3.5" />}>
        <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Default Category</Label>
            <Select
              value={settings.defaultCategory || settings.categories[0]}
              onValueChange={val => updateSettings({ defaultCategory: val })}
            >
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {settings.categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            {settings.categories.map(cat => (
              <Badge key={cat} variant="secondary" className="pl-3 pr-1.5 py-1 gap-1 rounded-lg">
                {cat}
                <button onClick={() => handleRemoveCategory(cat)} className="hover:text-destructive transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="New category…"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddCategory()}
              className="h-10"
            />
            <Button size="sm" onClick={handleAddCategory} className="h-10 w-10 p-0 rounded-xl shrink-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Section>

      {/* ── Quick links ── */}
      <Section title="Records">
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden divide-y divide-border">
          <RowButton href="/maintenance" icon={<Wrench className="h-4 w-4" />}
            iconColor="bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-400"
            title="Service Log" sub="Oil changes, tire rotations & more" />
          <RowButton href="/vehicle-costs" icon={<DollarSign className="h-4 w-4" />}
            iconColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-400"
            title="Vehicle Costs" sub="Insurance, registration & more" />
        </div>
      </Section>

      {/* ── Export ── */}
      <Section title="Export Data" icon={<Database className="h-3.5 w-3.5" />}>
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden divide-y divide-border">
          <RowButton icon={<Download className="h-4 w-4" />} iconColor="bg-primary/10 text-primary"
            title="Backup (JSON)" sub="All data — trips, fill-ups, settings" onClick={handleExportJSON} />
          <RowButton icon={<Download className="h-4 w-4" />} iconColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-400"
            title="Export Trips (CSV)" sub="Open in Excel or Numbers" onClick={handleExportTripsCSV} />
          <RowButton icon={<Download className="h-4 w-4" />} iconColor="bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-400"
            title="Export Fill-Ups (CSV)" sub="Open in Excel or Numbers" onClick={handleExportFillUpsCSV} />
        </div>
      </Section>

      {/* ── Import ── */}
      <Section title="Import Data">
        <div className="bg-card border border-card-border rounded-2xl p-4 space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Import Mode</Label>
            <div className="flex gap-2">
              {(["merge", "replace"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setImportMode(m)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-xs font-semibold border transition-all",
                    importMode === m
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m === "merge" ? "Merge (keep existing)" : "Replace (clear existing)"}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 p-3 border border-border rounded-xl hover:bg-muted/30 cursor-pointer transition-colors">
            <input ref={jsonFileRef} type="file" accept=".json" className="hidden" onChange={handleImportJSON} />
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/60 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-sm">Restore from Backup</p>
              <p className="text-xs text-muted-foreground">JSON file — replaces all data</p>
            </div>
          </label>

          {!tripPreview ? (
            <label className="flex items-center gap-3 p-3 border border-border rounded-xl hover:bg-muted/30 cursor-pointer transition-colors">
              <input ref={tripFileRef} type="file" accept=".csv" className="hidden" onChange={handleTripFileSelect} />
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Upload className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-sm">Import Trips CSV</p>
                <p className="text-xs text-muted-foreground">Must match exported format</p>
              </div>
            </label>
          ) : (
            <ImportPreviewCard
              title="Trips Import Preview"
              total={tripPreview.records.length}
              duplicates={duplicatesInTrips}
              errors={tripPreview.errors}
              mode={importMode}
              onConfirm={handleImportTrips}
              onCancel={() => setTripPreview(null)}
              preview={tripPreview.records.slice(0, 3).map(t => `${t.date?.split("T")[0]} · ${t.distance} km · ${t.category}`)}
            />
          )}

          {!fillUpPreview ? (
            <label className="flex items-center gap-3 p-3 border border-border rounded-xl hover:bg-muted/30 cursor-pointer transition-colors">
              <input ref={fillUpFileRef} type="file" accept=".csv" className="hidden" onChange={handleFillUpFileSelect} />
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Upload className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-sm">Import Fill-Ups CSV</p>
                <p className="text-xs text-muted-foreground">Must match exported format</p>
              </div>
            </label>
          ) : (
            <ImportPreviewCard
              title="Fill-Ups Import Preview"
              total={fillUpPreview.records.length}
              duplicates={duplicatesInFillUps}
              errors={fillUpPreview.errors}
              mode={importMode}
              onConfirm={handleImportFillUps}
              onCancel={() => setFillUpPreview(null)}
              preview={fillUpPreview.records.slice(0, 3).map(f => `${f.date?.split("T")[0]} · ${f.liters}L · $${f.pricePerUnit}/L`)}
            />
          )}
        </div>
      </Section>

      {/* ── Danger zone ── */}
      <Section title="Danger Zone">
        <div className="bg-card border border-destructive/30 rounded-2xl overflow-hidden">
          <button
            onClick={handleResetData}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-destructive/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-400 flex items-center justify-center shrink-0">
              <X className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-sm text-destructive">Reset All Data</p>
              <p className="text-xs text-muted-foreground">Permanently delete all trips, fill-ups & maintenance</p>
            </div>
          </button>
        </div>
      </Section>

      <p className="text-center text-xs text-muted-foreground py-2">
        Trip Tracker v2.0 · {trips.length} trips · {fillUps.length} fill-ups
      </p>
    </div>
  );
}

function downloadFile(content: string, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function today() { return new Date().toISOString().split("T")[0]; }
