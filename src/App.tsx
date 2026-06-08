import React, { Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

// i18n must be imported before any component that uses it
import "@/i18n";
import { applyLanguageDirection, type SupportedLanguage } from "@/i18n";

// Layout
import { RootLayout } from "@/components/layout/RootLayout";

// Admin components (not lazy — needed immediately after login)
import AdminGuard  from "@/components/admin/AdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";

// Public pages (lazy-loaded for code splitting)
const HomePage          = React.lazy(() => import("@/pages/HomePage"));
const AboutPage         = React.lazy(() => import("@/pages/AboutPage"));
const ProjectsPage      = React.lazy(() => import("@/pages/ProjectsPage"));
const ProjectDetailPage = React.lazy(() => import("@/pages/ProjectDetailPage"));
const NewsPage          = React.lazy(() => import("@/pages/NewsPage"));
const NewsDetailPage    = React.lazy(() => import("@/pages/NewsDetailPage"));
const ContactPage       = React.lazy(() => import("@/pages/ContactPage"));
const JoinPage          = React.lazy(() => import("@/pages/JoinPage"));
const GalleryPage       = React.lazy(() => import("@/pages/GalleryPage"));
const NotFoundPage      = React.lazy(() => import("@/pages/NotFoundPage"));

// Admin pages (lazy-loaded)
const AdminLoginPage       = React.lazy(() => import("@/pages/admin/AdminLoginPage"));
const AdminDashboardPage   = React.lazy(() => import("@/pages/admin/AdminDashboardPage"));
const AdminProjectsPage    = React.lazy(() => import("@/pages/admin/AdminProjectsPage"));
const AdminNewsPage        = React.lazy(() => import("@/pages/admin/AdminNewsPage"));
const AdminTeamPage        = React.lazy(() => import("@/pages/admin/AdminTeamPage"));
const AdminTestimonialsPage = React.lazy(() => import("@/pages/admin/AdminTestimonialsPage"));
const AdminGalleryPage     = React.lazy(() => import("@/pages/admin/AdminGalleryPage"));
const AdminContactsPage    = React.lazy(() => import("@/pages/admin/AdminContactsPage"));
const AdminMembershipsPage = React.lazy(() => import("@/pages/admin/AdminMembershipsPage"));
const AdminStatsPage       = React.lazy(() => import("@/pages/admin/AdminStatsPage"));

// ── React Query client ──────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5 minutes
      gcTime:    1000 * 60 * 10, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// ── Page loading fallback ───────────────────────────────────────────
function PageLoader(): React.ReactElement {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-accent animate-spin" />
        <p className="text-muted-foreground text-sm animate-pulse">
          مؤسسة نهر ديالى
        </p>
      </div>
    </div>
  );
}

// ── Direction sync component ────────────────────────────────────────
function DirectionSync(): null {
  const { i18n } = useTranslation();

  useEffect(() => {
    applyLanguageDirection(i18n.language as SupportedLanguage);
  }, [i18n.language]);

  return null;
}

// ── App ─────────────────────────────────────────────────────────────
export default function App(): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <DirectionSync />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Public routes ─────────────────────────────────── */}
            <Route element={<RootLayout />}>
              <Route index element={<HomePage />} />
              <Route path="about"          element={<AboutPage />} />
              <Route path="projects"        element={<ProjectsPage />} />
              <Route path="projects/:slug"  element={<ProjectDetailPage />} />
              <Route path="news"            element={<NewsPage />} />
              <Route path="news/:slug"      element={<NewsDetailPage />} />
              <Route path="contact"         element={<ContactPage />} />
              <Route path="join"            element={<JoinPage />} />
              <Route path="gallery"         element={<GalleryPage />} />
              <Route path="404"             element={<NotFoundPage />} />
              <Route path="*"              element={<Navigate to="/404" replace />} />
            </Route>

            {/* ── Admin: login (public) ──────────────────────────── */}
            <Route path="admin/login" element={<AdminLoginPage />} />

            {/* ── Admin: protected routes ───────────────────────── */}
            <Route element={<AdminGuard />}>
              <Route element={<AdminLayout />}>
                <Route path="admin"              element={<AdminDashboardPage />} />
                <Route path="admin/projects"     element={<AdminProjectsPage />} />
                <Route path="admin/news"         element={<AdminNewsPage />} />
                <Route path="admin/team"         element={<AdminTeamPage />} />
                <Route path="admin/testimonials" element={<AdminTestimonialsPage />} />
                <Route path="admin/gallery"      element={<AdminGalleryPage />} />
                <Route path="admin/contacts"     element={<AdminContactsPage />} />
                <Route path="admin/memberships"  element={<AdminMembershipsPage />} />
                <Route path="admin/stats"        element={<AdminStatsPage />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
