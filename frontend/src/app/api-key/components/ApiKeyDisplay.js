import { useState } from "react";

const ApiKeyDisplay = ({ apiKey }) => {
  const [copyButtonText, setCopyButtonText] = useState('Copy');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey)
      .then(() => {
        setCopyButtonText('Copied');
        setTimeout(() => setCopyButtonText('Copy'), 2000);
      })
      .catch(err => console.error('Error copying to clipboard:', err));
  };

  const downloadApiKey = () => {
    const element = document.createElement('a');
    const file = new Blob([apiKey], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = 'api_key.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="mt-4">
      <p className="mb-2">Your API Key:</p>
      <div className="bg-gray-100 p-3 rounded flex justify-between items-center">
        <code className="text-sm">{apiKey}</code>
        <div>
          <button
            onClick={copyToClipboard}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded mr-2"
          >
            {copyButtonText}
          </button>
          <button
            onClick={downloadApiKey}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-1 px-2 rounded"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyDisplay;
