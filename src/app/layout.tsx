import type { Metadata, Viewport } from "next";
import { Roboto_Slab, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Nav } from "@/components/Nav";
import { TopBar } from "@/components/TopBar";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const display = Roboto_Slab({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gym Tracker",
  description: "Log workouts, see your training heatmap, track PRs.",
  manifest: "/manifest.webmanifest",
  applicationName: "Gym Tracker",
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.svg" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Gym" },
};

export const viewport: Viewport = {
  themeColor: "#0e0c09",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${display.variable} ${mono.variable}`}>
      <body className="min-h-screen font-mono antialiased">
        <StoreProvider>
          <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col px-4 pb-28 pt-2 sm:px-6 sm:pt-4">
            <TopBar />
            <main className="flex-1 animate-[fadeIn_220ms_ease-out]">{children}</main>
          </div>
          <Nav />
          <ServiceWorkerRegister />
        </StoreProvider>
      </body>
    </html>
  );
}
