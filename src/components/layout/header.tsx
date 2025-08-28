import Link from 'next/link';
import { UserNav } from '@/components/auth/user-nav';
import { Globe, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Globe className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block">
              BiblioGlobusTourWeaveApp
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
                href="/ai-assistant"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
                AI Assistant
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <UserNav />
        </div>
      </div>
    </header>
  );
}
