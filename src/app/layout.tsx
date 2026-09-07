import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LUXUS Aluminium Kitchen Quote Designer',
  description:
    'Deterministic kitchen-layout engine, SVG elevations, isometric wireframe projection, confidential pricing architecture, and instant quotation generator.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
