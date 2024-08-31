'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState } from 'react';

const Navbar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    signOut({
      redirect: false,
    }).then(() => {
      // Clear cookies related to authentication (if necessary)
      document.cookie = 'next-auth.session-token=; Max-Age=0; path=/';
      document.cookie = 'next-auth.callback-url=; Max-Age=0; path=/';
      // Redirect to Azure AD logout
      window.location.href = `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/logout?post_logout_redirect_uri=http://localhost:3000/login`;
    });
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link href="/" className="navbar-logo">YourApp</Link>
          <div className="navbar-links">
            <Link href="/" className={pathname === '/' ? 'navbar-link active' : 'navbar-link'}>Home</Link>
            <Link href="/dashboard" className={pathname === '/dashboard' ? 'navbar-link active' : 'navbar-link'}>Dashboard</Link>
            <Link href="/profile" className={pathname === '/profile' ? 'navbar-link active' : 'navbar-link'}>Profile</Link>
            <Link href="/settings" className={pathname === '/settings' ? 'navbar-link active' : 'navbar-link'}>Settings</Link>
          </div>
        </div>
        <div className="navbar-right">
          <button onClick={() => alert('Notifications')} className="navbar-bell">🔔</button>
          <button onClick={handleLogout} className="navbar-logout">Logout</button>
          <button className="navbar-toggle" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="navbar-mobile">
          <Link href="/" className={pathname === '/' ? 'navbar-link active' : 'navbar-link'}>Home</Link>
          <Link href="/dashboard" className={pathname === '/dashboard' ? 'navbar-link active' : 'navbar-link'}>Dashboard</Link>
          <Link href="/profile" className={pathname === '/profile' ? 'navbar-link active' : 'navbar-link'}>Profile</Link>
          <Link href="/settings" className={pathname === '/settings' ? 'navbar-link active' : 'navbar-link'}>Settings</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
