'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import DynamicChannels from '../../components/DynamicChannel';

const DashboardPage = () => {
  const [channelData, setChannelData] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([
    { status: "", name: '1', frequency: 30, strength: '60' },
    { State: "", Channel: '2', Frequency: 25, SignalStrength: '70' },
    { State: "", Channel: '3', Frequency: 40, SignalStrength: '89' },
    { State: "", Channel: '5', Frequency: 70, SignalStrength: '39' },
  ]);
  const router = useRouter();
  const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}` || 'http://localhost:9000/';
  const [sliderValue, setSliderValue] = useState(50);
  const audioRef = useRef(null); 



  const makeApiRequest = useCallback(async (url, options = {}) => {
    console.log(`Making API request to: ${url}`); 

    if (!session || !session.accessToken) {
      setErrorMessage('No active session. Please log in.');
      router.push('/login');
      return null;
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, { credentials: 'include', ...options, headers });
      const responseData = await response.json();

      if (!response.ok) {
        console.log(`Error Response:`, responseData); 
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log(`API Response Data from ${url}:`, responseData); 
      return responseData;
    } catch (error) {
      console.error('API request failed:', error);
      setErrorMessage(`API request failed: ${error.message}`);
      return null;
    }
  }, [session, router]);

  const fetchChannelData = useCallback(async () => {

    if (status !== 'authenticated') return;

    try {
      const activeChannelsData = await makeApiRequest(`${backendUrl}active-channels`);
      console.log('Active channels response:', activeChannelsData);

      if (!activeChannelsData || (!activeChannelsData.active && !activeChannelsData.offline && !activeChannelsData.busy)) {
        setErrorMessage('No active, offline, or busy channels found.');
        return;
      }

      const allChannels = [
        ...activeChannelsData.active?.map(channel => ({ ...channel, status: 'Active' })) || [],
        ...activeChannelsData.offline?.map(channel => ({ ...channel, status: 'Offline' })) || [],
        ...activeChannelsData.busy?.map(channel => ({ ...channel, status: 'Busy' })) || [],
      ];

      const channelIds = allChannels.map(channel => channel['channel-id']);

      const queryString = new URLSearchParams({
        'start-time': 86400,
        'sample-rate': 10800,
        'avg-data': true, 
        'whitelist': `[${channelIds.join(',')}]`
      }).toString();

      const analyticsUrl = `${backendUrl}analytics/data?${queryString}`;
      console.log('Fetching analytics data from:', analyticsUrl); 

      const analyticsData = await makeApiRequest(analyticsUrl);
      console.log('Analytics data response:', analyticsData);

      const processedData = allChannels.map(channel => {
        const channelId = channel['channel-id'];
        const analyticsForChannel = analyticsData?.[channelId] || {};

        return {
          status: channel.status,
          name: channel['channel-name'],
          frequency: channel.frequency / 1e6,
          utilisation: analyticsForChannel?.utilisation?.average ? analyticsForChannel?.utilisation?.average.toFixed(3) : 'No data',
          strength: analyticsForChannel?.strength?.average ? analyticsForChannel?.strength?.average.toFixed(3) : 'No data',
          id: channel['channel-id'],
        };
      });

    console.log('Processed Data:', processedData);
    setChannelData(processedData); 

    const modifiedData = processedData.map(item => ({
      name: item.name, 
      status: item.status === 'Offline' ? "" : item.status
    }));

    console.log("Modified Data:", modifiedData);
    setData(modifiedData); 


    } catch (error) {
      console.error('Fetch error:', error);
      setErrorMessage('Fetch error: ' + error.message);
    }
  }, [status, makeApiRequest]);

  useEffect(() => {
    if (status === 'authenticated') {
      setIsLoading(false);
    } else if (status === 'unauthenticated') {
      window.location.href = '/login';
    }


    fetchChannelData();
  }, [status, fetchChannelData]);

  const handleSliderChange = (e) => {
    const newValue = e.target.value;
    setSliderValue(newValue);

    if (audioRef.current) {
      audioRef.current.volume = newValue / 100;
    }
  };
  
  const handleStateClick = (channel) => {
    const selectedChannel = channelData.find(item => item.name === channel);
    const selectedChanneldata = data.find(item => item.name === channel);

    if (selectedChannel) {
      const playingState = selectedChanneldata.status;
      const audioElement = audioRef.current;
      const sourceElement = document.getElementById('audioSource');

      const stopUrl = `${backendUrl}monitor-channels/stop`;
      const testUrl = `${backendUrl}monitor-channels/start?file=test-3.mp3`;

      
      ///// for now set to play if OFFLINE, need to change this
      if (playingState == "Play" || playingState == "") {
        audioElement.load();

        console.log(testUrl);
        
        sourceElement.src = testUrl;

        audioElement.play().catch(error => {
          console.error('Error playing audio:', error);
        });
      } 
      
      else if (playingState == "Pause") {
        audioElement.pause();
        sourceElement.src = stopUrl;
      } 

    } else {
      alert(`Channel ${channel} not found!`);
    }
  };


  
  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div style={{ height: '100vh', width: '100vw', margin: 0, padding: 0, boxSizing: 'border-box', backgroundColor: '#ffffff' }}>
      <div style={{ width: '100%', height: '5px', backgroundColor: 'gray' }}></div>
      {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}

      <div className="dashboard-content" style={{ padding: '20px', height: 'calc(100vh - 50px)', overflowY: 'auto' }}>
        <br />
        <div style={{ padding: '20px' }}>
        <DynamicChannels data={channelData} handleStateClick={handleStateClick} audioRef={audioRef} sliderValue={sliderValue}/>

        </div>

        {/* Volume Slider */}
        <div style={{ marginTop: '20px', textAlign: 'center', padding: '0 20px' }}>
          <p style={{ marginBottom: '10px', fontSize: '18px', fontWeight: 'bold', color: 'black' }}>Master Volume</p>
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
