import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tiltmeter Dashboard",
  description: "Analyze CS2 Faceit form and tilt signals"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
