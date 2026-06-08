import React, { Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

// i18n must be imported before any component that uses it
import "@/i18n";
import { applyLanguageDirection, type SupportedLanguage } from "@/i18n";

// Layout
import { RootLayout } from "@/components/layout/RootLayout";

// Pages (lazy-loaded for code splitting)
const HomePage     = React.lazy(() => import("@/pages/HomePage"));
const AboutPage    = React.lazy(() => import("@/pages/AboutPage"));
const ProjectsPage = React.lazy(() => import("@/pages/ProjectsPage"));
const NewsPage     = React.lazy(() => import("@/pages/NewsPage"));
const ContactPage  = React.lazy(() => import("@/pages/ContactPage"));
const NotFoundPage = React.lazy(() => import("@/pages/NotFoundPage"));

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
            <Route element={<RootLayout />}>
              <Route index element={<HomePage />} />
              <Route path="about"    element={<AboutPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="news"     element={<NewsPage />} />
              <Route path="contact"  element={<ContactPage />} />
              <Route path="404"      element={<NotFoundPage />} />
              <Route path="*"        element={<Navigate to="/404" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
