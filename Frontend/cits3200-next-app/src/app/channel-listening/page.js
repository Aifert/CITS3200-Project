'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '../../components/Navbar';
import DynamicChannels from '../../components/DynamicChannels';

const DashboardPage = () => {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([
    { State: "Play", Channel: '1', Frequency: 30, SignalStrength: '60'},
    { State: "Play", Channel: '2', Frequency: 25, SignalStrength: '70' },
    { State: "Play", Channel: '3', Frequency: 40, SignalStrength: '89' },
  ]);

  const [sliderValue, setSliderValue] = useState(50);

  useEffect(() => {
    if (status === 'authenticated') {
      setIsLoading(false);
    } else if (status === 'unauthenticated') {
      window.location.href = '/login';
    }
  }, [status]);

  const handleSliderChange = (e) => {
    setSliderValue(e.target.value);
  };

  const handleStateClick = (channel) => {
    alert(`State clicked for Channel: ${channel}`);
  };

  if (isLoading) {
    return <p>Loading...</p>;  
  }

  return (
    <div style={{ height: '100vh', width: '100vw', margin: 0, padding: 0, boxSizing: 'border-box', backgroundColor: '#181817' }}>
      <Navbar />
      
      {/* Gray line for visual separator */}
      <div style={{ width: '100%', height: '5px', backgroundColor: 'gray' }}></div>
      
      <div className="dashboard-content" style={{ padding: '20px', height: 'calc(100vh - 50px)', overflowY: 'auto' }}>
        <br></br>
        <div style={{ padding: '20px' }}>
          <DynamicChannels data={data} handleStateClick={handleStateClick} />
        </div>
        
        {/* Volume slider container styled same as table */}
        <div style={{ marginTop: '40px', textAlign: 'center', padding: '0 20px' }}>
          <p style={{ marginBottom: '10px', fontSize: '18px', fontWeight: 'bold', color: 'white' }}>Master Volume</p>

          <input
            id="slider"
            type="range"
            min="0"
            max="100"
            value={sliderValue}
            onChange={handleSliderChange}
            style={{ width: '100%', maxWidth: '100%' }} 
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
