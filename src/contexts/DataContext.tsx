import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  getTrips, addTrip, updateTrip, deleteTrip,
  getFillUps, addFillUp, updateFillUp, deleteFillUp,
  getMaintenance, addMaintenance, updateMaintenance, deleteMaintenance,
  getVehicleCosts, addVehicleCost, updateVehicleCost, deleteVehicleCost,
} from "../lib/db";
import type { Trip, FillUp, Maintenance, VehicleCost } from "../types";

interface DataContextType {
  trips: Trip[];
  fillUps: FillUp[];
  maintenance: Maintenance[];
  vehicleCosts: VehicleCost[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
  createTrip: (trip: Trip) => Promise<void>;
  editTrip: (trip: Trip) => Promise<void>;
  removeTrip: (id: string) => Promise<void>;
  createFillUp: (fillUp: FillUp) => Promise<void>;
  editFillUp: (fillUp: FillUp) => Promise<void>;
  removeFillUp: (id: string) => Promise<void>;
  createMaintenance: (record: Maintenance) => Promise<void>;
  editMaintenance: (record: Maintenance) => Promise<void>;
  removeMaintenance: (id: string) => Promise<void>;
  createVehicleCost: (record: VehicleCost) => Promise<void>;
  editVehicleCost: (record: VehicleCost) => Promise<void>;
  removeVehicleCost: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [fillUps, setFillUps] = useState<FillUp[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [vehicleCosts, setVehicleCosts] = useState<VehicleCost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = async () => {
    try {
      const [t, f, m, v] = await Promise.all([
        getTrips(), getFillUps(), getMaintenance(), getVehicleCosts()
      ]);
      setTrips(t);
      setFillUps(f);
      setMaintenance(m);
      setVehicleCosts(v);
    } catch (err) {
      console.error("Failed to load data", err);
    }
  };

  useEffect(() => {
    refreshData().finally(() => setIsLoading(false));
  }, []);

  const createTrip = async (trip: Trip) => { await addTrip(trip); await refreshData(); };
  const editTrip = async (trip: Trip) => { await updateTrip(trip); await refreshData(); };
  const removeTrip = async (id: string) => { await deleteTrip(id); await refreshData(); };

  const createFillUp = async (fillUp: FillUp) => { await addFillUp(fillUp); await refreshData(); };
  const editFillUp = async (fillUp: FillUp) => { await updateFillUp(fillUp); await refreshData(); };
  const removeFillUp = async (id: string) => { await deleteFillUp(id); await refreshData(); };

  const createMaintenance = async (r: Maintenance) => { await addMaintenance(r); await refreshData(); };
  const editMaintenance = async (r: Maintenance) => { await updateMaintenance(r); await refreshData(); };
  const removeMaintenance = async (id: string) => { await deleteMaintenance(id); await refreshData(); };

  const createVehicleCost = async (r: VehicleCost) => { await addVehicleCost(r); await refreshData(); };
  const editVehicleCost = async (r: VehicleCost) => { await updateVehicleCost(r); await refreshData(); };
  const removeVehicleCost = async (id: string) => { await deleteVehicleCost(id); await refreshData(); };

  return (
    <DataContext.Provider value={{
      trips, fillUps, maintenance, vehicleCosts, isLoading, refreshData,
      createTrip, editTrip, removeTrip,
      createFillUp, editFillUp, removeFillUp,
      createMaintenance, editMaintenance, removeMaintenance,
      createVehicleCost, editVehicleCost, removeVehicleCost,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
}
