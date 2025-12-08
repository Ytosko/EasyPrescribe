import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Script from "next/script";

import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://easyprescribe.app'),
  title: {
    default: "Easy Prescribe - Modern Medical Profiling",
    template: "%s | Easy Prescribe"
  },
  description: "Secure, efficient, and modern prescription management for doctors. Create professional prescriptions in seconds.",
  keywords: ["medical prescription", "doctor software", "patient management", "e-prescription", "bangladesh doctor"],
  authors: [{ name: "Easy Prescribe Team" }],
  creator: "Easy Prescribe",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Easy Prescribe - Modern Medical Profiling",
    description: "Secure, efficient, and modern prescription management for doctors. Join hundreds of healthcare professionals.",
    siteName: "Easy Prescribe",
    images: [
      {
        url: "/og-image.jpg", // We'll need to make sure this exists or use a stock one
        width: 1200,
        height: 630,
        alt: "Easy Prescribe - Digital Prescription Management"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Easy Prescribe - Modern Medical Profiling",
    description: "Secure, efficient, and modern prescription management for doctors.",
    images: ["/og-image.jpg"]
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png'
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
