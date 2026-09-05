"use client";

import { useState, useEffect } from "react";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { ToastProvider } from "@/components/Toast";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ihsg_sidebar_collapsed");
      if (saved === "true") setIsCollapsed(true);
    } catch {}
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("ihsg_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  return (
    <html lang="id" className="dark">
      <head>
        <title>IHSG Slayer PRO | Terminal Kuantitatif Saham BEI</title>
        <meta
          name="description"
          content="Platform Kuantitatif & Bandar Order-Flow Analytics Saham Bursa Efek Indonesia (BEI)"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-darkBg text-slate-100 min-h-screen antialiased flex flex-col font-sans">
        <ToastProvider>
          {/* Sidebar Nav */}
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            isCollapsed={isCollapsed}
            onToggleCollapse={handleToggleCollapse}
          />

          {/* Main Content Area */}
          <div
            className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
              isCollapsed ? "lg:pl-20" : "lg:pl-72"
            }`}
          >
            <Header
              onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
              isCollapsed={isCollapsed}
              onToggleCollapse={handleToggleCollapse}
            />

            <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
              {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-cardBorder bg-cardBg/60 py-4 text-center text-xs text-slate-500 font-mono">
              <p>
                IHSG Slayer PRO &copy; 2026. Platform Kuantitatif Pasar Modal Indonesia &bull; Bukan Nasihat Keuangan.
              </p>
            </footer>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
