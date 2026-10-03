import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { DesktopSidebar } from "@/components/DesktopSidebar";

export const metadata: Metadata = {
  title: "Scrap Pay — Sell Scrap, Save Planet ♻️",
  description:
    "India's modern digital scrap collection and recycling platform. Get the best rates for your scrap, schedule pickups, and contribute to a greener planet.",
  icons: {
    icon: "/icon.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 antialiased flex hide-scrollbar h-screen overflow-hidden text-gray-900">
        
        {/* Desktop Sidebar (hidden on mobile) */}
        <DesktopSidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 w-full h-full relative overflow-y-auto hide-scrollbar bg-gray-50 md:bg-gray-100/50">
          <main className="w-full min-h-full flex flex-col">{children}</main>
        </div>

        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
            style: { fontFamily: "Inter, system-ui, sans-serif" },
          }}
        />
      </body>
    </html>
  );
}
