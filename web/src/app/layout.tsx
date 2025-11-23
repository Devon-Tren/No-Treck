import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '@/lib/authProvider'

export const metadata: Metadata = {
  title: "No Trek",
  description:
    "Give us the destination — we’ll make the journey. Medical-first guidance with concierge extras.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className="min-h-dvh bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100 antialiased"
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
