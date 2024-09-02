import React from "react";
import Link from "next/link";  // Import Link from next/link for client-side navigation
import { usePathname } from "next/navigation";  // Import usePathname to determine the current route
import { signOut } from "next-auth/react";  // Import signOut for handling logout

const Navbar = () => {
  const pathname = usePathname();  // Get the current path for active link highlighting

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
    <div className="w-full h-20 bg-emerald-800 sticky top-0">
      <div className="container mx-auto px-4 h-full">
        <div className="flex justify-between items-center h-full">
          
          {/* Left Side Links */}
          <div className="flex gap-x-6 text-white">
            <Link href="/channel-listening">
              <p className={pathname === '/channel-listening' ? 'font-bold' : ''}>
                Channel Listening
              </p>
            </Link>
            <Link href="/analytics">
              <p className={pathname === '/analytics' ? 'font-bold' : ''}>
                Analytics
              </p>
            </Link>
          </div>

          {/* Right Side Buttons */}
          <div className="flex items-center gap-x-4">
            <button onClick={() => alert('Notifications clicked')} className="text-white">
              🔔
            </button>
            <button onClick={handleLogout} className="text-white">
              Logout
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Navbar;
