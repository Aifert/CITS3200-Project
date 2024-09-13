'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '../../components/Navbar';
import DynamicChannels from '../../components/DynamicChannels';


const DashboardPage = () => {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([
    { Channel: '1', Frequency: 30, SignalStrength: '60' },
    { Channel: '2', Frequency: 25, SignalStrength: '70' },
    { Channel: '3', Frequency: 40, SignalStrength: '89' },
  ]);

  useEffect(() => {
    if (status === 'authenticated') {
      setIsLoading(false);
    } else if (status === 'unauthenticated') {
      window.location.href = '/login';
    }
  }, [status]);

  if (isLoading) {
    return <p>Loading...</p>;  // Show a loading message or spinner while checking authentication
  }

  return (
    <div>
      <Navbar />
      <div className="dashboard-content">
        <h1>Dashboard</h1>
        <p>This is your post-login dashboard where you can manage your account, view data, etc.</p>
        <div style={{ padding: '20px' }}>
          <DynamicChannels data={data} />
        </div>
      </div>

    </div>
    
  );
};

export default DashboardPage;
