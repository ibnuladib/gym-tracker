import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Nav } from "@/components/Nav";
import { TopBar } from "@/components/TopBar";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Gym Tracker",
  description: "Log workouts, see your training heatmap, track PRs.",
  manifest: "/manifest.webmanifest",
  applicationName: "Gym Tracker",
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.svg" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Gym" },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen font-mono antialiased">
        <StoreProvider>
          <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col px-3 pb-28 pt-2 sm:px-4 sm:pt-4">
            <TopBar />
            <main className="flex-1 animate-[fadeIn_200ms_ease-out]">{children}</main>
          </div>
          <Nav />
          <ServiceWorkerRegister />
        </StoreProvider>
      </body>
    </html>
  );
}
