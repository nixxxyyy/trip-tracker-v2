import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { BottomNav } from "@/components/BottomNav";
import { AppProvider } from "@/contexts/AppContext";
import { DataProvider } from "@/contexts/DataContext";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";

import Dashboard from "@/pages/Dashboard";
import AddTrip from "@/pages/AddTrip";
import AddFillUp from "@/pages/AddFillUp";
import Trips from "@/pages/Trips";
import FillUps from "@/pages/FillUps";
import SettingsPage from "@/pages/Settings";
import Analytics from "@/pages/Analytics";
import MaintenancePage from "@/pages/Maintenance";
import VehicleCostsPage from "@/pages/VehicleCosts";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function Router() {
  return (
    <div className="pb-[76px] pt-safe px-4 max-w-md mx-auto min-h-screen">
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/add" component={AddTrip} />
        <Route path="/add-fillup" component={AddFillUp} />
        <Route path="/trips" component={Trips} />
        <Route path="/fillups" component={FillUps} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/maintenance" component={MaintenancePage} />
        <Route path="/vehicle-costs" component={VehicleCostsPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <DataProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <div className="app-container">
                <Router />
                <BottomNav />
                <PWAInstallBanner />
              </div>
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </DataProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
