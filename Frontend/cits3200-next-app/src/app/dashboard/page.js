"use client";

import { signOut } from "next-auth/react";  // Import signOut for logging out

const DashboardPage = () => {
    const handleLogout = () => {
        signOut({
          redirect: false,
        }).then(() => {
          // Clear cookies related to authentication (if necessary)
          document.cookie = 'next-auth.session-token=; Max-Age=0; path=/';
          document.cookie = 'next-auth.callback-url=; Max-Age=0; path=/';
          window.location.href = `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/logout?post_logout_redirect_uri=http://localhost:3000/login`;
        });
    };

  return (
    <div>
      <h1>Welcome to Your Dashboard</h1>
      <p>This is your post-login dashboard where you can manage your account, view data, etc.</p>
      <button onClick={handleLogout} className="logout-button">
        Logout
      </button>
    </div>
  );
};

export default DashboardPage;
