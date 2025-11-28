import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import IndividualLearner from "./pages/IndividualLearner";
import BusinessTeams from "./pages/BusinessTeams";
import Programs from "./pages/Programs";
import Career from "./pages/Career";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import CourseAllocation from "./pages/CourseAllocation";
import DashboardCourses from "./pages/DashboardCourses";
import CreateContent from "./pages/CreateContent";
import Learning from "./pages/Learning";
import ManageClasses from "./pages/ManageClasses";
import Payments from "./pages/Payments";
import Profile from "./pages/Profile";
import References from "./pages/References";
import RoleManagement from "./pages/RoleManagement";
import UserManagement from "./pages/UserManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/course-allocation" element={<CourseAllocation />} />
          <Route path="/dashboard/courses" element={<DashboardCourses />} />
          <Route path="/dashboard/create-content" element={<CreateContent />} />
          <Route path="/dashboard/learning" element={<Learning />} />
          <Route path="/dashboard/classes" element={<ManageClasses />} />
          <Route path="/dashboard/payments" element={<Payments />} />
          <Route path="/dashboard/profile" element={<Profile />} />
          <Route path="/dashboard/references" element={<References />} />
          <Route path="/dashboard/roles" element={<RoleManagement />} />
          <Route path="/dashboard/users" element={<UserManagement />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/signup/individual" element={<IndividualLearner />} />
          <Route path="/signup/organization" element={<BusinessTeams />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/career" element={<Career />} />
          <Route path="/auth" element={<Auth />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
