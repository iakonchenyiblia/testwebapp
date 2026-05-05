'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';

export function Header() {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-900/95">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
            Bookify
          </span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/services" className="text-sm font-medium hover:text-primary-500 transition-colors">
            Services
          </Link>
          <Link href="/categories" className="text-sm font-medium hover:text-primary-500 transition-colors">
            Categories
          </Link>
          {isAuthenticated && (
            <Link href="/bookings" className="text-sm font-medium hover:text-primary-500 transition-colors">
              My Bookings
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link href="/dashboard" className="text-sm font-medium hover:text-primary-500 transition-colors">
              Dashboard
            </Link>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  {user?.firstName || user?.email}
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
