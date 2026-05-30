import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Mythos Echo Agent - Dashboard",
  description: "Multilingual mythology indexer and creator workspace powered by Gemini and Elastic MCP Gateway",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="min-h-screen">
      <body className="min-h-screen antialiased text-slate-50 selection:bg-teal-400/30 relative overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
