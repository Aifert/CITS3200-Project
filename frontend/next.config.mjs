/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = dotenv.config({ path: path.resolve(__dirname, '../.env') }).parsed;

const nextConfig = {
  env: env, // Explicitly set the environment variables
  images: {
    domains: ['dfes.wa.gov.au', 'csu-ses.com.au'],
  },
  // Your other Next.js configurations here
};

export default nextConfig;
