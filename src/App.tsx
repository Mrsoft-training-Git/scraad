import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import IndividualLearner from "./pages/IndividualLearner";
import BusinessTeams from "./pages/BusinessTeams";
import Programs from "./pages/Programs";
import ProgramDetails from "./pages/ProgramDetails";
import Career from "./pages/Career";
import CareerManagement from "./pages/CareerManagement";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import CourseAllocation from "./pages/CourseAllocation";
import DashboardCourses from "./pages/DashboardCourses";
import DraftCourses from "./pages/DraftCourses";
import CreateContent from "./pages/CreateContent";
import Learning from "./pages/Learning";
import ManageClasses from "./pages/ManageClasses";
import Payments from "./pages/Payments";
import Profile from "./pages/Profile";
import References from "./pages/References";
import RoleManagement from "./pages/RoleManagement";
import UserManagement from "./pages/UserManagement";
import ScrollToTop from "./components/ScrollToTop";
import CourseViewer from "./pages/CourseViewer";
import CourseAnnouncements from "./pages/CourseAnnouncements";
import CourseDiscussions from "./pages/CourseDiscussions";
import CourseAssignments from "./pages/CourseAssignments";
import InstructorLiveClass from "./pages/InstructorLiveClass";
import StudentLiveClass from "./pages/StudentLiveClass";
import ZoomCallback from "./pages/ZoomCallback";
import CourseEnrollment from "./pages/CourseEnrollment";
import Bills from "./pages/Bills";
import LiveSessions from "./pages/LiveSessions";
import Enrollments from "./pages/Enrollments";
import ResetPassword from "./pages/ResetPassword";
import ProgramManagement from "./pages/ProgramManagement";
import ProgramDashboard from "./pages/ProgramDashboard";
import InstructorProgramManage from "./pages/InstructorProgramManage";
import CBTExamList from "./pages/CBTExamList";
import CBTExamCreate from "./pages/CBTExamCreate";
import CBTExamManage from "./pages/CBTExamManage";
import CBTExamView from "./pages/CBTExamView";
import CBTExamTake from "./pages/CBTExamTake";
import CBTSubmissions from "./pages/CBTSubmissions";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PWAInstallPrompt />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/career" element={<CareerManagement />} />
          <Route path="/dashboard/course-allocation" element={<CourseAllocation />} />
          <Route path="/dashboard/courses" element={<DashboardCourses />} />
          <Route path="/dashboard/create-content" element={<CreateContent />} />
          <Route path="/dashboard/drafts" element={<DraftCourses />} />
          <Route path="/dashboard/learning" element={<Learning />} />
          <Route path="/dashboard/learn/:courseId" element={<CourseViewer />} />
          <Route path="/dashboard/classes" element={<ManageClasses />} />
          <Route path="/dashboard/announcements" element={<CourseAnnouncements />} />
          <Route path="/dashboard/discussions" element={<CourseDiscussions />} />
          <Route path="/dashboard/assignments" element={<CourseAssignments />} />
          <Route path="/dashboard/live-class/:sessionId" element={<InstructorLiveClass />} />
          <Route path="/dashboard/join-class/:sessionId" element={<StudentLiveClass />} />
          <Route path="/dashboard/payments" element={<Payments />} />
          <Route path="/dashboard/bills" element={<Bills />} />
          <Route path="/dashboard/live-sessions" element={<LiveSessions />} />
          <Route path="/dashboard/enrollments" element={<Enrollments />} />
          <Route path="/dashboard/profile" element={<Profile />} />
          <Route path="/dashboard/references" element={<References />} />
          <Route path="/dashboard/roles" element={<RoleManagement />} />
          <Route path="/dashboard/programs" element={<ProgramManagement />} />
          <Route path="/dashboard/programs/:programId" element={<ProgramDashboard />} />
          <Route path="/dashboard/users" element={<UserManagement />} />
          <Route path="/dashboard/cbt" element={<CBTExamList />} />
          <Route path="/dashboard/cbt/create" element={<CBTExamCreate />} />
          <Route path="/dashboard/cbt/:examId" element={<CBTExamView />} />
          <Route path="/dashboard/cbt/:examId/manage" element={<CBTExamManage />} />
          <Route path="/dashboard/cbt/:examId/take" element={<CBTExamTake />} />
          <Route path="/dashboard/cbt/:examId/submissions" element={<CBTSubmissions />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/signup/individual" element={<IndividualLearner />} />
          <Route path="/signup/organization" element={<BusinessTeams />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/programs/:id" element={<ProgramDetails />} />
          <Route path="/enroll/:courseId" element={<CourseEnrollment />} />
          <Route path="/career" element={<Career />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/api/zoom/callback" element={<ZoomCallback />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
