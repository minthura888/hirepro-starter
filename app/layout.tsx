// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HirePro Türkiye | Online İş Fırsatları',
  description:
    'HirePro ile Türkiye’de online yarı zamanlı ve tam zamanlı iş fırsatlarını keşfedin. Evden çalışın ve günlük kazanç elde edin.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
