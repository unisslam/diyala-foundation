/**
 * RootLayout.tsx
 * --------------
 * Wraps every page with:
 *  - Sticky glass Navbar
 *  - Main content area
 *  - Footer
 *
 * Uses React Router's <Outlet /> for nested routes.
 */

import { Outlet } from "react-router-dom";
import { Navbar }  from "./Navbar";
import { Footer }  from "./Footer";

export function RootLayout(): React.ReactElement {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Skip-to-content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>

      <Navbar />

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
