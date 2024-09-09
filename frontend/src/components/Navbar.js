'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const pathname = usePathname();

  const handleLogout = () => {
    signOut({ redirect: false }).then(() => {
      // Clear authentication cookies if necessary
      document.cookie = 'next-auth.session-token=; Max-Age=0; path=/';
      document.cookie = 'next-auth.callback-url=; Max-Age=0; path=/';
      // Redirect to login page or any other page
      window.location.href = '/login';
    });
  };

  return (
    <nav className="w-full bg-emerald-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left Side Links */}
        <div className="flex space-x-4">
          <Link
            href="/channel-listening"
            className={`text-white hover:text-gray-300 ${
              pathname === '/channel-listening' ? 'font-bold' : ''
            }`}
          >
            Channel Listening
          </Link>
          <Link
            href="/analytics"
            className={`text-white hover:text-gray-300 ${
              pathname === '/analytics' ? 'font-bold' : ''
            }`}
          >
            Analytics
          </Link>
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center space-x-4">
          <NotificationBell />
          <button
            onClick={handleLogout}
            className="text-white hover:text-gray-300 focus:outline-none"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
