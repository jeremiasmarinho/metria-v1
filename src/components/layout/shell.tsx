"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { CommandPalette } from "./command-palette";

export function Shell({
  children,
  title,
  breadcrumbs,
}: {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-100 dark:bg-zinc-950">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[1px] transition-all duration-300 ease-in-out md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="hidden h-screen shrink-0 md:sticky md:top-0 md:flex">
        <Sidebar />
      </div>

      <div
        className={`fixed inset-y-0 left-0 z-40 transform transition-all duration-300 ease-in-out md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_38%)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.1),transparent_36%)]" />
        <CommandPalette />
        <Header
          title={title}
          breadcrumbs={breadcrumbs}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="relative z-10 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-6 md:p-10">
            <div className="app-glass-blue rounded-2xl p-4 md:p-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
