'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import DynamicChannels from '../../components/DynamicChannel';

const DashboardPage = () => {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([
    { State: "", Channel: '1', Frequency: 30, SignalStrength: '60' },
    { State: "", Channel: '2', Frequency: 25, SignalStrength: '70' },
    { State: "", Channel: '3', Frequency: 40, SignalStrength: '89' },
    { State: "", Channel: '5', Frequency: 70, SignalStrength: '39' },
  ]);

  const [sliderValue, setSliderValue] = useState(50);
  const audioRef = useRef(null); 

  useEffect(() => {
    if (status === 'authenticated') {
      setIsLoading(false);
    } else if (status === 'unauthenticated') {
      window.location.href = '/login';
    }
  }, [status]);

  const handleSliderChange = (e) => {
    const newValue = e.target.value;
    setSliderValue(newValue);

    if (audioRef.current) {
      audioRef.current.volume = newValue / 100;
    }
  };

  const handleStateClick = (channel) => {
    const selectedChannel = data.find(item => item.Channel === channel);

    if (selectedChannel) {
      const state = selectedChannel.State;
      const frequency = selectedChannel.Frequency;
      const sessionId = '12345';
      const audioElement = audioRef.current;
      const sourceElement = document.getElementById('audioSource');

      const audioUrl = `http://localhost:9000/api/audio?session-id=${sessionId}&channel-id=${channel}&frequency=${frequency}`;
      const stopUrl = `http://localhost:9000/api/monitor-channels/stop`;
      const testUrl = `http://localhost:9000/api/monitor-channels/start?session-id=test-1`;

      console.log(state);

      if (state === "Play") {
        console.log(testUrl);
        
        sourceElement.src = testUrl;
        audioElement.load();

        audioElement.play().catch(error => {
          console.error('Error playing audio:', error);
        });
      } 
      
      else if (state === "Pause") {
        audioElement.pause();
        sourceElement.src = stopUrl;
      } 
      
      else if (state === "SDR Busy") {
        alert("SDR is currently busy, please try again later.");
      }

    } else {
      alert(`Channel ${channel} not found!`);
    }
  };

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div style={{ height: '100vh', width: '100vw', margin: 0, padding: 0, boxSizing: 'border-box', backgroundColor: '#181817' }}>
      <div style={{ width: '100%', height: '5px', backgroundColor: 'gray' }}></div>

      <div className="dashboard-content" style={{ padding: '20px', height: 'calc(100vh - 50px)', overflowY: 'auto' }}>
        <br />
        <div style={{ padding: '20px' }}>
        <DynamicChannels data={data} handleStateClick={handleStateClick} audioRef={audioRef} />

        </div>

        {/* Volume Slider */}
        <div style={{ marginTop: '20px', textAlign: 'center', padding: '0 20px' }}>
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

      {/* Hidden Audio Element */}
      <audio id="audioPlayer" ref={audioRef} style={{ display: 'none' }}>
        <source id="audioSource" src="" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

export default DashboardPage;
