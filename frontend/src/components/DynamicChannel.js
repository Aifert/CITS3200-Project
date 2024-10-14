import React, { useState } from 'react';

const DynamicChannels = ({ data, handleStateClick, audioRef, sliderValue }) => {
  // Initialize sliderValues and isPlayingArray with default values
  const [sliderValues, setSliderValues] = useState(data.map(() => 50)); // Default volume of 50
  const [isPlayingArray, setIsPlayingArray] = useState(data.map(() => false)); // All channels are initially paused

  // Function to handle volume slider changes
  const handleSliderChange = (e, index) => {
    const newSliderValues = [...sliderValues];
    newSliderValues[index] = e.target.value;
    setSliderValues(newSliderValues);

    // Check if the audioRef and isPlayingArray[index] are valid before setting volume
    if (audioRef.current && isPlayingArray[index]) {
      const volume = (newSliderValues[index] / 100) * (sliderValue / 100); // row volume * master volume
      if (!isNaN(volume)) {
        audioRef.current.volume = volume; // Set volume only if it is a valid number
      }
    }
  };

  // Function to handle play/pause button clicks
  const handlePlayPauseClick = (index, channel, state) => {
    const isCurrentlyPlaying = isPlayingArray[index];

    // Update the play/pause state for the clicked channel and reset others to false
    const newIsPlayingArray = data.map((_, i) => (i === index ? !isCurrentlyPlaying : false));
    setIsPlayingArray(newIsPlayingArray);

    // Update the state in data to reflect the play/pause status
    data.forEach((item, i) => {
      data[i].State = i === index ? (isCurrentlyPlaying ? 'Pause' : 'Play') : 'Pause';
    });

    // If the channel is now playing, set its volume and handle state click
    if (!isCurrentlyPlaying && audioRef.current) {
      const volume = (sliderValues[index] / 100) * (sliderValue / 100); // row volume * master volume
      if (!isNaN(volume)) {
        audioRef.current.volume = volume;
      }
      handleStateClick(channel, true);
    } else {
      // Pause the current channel
      handleStateClick(channel, false);
    }
  };

  // Function to render the play/pause button with dynamic styles
  const renderButton = (state, channel, index) => {
    return (
      <button
        onClick={() => handlePlayPauseClick(index, channel, state)}
        style={{
          backgroundColor: isPlayingArray[index] ? 'red' : 'green',
          color: 'black',
          padding: '5px 10px',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer',
        }}
      >
        {isPlayingArray[index] ? 'Pause' : 'Play'}
      </button>
    );
  };

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'black', border: '1px solid gray' }}>
      <thead>
        <tr>
          <th style={{ border: '1px solid gray', padding: '8px' }}>State</th>
          <th style={{ border: '1px solid gray', padding: '8px' }}>Channel</th>
          <th style={{ border: '1px solid gray', padding: '8px' }}>Volume</th>
          <th style={{ border: '1px solid gray', padding: '8px' }}>Frequency</th>
          <th style={{ border: '1px solid gray', padding: '8px' }}>Signal Strength</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} style={{ borderTop: '1px solid gray', borderBottom: '1px solid gray' }}>
            <td style={{ padding: '8px', textAlign: 'center' }}>
              {renderButton(row.status, row.name, i)}
            </td>

            {/* Remove 'Channel ' from the row.name */}
            <td style={{ padding: '8px', textAlign: 'center', color: 'black' }}>
              {row.name.replace('Channel ', '')}
            </td>

            {/* Volume slider control */}
            <td style={{ padding: '8px', textAlign: 'center', color: 'black' }}>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderValues[i] || 50} // Fallback to 50 if the value is undefined
                onChange={(e) => handleSliderChange(e, i)}
                style={{ width: '100%' }}
              />

            </td>

            {/* Display frequency */}
            <td style={{ padding: '8px', textAlign: 'center', color: 'black' }}>{row.frequency}</td>

            {/* Signal strength display */}
            <td style={{ padding: '8px', textAlign: 'center', color: 'black' }}>
              <div
                style={{
                  height: '10px',
                  width: '100%',
                  background: 'linear-gradient(90deg, red, yellow, green)',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '0',
                    left: `${parseInt(row.strength) < -50 ? 0 : parseInt(row.strength) > 40 ? 100 : (parseInt(row.strength)+50)/90.0*100.0}%`,
                    height: '100%',
                    width: '2px',
                    background: 'black',
                  }}
                ></div>
              </div>
              <div style={{ marginTop: '5px' }}>{row.strength}</div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DynamicChannels;
