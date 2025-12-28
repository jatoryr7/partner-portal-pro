import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Auth from "./pages/Auth";
import RoleRouter from "./pages/RoleRouter";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StakeholderDashboard from "./pages/admin/StakeholderDashboard";
import AdminQueue from "./pages/admin/AdminQueue";
import SubmissionReview from "./pages/admin/SubmissionReview";
import UserManagement from "./pages/admin/UserManagement";
import NativeView from "./pages/admin/NativeView";
import PaidSocialView from "./pages/admin/PaidSocialView";
import MediaView from "./pages/admin/MediaView";
import NewsletterView from "./pages/admin/NewsletterView";
import ContentMarketingView from "./pages/admin/ContentMarketingView";

// Partner pages
import PartnerDashboard from "./pages/partner/PartnerDashboard";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public auth routes */}
              <Route path="/auth/admin" element={<Auth />} />
              <Route path="/auth/partner" element={<Auth />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Role-based router */}
              <Route path="/" element={<RoleRouter />} />
              
              {/* Partner routes */}
              <Route path="/partner" element={
                <ProtectedRoute requiredRole="partner">
                  <PartnerDashboard />
                </ProtectedRoute>
              } />
              
              {/* Admin routes */}
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="queue" element={<AdminQueue />} />
                <Route path="submission/:id" element={<SubmissionReview />} />
                <Route path="stakeholders" element={<StakeholderDashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="native" element={<NativeView />} />
                <Route path="paid-social" element={<PaidSocialView />} />
                <Route path="media" element={<MediaView />} />
                <Route path="newsletter" element={<NewsletterView />} />
                <Route path="content-marketing" element={<ContentMarketingView />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
