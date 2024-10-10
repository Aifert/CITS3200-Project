'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import GenerateKeyButton from './components/GenerateKeyButton';
import ApiKeyDisplay from './components/ApiKeyDisplay';

const ApiKeyPage = () => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { data: session } = useSession();
  const router = useRouter();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:9000/api_v2/';
  const userName = session?.user?.name.toLowerCase();

  const handleGenerateClick = () => {
    const isConfirmed = window.confirm(
      'Warning: Generating a new API key will invalidate your old one. Are you sure you want to continue?'
    );
    if (isConfirmed) {
      generateApiKey();
    }
  };

  const generateApiKey = async () => {
    if (!session) {
      setError('You must be logged in to generate an API key.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${backendUrl}generate_api_key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${userName}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to generate API key');
      }

      const data = await response.json();
      setApiKey(`${userName}-${data.apiKey}`);
    } catch (err) {
      setError('An error occurred while generating the API key. Please try again.');
      console.error('Error generating API key:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 flex jusitfy-center flex-col ">
      <h1 className="text-2xl font-bold mb-6 flex justify-center items-center">API Key Management</h1>

      {error && <p className="text-red-500 mb-4 flex justify-center">{error}</p>}

      <div className="flex justify-center flex-col items-center">
        <GenerateKeyButton onClick={handleGenerateClick} />
      </div>

      {apiKey && <ApiKeyDisplay apiKey={apiKey} />}
    </div>
  );
};

export default ApiKeyPage;
