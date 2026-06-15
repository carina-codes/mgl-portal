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
  title: "MGL Client Platform",
  description:
    "Client execution platform — projects, requests, deliverables, time and client collaboration in one place.",
  openGraph: {
    title: "MGL Client Platform",
    description:
      "Client execution platform — projects, requests, deliverables, time and client collaboration in one place.",
    type: "website",
    images: [
      "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0a65033b-2174-46a9-8504-574e225b6b78/id-preview-e407b78a--251ba0b2-1b27-46a3-83b8-7e4263a57f43.lovable.app-1780912916499.png",
    ],
  },
  twitter: {
    card: "summary",
    title: "MGL Client Platform",
    description:
      "Client execution platform — projects, requests, deliverables, time and client collaboration in one place.",
    images: [
      "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0a65033b-2174-46a9-8504-574e225b6b78/id-preview-e407b78a--251ba0b2-1b27-46a3-83b8-7e4263a57f43.lovable.app-1780912916499.png",
    ],
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
