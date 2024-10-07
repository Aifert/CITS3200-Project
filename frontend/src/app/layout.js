'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { NotificationProvider } from '../components/NotificationContext';
import Navbar from '../components/Navbar';
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
        />
      </head>
      <body>
        <SessionProvider>
          <NotificationProvider>
            <AuthWrapper>{children}</AuthWrapper>
          </NotificationProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

function AuthWrapper({ children }) {
  const { status } = useSession();

  if (status === 'authenticated') {
    return (
      <>
        <Navbar />
        {children}
      </>
    );
  }

  return children; // No navbar for unauthenticated users
}
