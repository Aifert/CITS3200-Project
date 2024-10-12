'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { NotificationProvider } from '../components/NotificationContext';
import Navbar from '../components/Navbar';
import './globals.css';
import Head from 'next/head';
import { useEffect } from 'react';

export default function RootLayout({ children }) {
  useEffect(() => {
    console.log("RootLayout: Title and favicon should be applied");
  }, []);

  return (
    <html lang="en">
      <head>
        <title>CITS3200 App</title>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
        />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <meta name="description" content="Testing head tag rendering" />
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
