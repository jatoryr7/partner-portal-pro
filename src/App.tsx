import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";

import NotFound from "./pages/NotFound";

// ─── Public Zone (/)
import PublicBrandDirectory from "./pages/public/PublicBrandDirectory";
import BrandIntegrityPortal from "./pages/public/BrandIntegrityPortal";

// ─── Partner Zone (/partner/*)
import PartnerDashboard from "./pages/partner/PartnerDashboard";
import PartnerLogin from "./pages/partner/PartnerLogin";
import { OnboardingWizard } from "./components/OnboardingWizard";

// ─── Admin Zone (/admin/*)
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StakeholderDashboard from "./pages/admin/StakeholderDashboard";
import AdminQueue from "./pages/admin/AdminQueue";
import SubmissionReview from "./pages/admin/SubmissionReview";
import UserManagement from "./pages/admin/UserManagement";
import BrandDirectory from "./pages/admin/BrandDirectory";
import DealsManagement from "./pages/admin/DealsManagement";
import NativeView from "./pages/admin/NativeView";
import PaidSocialView from "./pages/admin/PaidSocialView";
import MediaView from "./pages/admin/MediaView";
import NewsletterView from "./pages/admin/NewsletterView";
import ContentMarketingView from "./pages/admin/ContentMarketingView";
import AdminSettings from "./pages/admin/AdminSettings";
import ExternalAccessHub from "./components/admin/ExternalAccessHub";
import MedicalReviewPage from "./pages/admin/MedicalReviewPage";
import { AdminAnalyticsPage, AdminFinancePage } from "./pages/admin/AdminPlaceholderPage";
import AdminGatewaysPage from "./pages/admin/AdminGatewaysPage";
import InternalDashboard from "./pages/InternalDashboard";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary showDetails>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* ═══ PUBLIC ZONE (/) — Index / Public Directory ═══ */}
                <Route path="/" element={<PublicBrandDirectory />} />
                <Route path="/brand-application" element={<BrandIntegrityPortal />} />

                {/* ═══ PARTNER ZONE (/partner/*) ═══ */}
                <Route path="/partner/login" element={<PartnerLogin />} />
                <Route path="/partner/onboarding" element={<OnboardingWizard />} />
                <Route
                  path="/partner"
                  element={
                    <ProtectedRoute requiredRole="partner">
                      <ErrorBoundary>
                        <PartnerDashboard />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />

                {/* ═══ ADMIN ZONE (/admin/*) — AdminLayout wraps nested routes ═══ */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <ErrorBoundary>
                        <AdminLayout />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="queue" element={<AdminQueue />} />
                  <Route path="submission/:id" element={<SubmissionReview />} />
                  <Route path="stakeholders" element={<StakeholderDashboard />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="brands" element={<BrandDirectory />} />
                  <Route path="deals" element={<DealsManagement />} />
                  <Route path="native" element={<NativeView />} />
                  <Route path="paid-social" element={<PaidSocialView />} />
                  <Route path="media" element={<MediaView />} />
                  <Route path="newsletter" element={<NewsletterView />} />
                  <Route path="content-marketing" element={<ContentMarketingView />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="external-hub" element={<ExternalAccessHub />} />
                  <Route path="medical-review" element={<MedicalReviewPage />} />
                  <Route path="analytics" element={<AdminAnalyticsPage />} />
                  <Route path="finance" element={<AdminFinancePage />} />
                  <Route path="gateways" element={<AdminGatewaysPage />} />
                  <Route path="internal-dashboard" element={<InternalDashboard />} />
                </Route>

                {/* Legacy redirects */}
                <Route path="/auth/admin" element={<Navigate to="/admin/login" replace />} />
                <Route path="/auth/partner" element={<Navigate to="/partner/login" replace />} />
                <Route path="/auth" element={<Navigate to="/admin/login" replace />} />
                <Route path="/internal-dashboard" element={<Navigate to="/admin/internal-dashboard" replace />} />
                <Route path="/admin/admin-settings" element={<Navigate to="/admin/settings" replace />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
