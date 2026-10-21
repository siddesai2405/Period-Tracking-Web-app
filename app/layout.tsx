import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Lotus Phase - AI Period & Wellness Companion",
  description:
    "Predict your cycle, log symptoms, get AI insights, and chat with a caring health assistant.",
  applicationName: "Lotus Phase",
  manifest: "/manifest.webmanifest",
  keywords: ["period tracker", "menstrual health", "AI", "ovulation", "wellness"],
  icons: {
    icon: [{ url: "/logo-core.png", sizes: "1024x1024", type: "image/png" }],
    apple: [{ url: "/logo-core.png", sizes: "1024x1024", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff7fa" },
    { media: "(prefers-color-scheme: dark)", color: "#13111c" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${display.variable}`}>
      <body className="page-bg min-h-screen font-sans antialiased">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
