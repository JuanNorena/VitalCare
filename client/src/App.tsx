import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";
import AuthPage from "@/pages/auth-page";
import ChangePasswordPage from "@/pages/auth/change-password";
import BookAppointment from "@/pages/appointments/book";
import ViewAppointments from "@/pages/appointments/view";
import CheckIn from "@/pages/appointments/checkin";
import Services from "@/pages/admin/services";
import ServicePoints from "@/pages/admin/service-points";
import Branches from "@/pages/admin/branches";
import SelfServices from "@/pages/admin/self-services";
import GenerateTurn from "@/pages/self-services/generate-turn";
import Schedule from "@/pages/admin/schedule";
import Settings from "@/pages/admin/settings";
import Users from "@/pages/admin/users";
import Dashboard from "@/pages/admin/dashboard";
import StaffAssignments from "@/pages/admin/staff-assignments";
import SelfServiceAssignments from "@/pages/admin/selfservice-assignments";
import VisualizerAssignments from "@/pages/admin/visualizer-assignments";
import VisualizerDashboard from "@/pages/visualizer/dashboard";
import SurveysManagement from "@/pages/admin/surveys";
import PublicSurvey from "@/pages/surveys/public-survey";
import CustomBookingPages from "@/pages/admin/custom-booking-pages";
import BranchSettings from "@/pages/admin/branch-settings";
import PublicBookingPage from "@/pages/booking/public-page";

import Forms from "@/pages/admin/forms";
import FormFields from "@/pages/admin/form-fields";
import WaitTimeReports from "@/pages/admin/wait-time-reports";
import QueueDisplay from "@/pages/queue/display";
import QueueManage from "@/pages/queue/manage";
import "./i18n";
import { useEffect } from "react";
import { FullscreenProvider, useFullscreen } from "@/contexts/fullscreen-context";

function Router() {
  const { user, isLoading } = useUser();
  const [location, setLocation] = useLocation();
  const { isFullscreen } = useFullscreen();// Función para obtener la ruta por defecto según el rol
  const getDefaultRoute = (role: string) => {
    switch (role) {
      case "admin":
        return "/admin/dashboard";
      case "staff":
        return "/queue/manage";
      case "selfservice":
        return "/self-services/generate-turn";
      case "visualizer":
        return "/visualizer/dashboard";
      default:
        return "/appointments/book";
    }
  };
  useEffect(() => {
    if (user) {
      const defaultRoute = getDefaultRoute(user.role);
      // Solo redirigir si estamos en la raíz o en una ruta no permitida
      if (location === "/" || 
          (user.role !== "admin" && location.startsWith("/admin")) ||
          (user.role !== "staff" && location === "/queue/manage") ||
          (user.role !== "visualizer" && location.startsWith("/visualizer")) ||
          (user.role === "visualizer" && !location.startsWith("/visualizer")) ||
          (user.role === "selfservice" && !location.startsWith("/self-services"))) {
        setLocation(defaultRoute);
      }
    }
  }, [user, location, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // Rutas públicas (sin autenticación requerida)
  if (location.startsWith("/survey/") || location.startsWith("/booking/")) {
    return (
      <div className="min-h-screen bg-background">
        <Switch>
          <Route path="/survey/:token" component={PublicSurvey} />
          <Route path="/booking/:slug" component={PublicBookingPage} />
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }
  if (user.mustChangePassword) {
    return <ChangePasswordPage />;
  }
  // Si estamos en pantalla completa y en rutas específicas, renderizar solo el componente
  if (isFullscreen) {
    if (location === "/visualizer/dashboard" && user.role === "visualizer") {
      return (
        <div className="min-h-screen bg-background">
          <VisualizerDashboard />
          <Toaster />
        </div>
      );
    }
    
    if ((location === "/self-services/generate-turn" && user.role === "selfservice") ||
        (location === "/admin/generate-turn" && user.role === "admin")) {
      return (
        <div className="min-h-screen bg-background">
          <GenerateTurn />
          <Toaster />
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex flex-col lg:grid lg:grid-cols-5">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <div className="col-span-4 lg:border-l p-4 sm:p-6 lg:p-8">
          <Switch>            {/* Rutas específicas de administrador */}            
          {user.role === "admin" && (
              <>
                <Route path="/admin/dashboard" component={Dashboard} />                
                <Route path="/admin/services" component={Services} />
                <Route path="/admin/branches" component={Branches} />
                <Route path="/admin/branch-settings" component={BranchSettings} />
                <Route path="/admin/service-points" component={ServicePoints} />
                <Route path="/admin/self-services" component={SelfServices} />
                <Route path="/admin/generate-turn" component={GenerateTurn} />
                <Route path="/admin/schedule" component={Schedule} />
                <Route path="/admin/settings" component={Settings} />                
                <Route path="/admin/users" component={Users} />
                <Route path="/admin/staff-assignments" component={StaffAssignments} />
                <Route path="/admin/selfservice-assignments" component={SelfServiceAssignments} />
                <Route path="/admin/visualizer-assignments" component={VisualizerAssignments} />
                <Route path="/admin/wait-time-reports" component={WaitTimeReports} />
                <Route path="/admin/forms" component={Forms} />
                <Route path="/admin/forms/:formId/fields" component={FormFields} />
                <Route path="/admin/surveys" component={SurveysManagement} />
                <Route path="/admin/custom-pages" component={CustomBookingPages} />
                <Route path="/appointments/checkin" component={CheckIn} />
              </>            )}{/* Rutas específicas de staff */}
            {user.role === "staff" && (
              <>
                <Route path="/queue/manage" component={QueueManage} />
                <Route path="/appointments/checkin" component={CheckIn} />
              </>
            )}{/* Rutas específicas de selfservice */}
            {user.role === "selfservice" && (
              <Route path="/self-services/generate-turn" component={GenerateTurn} />
            )}            {/* Rutas específicas de visualizer */}
            {user.role === "visualizer" && (
              <Route path="/visualizer/dashboard" component={VisualizerDashboard} />
            )}

            {/* Rutas comunes para usuarios (excluyendo selfservice y visualizer) */}
            {user.role !== "selfservice" && user.role !== "visualizer" && (
              <>
                <Route path="/appointments/book" component={BookAppointment} />
                <Route path="/appointments/view" component={ViewAppointments} />
              </>
            )}
            <Route path="/queue/display" component={QueueDisplay} />

            {/* Ruta raíz y redirecciones */}
            <Route path="/">
              {() => {
                if (!user) return null;
                return <Redirect to={getDefaultRoute(user.role)} />;
              }}
            </Route>

            {/* Página 404 para rutas no encontradas */}
            <Route component={NotFound} />
          </Switch>
        </div>
      </div>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FullscreenProvider>
        <Router />
      </FullscreenProvider>
    </QueryClientProvider>
  );
}

export default App;