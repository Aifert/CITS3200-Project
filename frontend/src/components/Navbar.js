'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import NotificationBell from './NotificationBell';
import Image from 'next/image';

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
    <nav className="w-full bg-orange-400 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left Side - Logos and Links */}
        <div className="flex items-center space-x-8">
          {/* Logos */}
          <div className="flex items-center space-x-4">
            <a href="https://csu-ses.com.au/" target="_blank" rel="noopener noreferrer">
              <Image
                src="https://csu-ses.com.au/wp-content/themes/hatchet/assets/art/csu-ses-wa.svg"
                width={100}
                height={100}
                alt="SWORD"
                className="h-12 max-h-12 object-contain"
              />
            </a>

            {/* Link for Department of Fire and Emergency Services */}
            <a href="https://dfes.wa.gov.au/" target="_blank" rel="noopener noreferrer">
              <Image
                src="https://dfes.wa.gov.au/images/dfes-logo-black_1dfes-logo-black.png"
                alt="Department of Fire and Emergency Services"
                width={100}
                height={100}
                className="h-12 max-h-12 object-contain"
              />
            </a>
          </div>

          {/* Links */}
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
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center space-x-4">
          <NotificationBell />
          <Link
            href="/api-key"
            className="text-white hover:text-gray-300 focus:outline-none"
          >
            API Key
          </Link>
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
