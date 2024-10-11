'use client';

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { Line, Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler} from 'chart.js';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler);

const ChannelContent = () => {
  const [channelData, setChannelData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [availableChannels, setAvailableChannels] = useState([]);
  const [selectedTimeScale, setSelectedTimeScale] = useState('24 hours');
  const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}` || 'http://localhost:9000/';

  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const channelIds = useMemo(() => {
    return searchParams.get('channelId')
      ? searchParams.get('channelId').replace(/[\[\]]/g, '').split(',').map(id => parseInt(id.trim(), 10))
      : [];
  }, [searchParams]);


  const [isPlaying, setIsPlaying] = useState(false);
  // const [currentPlayingIndex, setCurrentPlayingIndex] = useState(null);
  const [sliderValue, setSliderValue] = useState(50);
  const audioRef = useRef(null);

  const timeScales = useMemo(() => ({
    '10 minutes': { timeScale: 600, sampleRate: 60, isStep: true },  // 1 hour, sample rate 5 minutes
    '60 minutes': { timeScale: 3600, sampleRate: 300, isStep: true },  // 1 hour, sample rate 5 minutes
    '3 hours': { timeScale: 10800, sampleRate: 600, isStep: false },  // 3 hours, sample rate 10 minutes
    '12 hours': { timeScale: 43200, sampleRate: 1200, isStep: false },  // 12 hours, sample rate 20 minutes
    '24 hours': { timeScale: 86400, sampleRate: 1800, isStep: false },  // 24 hours, sample rate 30 minutes
    '3 days': { timeScale: 259200, sampleRate: 7200, isStep: false },  // 3 days, sample rate 2 hours
    '7 days': { timeScale: 604800, sampleRate: 10800, isStep: false },  // 7 days, sample rate 3 hours
    '30 days': { timeScale: 2592000, sampleRate: 86400, isStep: false } // 30 days, sample rate 1 day
  }), []);

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

// Function to toggle the play/pause state
const handleStateClick = () => {
  console.log(channelData);

  const sourceElement = document.getElementById('audioSource');

  const channel = channelData.name;
  const frequency = channelData.frequency;
  const sessionId = '12345';

  const stopUrl = `${backendUrl}monitor-channels/stop`;
  const testUrl = `${backendUrl}monitor-channels/start?file=test-1.mp3`;

  const audioElement = audioRef.current;

  // Flip the `isPlaying` state
  setIsPlaying(!isPlaying);

  // Optionally perform additional logic when the state changes
  if (!isPlaying) {
    console.log('Playing...');
    console.log(testUrl);

    sourceElement.src = testUrl;
    audioElement.load();

    audioElement.play().catch(error => {
      console.error('Error playing audio:', error);
    });

  } else {
    console.log('Paused...');
    audioElement.pause();
    sourceElement.src = stopUrl;
  }
};


// Function to render the play/pause button with dynamic styles
const renderButton = () => {
  return (
    <button
      onClick={handleStateClick}
      style={{
        backgroundColor: isPlaying ? 'red' : 'green',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        cursor: 'pointer'
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

    if (status !== 'authenticated' || channelIds.length === 0) return;

    try {
      const activeChannelsData = await makeApiRequest(`${backendUrl}active-channels`);

      if (!activeChannelsData || (!activeChannelsData.active && !activeChannelsData.offline && !activeChannelsData.busy)) {
        setErrorMessage('No active, offline, or busy channels found.');
        return;
      }

      const selectedChannels = activeChannelsData.active
        ?.filter(channel => channelIds.includes(channel['channel-id']))
        .map(channel => ({ ...channel, status: 'Active' })) || [];

      const offlineChannels = activeChannelsData.offline
        ?.filter(channel => channelIds.includes(channel['channel-id']))
        .map(channel => ({ ...channel, status: 'Offline' })) || [];

      const busyChannels = activeChannelsData.busy
        ?.filter(channel => channelIds.includes(channel['channel-id']))
        .map(channel => ({ ...channel, status: 'Busy' })) || [];

      const allSelectedChannels = [...selectedChannels, ...offlineChannels, ...busyChannels];

      const allChannels = [...(activeChannelsData?.active || []), ...(activeChannelsData?.busy || []), ...(activeChannelsData?.offline || [])];
      const availableChannels = allChannels.filter(channel => !channelIds.includes(channel['channel-id']));
      setAvailableChannels(availableChannels);

      if (allSelectedChannels.length === 0) {
        setErrorMessage('No matching channels found.');
        return;
      }

      const isStep = timeScales[selectedTimeScale].isStep;

      const queryString = new URLSearchParams({
        'start-time': timeScale,
        'sample-rate': sampleRate,
        'avg-data': !isStep,
        whitelist: `[${channelIds.join(',')}]`,
      }).toString();

      const analyticsUrl = `${backendUrl}analytics/data?${queryString}`;
      const analyticsData = await makeApiRequest(analyticsUrl);

      // Process analytics data for each channel
      const processedData = allSelectedChannels.map(channel => {
        const channelId = channel['channel-id'];
        const analyticsForChannel = analyticsData?.[channelId] || {};
        const strengthData = analyticsForChannel?.strength?.values || {};
        const utilisationData = isStep ? (analyticsForChannel?.utilisation?.values || []) : (analyticsForChannel?.utilisation?.zones || []);

        let dataUtilisation;

        if (!isStep) {
          const utilisationArray = Object.values(utilisationData).map(val => val ?? null);
          const utilisationLabels = Object.keys(utilisationData);
          const formattedutilisationLabels = utilisationLabels.map((label, index) => {
            return formatTimeLabelDirectly(index, timeScales[selectedTimeScale].sampleRate);
          });
          dataUtilisation = utilisationArray.length
            ? {
                labels: formattedutilisationLabels.reverse(),
                datasets: [{
                  label: 'Utilisation Over Time',
                  data: utilisationArray.reverse(),
                  borderColor: 'rgb(75, 192, 192)',
                  tension: 0.1,
                }],
              }
            : 'No data';

        } else {
          let utilStepData = [];
          const nowTime = Math.floor(new Date().getTime()/1000);
          utilStepData.push({"x":timeScales[selectedTimeScale].timeScale+5, "y":0});
          for (let u in utilisationData) {
            utilStepData.push({"x":nowTime-utilisationData[u][0], "y":0});
            utilStepData.push({"x":nowTime-utilisationData[u][0], "y":1});
            if (utilisationData[u][1] === null) {
              utilStepData.push({"x":nowTime, "y":1});
              utilStepData.push({"x":nowTime, "y":0});
            } else {
              utilStepData.push({"x":nowTime-utilisationData[u][1], "y":1});
              utilStepData.push({"x":nowTime-utilisationData[u][1], "y":0});
            }
          }
          utilStepData.push({"x":-5, "y":0});

          dataUtilisation = utilisationData.length
            ? {
                datasets: [{
                  label: 'Utilisation Over Time',
                  data: utilStepData,
                  borderColor: 'rgb(75, 192, 192)',
                  fill: true,
                  type: "scatter",
                  showLine: true
                }],
              }
            : 'No data';
        }

        const strengthArray = Object.values(strengthData).map(val => val ?? null);
        const strengthLabels = Object.keys(strengthData);
        const formattedStrengthLabels = strengthLabels.map((label, index) => {
          return formatTimeLabelDirectly(index, timeScales[selectedTimeScale].sampleRate);
        });


        const dataStrength = strengthArray.length
          ? {
              labels: formattedStrengthLabels.reverse(),
              datasets: [{
                label: 'Strength Over Time (dBm)',
                data: strengthArray.reverse(),
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1,
              }],
            }
          : 'No data';

        return {
          status: channel.status,
          name: channel['channel-name'],
          frequency: channel.frequency / 1e6,
          utilisation: analyticsForChannel?.utilisation?.average ? analyticsForChannel?.utilisation?.average.toFixed(3) : 'No data',
          strength: analyticsForChannel?.strength?.average ? analyticsForChannel?.strength?.average.toFixed(3) : 'No data',
          dataUtilisation,
          dataStrength,
          id: channel['channel-id'],
        };
      });

      setChannelData(processedData);

    } catch (error) {
      setErrorMessage('Fetch error: ' + error.message);
    }
  }, [selectedTimeScale, status, backendUrl, channelIds, makeApiRequest, timeScales]);


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

  const handleAddChannel = (newChannelId) => {
    if (!newChannelId) return;
    const updatedChannelIds = [...channelIds, parseInt(newChannelId)];

    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('channelId', `[${updatedChannelIds.join(',')}]`);

    router.push(`?${newSearchParams.toString()}`);
  };


  const downloadData = (dataType) => {
    const { timeScale } = timeScales[selectedTimeScale];
    const url = `${backendUrl}analytics/${dataType}-dump?whitelist=[${channelIds}]&start-time=${timeScale}`;
    window.location.href = url;
  };

  if (!channelData) {
    return <p>Loading...</p>;
  }

  return (
    <div className="w-full mx-auto p-6">
      {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}


      <div className="mb-10 flex justify-between items-center">
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

      {/* Dropdown for channels not in URL */}
      <div className="flex items-center space-x-4">
        <label className="text-lg">Add Channel:</label>
        <select
          onChange={(e) => handleAddChannel(e.target.value)}
          className="p-2 border border-gray-300 rounded-md"
          defaultValue=""
          disabled={availableChannels.length === 0}
        >
          <option value="" disabled>
            {availableChannels.length === 0 ? "No channels available" : "Select a channel"}
          </option>
          {availableChannels.map((channel) => (
            <option key={channel['channel-id']} value={channel['channel-id']}>
              {channel['channel-name']}
            </option>
          ))}
        </select>
      </div>

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
      {channelData.map((channel, index) => (
        <div key={index} className="mb-10">
          <h2 className="text-xl font-bold mb-4">
            Channel: {channel.name.replace("Channel", "")} ({channel.status})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white border-b border-gray-300">
            <div className="flex items-center justify-center border-r border-gray-300">
              <span>Frequency: {channel.frequency.toFixed(6)} MHz</span>
            </div>
            <div className="flex items-center justify-center border-r border-gray-300">
              <span>Utilisation average: {channel.utilisation} (%)</span>
            </div>
            <div className="flex items-center justify-center">
              <span>Strength average: {channel.strength} (dBm)</span>
            </div>

            <div className="flex items-center justify-center">
              <div
                className="w-full"
                style={{
                  height: '10px',
                  background: 'linear-gradient(90deg, red, yellow, green)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '0',
                    left: `${channel.strength < 0 ? 0 : channel.strength > 100 ? 100 : channel.strength}%`,
                    height: '100%',
                    width: '2px',
                    background: 'black',
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white border-b border-gray-300">
            <div className="flex items-left justify-center border-r border-gray-300">
              <div style={{ padding: '8px', textAlign: 'center' }}>
                {renderButton(channel.name)}
              </div>
            </div>

            <div className="flex flex-col items-center border-r border-gray-300">
              <span className="mt-2 text-lg">Volume</span>
              <input
                id="slider"
                type="range"
                min="0"
                max="100"
                value={sliderValue}
                onChange={(e) => setSliderValue(e.target.value)}
                className="w-full max-w-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white">
            <div>
              {typeof channel.dataUtilisation === 'string' ? (
                <p>{channel.dataUtilisation}</p>
              ) : channel.dataUtilisation.datasets[0].type === 'scatter' ? (
                <Scatter
                  data={channel.dataUtilisation}
                  options={{
                    aspectRatio: 6,
                    scales: {
                      y: {
                        grid: {
                          display: false,
                        },
                        ticks: {
                          display: false,
                        },
                      },
                      x: {
                        min: 0,
                        max: timeScales[selectedTimeScale].timeScale,
                        grid: {
                          display: false,
                        },
                        title: {
                          display: true,
                          text: 'Time Ago (s)',
                        },
                        reverse: true,
                      },
                    },
                  }}
                />
              ) : (
                <Line
                  data={channel.dataUtilisation}
                  options={{
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        min: 0,
                        max: 100,
                        title: {
                          display: true,
                          text: 'Utilisation (%)',
                        },
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Time Ago',
                        },
                      },
                    },
                  }}
                />
              )}
            </div>
            <div>
              {typeof channel.dataStrength === 'string' ? (
                <p>{channel.dataStrength}</p>
              ) : (
                <Line
                  data={channel.dataStrength}
                  options={{
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        min: -50,
                        max: 40,
                        title: { display: true, text: 'Strength (dBm)' },
                      },
                      x: { title: { display: true, text: 'Time Ago' } },
                    },
                    spanGaps: true,
                    segment: {
                      borderDash: (ctx) => (ctx.p1.parsed.y === null || ctx.p0.parsed.y === null ? [6, 6] : undefined),
                      borderColor: (ctx) => (ctx.p1.parsed.y === null || ctx.p0.parsed.y === null ? 'rgba(255, 99, 132, 0.5)' : 'rgb(255, 99, 132)'),
                    },
                  }}
                />
              )}
            </div>
          </div>
        </div>
      ))}
      <audio id="audioPlayer" ref={audioRef} style={{ display: 'none' }}>
        <source id="audioSource" src="" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
  };


  export default function SingleChannelPage() {
    return (
      <Suspense fallback={<div>Loading channel data...</div>}>
        <ChannelContent />
      </Suspense>
    );
  }
