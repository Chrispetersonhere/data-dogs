import type { ReactNode } from 'react';

export const metadata = {
  title: 'Data Dogs',
  description: 'Institutional design system showcase'
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head>
        <style>{`
          @keyframes dd-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
          .dd-skeleton { animation: dd-pulse 1.5s ease-in-out infinite; }
        `}</style>
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
