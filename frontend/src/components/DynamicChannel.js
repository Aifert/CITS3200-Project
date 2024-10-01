import React, { useState } from 'react';

const DynamicChannels = ({ data, handleStateClick, audioRef }) => {
  const [sliderValues, setSliderValues] = useState(data.map(() => 50));
  const [isPlayingArray, setIsPlayingArray] = useState(data.map(() => false)); 

  const handleSliderChange = (e, index) => {
    const newSliderValues = [...sliderValues];
    newSliderValues[index] = e.target.value;
    setSliderValues(newSliderValues);
  
    if (audioRef.current && isPlayingArray[index]) { 
      audioRef.current.volume = newSliderValues[index] / 100;
    }
  };
  

  const handlePlayPauseClick = (index, channel, state) => {
    const isCurrentlyPlaying = isPlayingArray[index];
  
    const newIsPlayingArray = data.map((_, i) => i === index ? !isCurrentlyPlaying : false);
    setIsPlayingArray(newIsPlayingArray);
  
    data.forEach((item, i) => {
      data[i].State = i === index ? (isCurrentlyPlaying ? "Pause" : "Play") : "Pause";
    });
  
    if (!isCurrentlyPlaying && audioRef.current) {
      audioRef.current.volume = sliderValues[index] / 100;
      handleStateClick(channel); 
    } else {
      handleStateClick(channel); 
    }
  };
  

  const renderButton = (state, channel, index) => {
    return (
      <button
        onClick={() => handlePlayPauseClick(index, channel, state)}
        style={{
          backgroundColor: isPlayingArray[index] ? 'red' : 'green',
          color: 'white',
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
    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', border: '1px solid gray' }}>
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
              {renderButton(row.State, row.Channel, i)}
            </td>

            <td style={{ padding: '8px', textAlign: 'center', color: 'white' }}>{row.Channel}</td>

            <td style={{ padding: '8px', textAlign: 'center', color: 'white' }}>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderValues[i]}
                onChange={(e) => handleSliderChange(e, i)}
                style={{ width: '100%' }}
              />
            </td>

            <td style={{ padding: '8px', textAlign: 'center', color: 'white' }}>{row.Frequency}</td>

            
            <td style={{ padding: '8px', textAlign: 'center', color: 'white' }}>
              <div style={{
                height: '10px',
                width: '100%',
                background: 'linear-gradient(90deg, red, yellow, green)',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: `${row.SignalStrength}%`,
                  height: '100%',
                  width: '2px',
                  background: 'black'
                }}></div>
              </div>
              <div style={{ marginTop: '5px' }}>{row.SignalStrength}%</div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DynamicChannels;


