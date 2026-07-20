import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "True Workspace",
    template: "%s | True Workspace",
  },
  description: "Il workspace digitale di True Design: strumenti, servizi e applicazioni in un unico spazio.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
