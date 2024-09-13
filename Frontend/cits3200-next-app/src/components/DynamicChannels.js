import React, { useState } from 'react';

const DynamicChannels = ({ data, handleStateClick }) => {
  const [sliderValues, setSliderValues] = useState(
    data.map(() => 50) 
  );

  const handleSliderChange = (e, index) => {
    const newSliderValues = [...sliderValues];
    newSliderValues[index] = e.target.value;
    setSliderValues(newSliderValues);
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
          <tr key={i} style={{ borderTop: '1px solid gray', borderBottom: '1px solid gray' }}> {/* Border only on top and bottom */}
            <td
              onClick={() => handleStateClick(row.Channel)}
              style={{ padding: '8px', cursor: 'pointer', color: 'white', textAlign: 'center' }}
            >
              {row.State}
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
