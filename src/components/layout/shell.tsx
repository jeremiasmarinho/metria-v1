"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

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
    <div className="flex min-h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[1px] transition-all duration-300 ease-in-out md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="hidden md:flex">
        <Sidebar />
      </div>

      <div
        className={`fixed inset-y-0 left-0 z-40 transform transition-all duration-300 ease-in-out md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden bg-muted/20">
        <Header
          title={title}
          breadcrumbs={breadcrumbs}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-6 md:p-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
