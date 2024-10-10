/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  env: {
    ...dotenv.config({
      path: path.resolve(__dirname, '../.env')
    }).parsed
  },
};

export default nextConfig;
