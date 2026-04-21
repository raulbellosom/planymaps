import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { WorkspaceProvider } from "@/contexts/workspace-context";
import { BlueprintToaster } from "@/components/ui/blueprint-toaster";
import { TooltipProvider } from "@/components/ui/tooltip-provider";

export const metadata: Metadata = {
  title: "Planymaps - Collaborative Canvas",
  description:
    "A real-time collaborative canvas for teams. Create boards, annotate layouts, and work together visually.",
  icons: {
    icon: "/planymaps.svg",
    apple: "/planymaps.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="antialiased">
        <TooltipProvider>
          <AuthProvider>
            <WorkspaceProvider>{children}</WorkspaceProvider>
          </AuthProvider>
          <BlueprintToaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
