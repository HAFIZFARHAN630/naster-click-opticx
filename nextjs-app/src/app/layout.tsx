import React from "react";
import "./globals.css";

export const metadata = {
  title: "Master Click Opticx",
  description: "ISP Management Suite Frontend",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
