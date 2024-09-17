'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

const DashboardPage = () => {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      setIsLoading(false);
    } else if (status === 'unauthenticated') {
      window.location.href = '/login';
    }
  }, [status]);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <div className="dashboard-content">
        <h1>Welcome to Your Dashboard</h1>
        <p>This is your post-login dashboard where you can manage your account, view data, etc.</p>
      </div>
    </div>
  );
};

export default DashboardPage;
