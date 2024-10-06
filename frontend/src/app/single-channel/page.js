'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip } from 'chart.js';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip);

const SingleChannelPage = () => {
  const [channelData, setChannelData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedTimeScale, setSelectedTimeScale] = useState('24 hours');
  const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}api/` || 'http://localhost:9000/api/';

  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const channelId = searchParams.get('channelId');

  const [isPlaying, setIsPlaying] = useState(false); 
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState(null);
  const [sliderValue, setSliderValue] = useState(50);
  const audioRef = useRef(null); 



  const timeScales = {
    '60 minutes': { timeScale: 3600, sampleRate: 300 },
    '3 hours': { timeScale: 10800, sampleRate: 600 },
    '12 hours': { timeScale: 43200, sampleRate: 1200 },
    '24 hours': { timeScale: 86400, sampleRate: 1800 },
    '3 days': { timeScale: 259200, sampleRate: 7200 },
    '7 days': { timeScale: 604800, sampleRate: 10800 },
    '30 days': { timeScale: 2592000, sampleRate: 86400 },
  };

  const formatTimeLabelDirectly = (index, sampleRate) => {
    const secondsAgo = sampleRate * (index + 1);
    if (secondsAgo >= 86400) {
      const daysAgo = (secondsAgo / 86400).toFixed(2);
      return `${daysAgo} day(s)`;
    } else if (secondsAgo >= 3600) {
      const hoursAgo = (secondsAgo / 3600).toFixed(2);
      return `${hoursAgo} hour(s)`;
    } else {
      const minutesAgo = (secondsAgo / 60).toFixed(2);
      return `${minutesAgo} minute(s)`;
    }
  };

  const handleStateClick = (channel, state, frequency) => {
    // const selectedChannel = channelData.find(item => item.name === channel);
    // const selectedChanneldata = data.find(item => item.name === channel);

    // const playingState = state;
    // const state_data = state;
    // const frequency = selectedChannel.frequency;
    const sessionId = '12345';
    const audioElement = audioRef.current;
    const sourceElement = document.getElementById('audioSource');

    const audioUrl = `http://localhost:9000/api/audio?session-id=${sessionId}&channel-id=${channel}&frequency=${frequency}`;
    const stopUrl = `http://localhost:9000/api/monitor-channels/stop`;
    const testUrl = `http://localhost:9000/api/monitor-channels/start?sessionId=test-1`;

    console.log("Playing State:", state);
    console.log(audioElement);
    console.log(audioRef.volume)

    ///// for now set to play if OFFLINE, need to change this
    if (state == "Play" || state == "") {
      console.log(testUrl);
      
      sourceElement.src = testUrl;
      audioElement.load();

      audioElement.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    } 
    
    else if (state == "Pause") {
      audioElement.pause();
      sourceElement.src = stopUrl;
    } 
    
    else if (state === "SDR Busy") {
      alert("SDR is currently busy, please try again later.");
    }


  };


  const handlePlayPauseClick = (channel, state, frequency) => {
    const isCurrentlyPlaying = isPlaying;
  
    // Update the play/pause state for the clicked channel
    if (isCurrentlyPlaying) {
      state = 'Pause';
    } else {
      state = 'Play';
    }
    console.log("IsCurrentlyPlaying: ",isCurrentlyPlaying);
    console.log("state: ",state);
    // If the channel is now playing, set its volume and handle state click
    if (!isCurrentlyPlaying && audioRef.current) {
      const volume = (sliderValue / 100); // row volume * master volume
      if (!isNaN(volume)) {
        audioRef.current.volume = volume;
        console.log(volume);
      }
      // state = "Play";
      handleStateClick(channel, state, frequency); // Play new channel
    } else {
      // Pause the current channel
      handleStateClick(channel, state, frequency); 
    }
  };
  
  // Function to render the play/pause button with dynamic styles
  const renderButton = (channel, state, frequency) => {
    return (
      <button
        onClick={() => handlePlayPauseClick(channel, state)}
        style={{
          backgroundColor: isPlaying  ? 'red' : 'green',
          color: 'black',
          padding: '5px 10px',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer',
        }}
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>
    );
  };

  const makeApiRequest = useCallback(
    async (url, options = {}) => {
      if (!session || !session.accessToken) {
        setErrorMessage('No active session. Please log in.');
        router.push('/login');
        return null;
      }

      const headers = {
        ...options.headers,
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      };

      try {
        const response = await fetch(url, { credentials: 'include', ...options, headers });
        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return responseData;
      } catch (error) {
        setErrorMessage(`API request failed: ${error.message}`);
        return null;
      }
    },
    [session, router]
  );

  const fetchChannelData = useCallback(async () => {
    const { timeScale, sampleRate } = timeScales[selectedTimeScale];

    if (status !== 'authenticated' || !channelId) return;

    try {
      const activeChannelsData = await makeApiRequest(`${backendUrl}active-channels`);

      if (!activeChannelsData || (!activeChannelsData.active && !activeChannelsData.offline && !activeChannelsData.busy)) {
        setErrorMessage('No active, offline, or busy channels found.');
        return;
      }

      const channel =
        activeChannelsData.active?.find((channel) => String(channel['channel-id']) === String(channelId))
          ? { ...activeChannelsData.active.find((channel) => String(channel['channel-id']) === String(channelId)), status: 'Active' }
          : activeChannelsData.offline?.find((channel) => String(channel['channel-id']) === String(channelId))
          ? { ...activeChannelsData.offline.find((channel) => String(channel['channel-id']) === String(channelId)), status: 'Offline' }
          : activeChannelsData.busy?.find((channel) => String(channel['channel-id']) === String(channelId))
          ? { ...activeChannelsData.busy.find((channel) => String(channel['channel-id']) === String(channelId)), status: 'Busy' }
          : null;

      if (!channel) {
        setErrorMessage('Channel not found.');
        return;
      }

      const queryString = new URLSearchParams({
        'start-time': timeScale,
        'sample-rate': sampleRate,
        'avg-data': true,
        whitelist: `[${channelId}]`,
      }).toString();

      const analyticsUrl = `${backendUrl}analytics/data?${queryString}`;

      const analyticsData = await makeApiRequest(analyticsUrl);

      const strengthData = analyticsData?.[channelId]?.strength?.values || {};
      const utilisationData = analyticsData?.[channelId]?.utilisation?.zones || [];

      const utilisationArray = Object.values(utilisationData).map((val) => val ?? null);
      const utilisationLabels = Object.keys(utilisationData);
      const formattedUtilisationLabels = utilisationLabels.map((label, index) => {
        return formatTimeLabelDirectly(index, timeScales[selectedTimeScale].sampleRate);
      });

      const strengthArray = Object.values(strengthData).map((val) => val ?? null);
      const strengthLabels = Object.keys(strengthData);
      const formattedStrengthLabels = strengthLabels.map((label, index) => {
        return formatTimeLabelDirectly(index, timeScales[selectedTimeScale].sampleRate);
      });

      const dataUtilisation = utilisationArray.length
        ? {
            labels: formattedUtilisationLabels.reverse(),
            datasets: [
              {
                label: 'Utilisation Over Time',
                data: utilisationArray.reverse(),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
              },
            ],
          }
        : 'No data';

      const dataStrength = strengthArray.length
        ? {
            labels: formattedStrengthLabels.reverse(),
            datasets: [
              {
                label: 'Strength Over Time (dBm)',
                data: strengthArray.reverse(),
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1,
              },
            ],
          }
        : 'No data';

      const newChannelData = {
        status: channel.status,
        name: channel['channel-name'],
        frequency: channel.frequency / 1e6,
        utilisation: analyticsData?.[channelId]?.utilisation?.average ? analyticsData?.[channelId]?.utilisation?.average.toFixed(3) : 'No data',
        strength: analyticsData?.[channelId]?.strength?.average ? analyticsData?.[channelId]?.strength?.average.toFixed(3) : 'No data',
        dataUtilisation,
        dataStrength,
      };

      setChannelData(newChannelData);
      

    } catch (error) {
      setErrorMessage('Fetch error: ' + error.message);
    }
  }, [selectedTimeScale, status, backendUrl, channelId, makeApiRequest]);


    // Function to handle volume slider changes
    const handleSliderChange = (e) => {
      const newValue = e.target.value;
      setSliderValue(newValue);
  
      if (audioRef.current) {
        audioRef.current.volume = newValue / 100;
      }
    };

  useEffect(() => {
    fetchChannelData();

  }, [selectedTimeScale, fetchChannelData]);

  const downloadData = (dataType) => {
    const { timeScale } = timeScales[selectedTimeScale];
    const url = `${backendUrl}analytics/${dataType}-dump?whitelist=[${channelId}]&start-time=${timeScale}`;
    window.location.href = url;
  };

  if (!channelData) {
    return <p>Loading...</p>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Channel: {channelData.name.replace("Channel", "")} ({channelData.status})
      </h1>
  
      {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
  
      <div className="mb-10 flex justify-between items-center">
        {/* Time Scale */}
        <div className="flex items-center space-x-4">
          <label className="text-lg">Select Time Scale:</label>
          <select
            value={selectedTimeScale}
            onChange={(e) => setSelectedTimeScale(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          >
            {Object.keys(timeScales).map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        </div>
  
        {/* Download */}
        <div className="flex items-center space-x-4">
          <span className="text-lg">Download:</span>
          <button
            onClick={() => downloadData('strength')}
            className="text-blue-600 hover:underline"
            title="All Strength Data"
          >
            <i className="fas fa-download"></i> Strength Data
          </button>
          <button
            onClick={() => downloadData('util')}
            className="text-blue-600 hover:underline"
            title="All Utilisation Data"
          >
            <i className="fas fa-download"></i> Utilisation Data
          </button>
        </div>
      </div>
  
      {/* Status and Details */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-white border-b border-gray-300">

        <div className="flex items-center justify-center border-r border-gray-300">
          <span>Frequency: {channelData.frequency.toFixed(6)} MHz</span>
        </div>
        <div className="flex items-center justify-center border-r border-gray-300">
          <span>Utilisation: {channelData.utilisation}</span>
        </div>
        <div className="flex items-center justify-center">
          <span>Strength: {channelData.strength}</span>
        </div>
        
      {/* Channel Strength */}
      <div className="flex items-center justify-center">
        <div
          className="w-full"
          style={{
            height: '10px',
            background: 'linear-gradient(90deg, red, yellow, green)',
            position: 'relative',
            overflow: 'hidden', // Prevent overflow if the strength is out of bounds
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '0',
              left: `${channelData.strength < 0 ? 0 : channelData.strength > 100 ? 100 : channelData.strength}%`, // Clamp the value between 0 and 100
              height: '100%',
              width: '2px',
              background: 'black',
            }}
          ></div>
        </div>
      </div>

      </div>

      {/* Textual Data */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-white border-b border-gray-300">
        {/* Play */}
        <div className="flex items-left justify-center border-r border-gray-300">
        {/* <span>{channelData.state}</span> */}

          <div style={{ padding: '8px', textAlign: 'center' }}>
            {renderButton(channelData.name, channelData.state, channelData.frequency)}
          </div>
          {/* <span>{channelData.state}</span> */}
        </div>
  
        {/* Volume Slider Control */}
        <div className="flex flex-col items-center border-r border-gray-300">
        <span className="mt-2 text-lg">Volume</span>
          
        <input
          id="slider"
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          onChange={handleSliderChange}
          className="w-full max-w-xs"
        />
        </div>

      </div>
  

  
      {/* Graphical Data */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-white">
        <div>
          {typeof channelData.dataUtilisation === 'string' ? (
            <p>{channelData.dataUtilisation}</p>
          ) : (
            <Line
              data={channelData.dataUtilisation}
              options={{
                maintainAspectRatio: false,
                scales: {
                  y: {
                    min: 0,
                    max: 100,
                    title: { display: true, text: 'Utilisation (%)' },
                  },
                  x: { title: { display: true, text: 'Time Ago' } },
                },
              }}
            />
          )}
        </div>
        <div>
          {typeof channelData.dataStrength === 'string' ? (
            <p>{channelData.dataStrength}</p>
          ) : (
            <Line
              data={channelData.dataStrength}
              options={{
                maintainAspectRatio: false,
                scales: {
                  y: {
                    min: -110,
                    max: -70,
                    title: { display: true, text: 'Strength (dBm)' },
                  },
                  x: { title: { display: true, text: 'Time Ago' } },
                },
                spanGaps: true,
                segment: {
                  borderDash: (ctx) => (ctx.p1.parsed.y === null || ctx.p0.parsed.y === null ? [6, 6] : undefined),
                  borderColor: (ctx) => (ctx.p1.parsed.y === null || ctx.p0.parsed.y === null ? 'rgba(255, 99, 132, 0.5)' : 'rgb(255, 99, 132)'),
                },
                plugins: {
                  tooltip: {
                    enabled: true,
                    callbacks: {
                      label: function (context) {
                        return `Value: ${context.raw}`;
                      },
                    },
                  },
                },
              }}
            />
          )}
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
  
  export default SingleChannelPage;
  