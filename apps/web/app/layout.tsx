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
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
