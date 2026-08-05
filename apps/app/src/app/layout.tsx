import { ClerkProvider, UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'Despensa',
  description: 'Stop wasting food.'
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();

  return (
    <ClerkProvider>
      <html lang="pt-BR">
        <body className="min-h-dvh antialiased">
          {userId ? (
            <header className="border-b">
              <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
                <Link href="/pantry" className="font-semibold tracking-tight">
                  Despensa
                </Link>
                <UserButton />
              </div>
            </header>
          ) : null}
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
