import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "@/styles.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "MGL Portal",
  description:
    "Client execution platform — projects, requests, time and client collaboration in one place.",
  openGraph: {
    title: "MGL Portal",
    description:
      "Client execution platform — projects, requests, time and client collaboration in one place.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "MGL Portal",
    description:
      "Client execution platform — projects, requests, time and client collaboration in one place.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
