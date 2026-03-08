import "./globals.css";
import type { Metadata } from "next";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

export const metadata: Metadata = {
  title: "BrightSmile Dental Clinic",
  description: "Dental clinic booking system built with Next.js and Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="relative min-h-screen overflow-x-hidden">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-[#f7fcff] via-[#edf7fd] to-[#dff0f8]" />
          <div className="absolute -left-24 top-20 h-80 w-80 rounded-full bg-[#7bbde8]/30 blur-3xl" />
          <div className="absolute -right-20 bottom-16 h-[24rem] w-[24rem] rounded-full bg-[#6ea2b3]/28 blur-3xl" />
        </div>

        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
