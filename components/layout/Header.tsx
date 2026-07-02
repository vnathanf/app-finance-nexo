'use client';

import Link from 'next/link';
import UserMenu from '@/components/layout/UserMenu';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/dashboard" className="text-lg font-black tracking-tight">
          Nexo
        </Link>
        <UserMenu />
      </div>
    </header>
  );
}
