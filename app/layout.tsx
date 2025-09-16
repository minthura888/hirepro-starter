// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HirePro',
  description: 'Grab our jobs — flexible, remote work.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* Add theme + smoothing so Tailwind styles show */}
      <body className="bg-[var(--light)] text-[var(--text)] antialiased">
        {children}
      </body>
    </html>
  );
}
