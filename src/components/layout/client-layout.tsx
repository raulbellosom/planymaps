"use client";

import { Navbar } from "./navbar";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <>
      <Navbar />
      <main className="pt-14 md:pt-16 min-h-screen">{children}</main>
    </>
  );
}
