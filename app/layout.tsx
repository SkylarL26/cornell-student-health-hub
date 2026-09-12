import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { Providers } from "@/components/layout/providers";

export const metadata: Metadata = {
  title: "Cornell Student Health Hub",
  description:
    "Student-built prototype that helps Cornell students organize sick days, medications, care navigation, and class logistics. Not an official Cornell Health service and not a substitute for professional care.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <Providers>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:p-3">Skip to content</a>
          <Navbar />
          <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
