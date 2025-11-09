import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navigation from "@/components/Navigation";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

// Custom fonts for the redesign
const aveburgGrande = localFont({
  src: "./fonts/Aveburg-Grande-Demo.otf",
  variable: "--font-aveburg",
  weight: "400",
});

const roobertTrial = localFont({
  src: "./fonts/RoobertTRIALVF-BF67243fd545701.ttf",
  variable: "--font-roobert",
  weight: "400 500",
});

const abcStefan = localFont({
  src: "./fonts/ABCStefan-Simple-Trial.otf",
  variable: "--font-abc-stefan",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Hacktogone 2025 | Carbon Scoring Platform",
  description:
    "Calculate and track carbon footprint with our advanced scoring platform powered by Snowflake.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${aveburgGrande.variable} ${roobertTrial.variable} ${abcStefan.variable}`}
      >
        <Navigation />
        {children}
      </body>
    </html>
  );
}
