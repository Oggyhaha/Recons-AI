import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "ReconOS — Enterprise AI Finance Control Plane",
  description: "Autonomous financial reconciliation, exception intelligence, and real-time cash control powered by Razorpay settlement engine.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
        <Navbar />
        <div className="flex w-full">
          <Sidebar />
          <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 xl:p-10 w-full overflow-x-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
