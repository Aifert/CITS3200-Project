import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg'; // PostgreSQL client

const app = express();
const PORT = process.env.PORT || 9000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Client } = pg;

async function connectToDatabase() {
  const maxRetries = 10;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const client = new Client({
        user: process.env.DB_USER || 'user',
        host: process.env.DB_HOST || 'db',
        database: process.env.DB_NAME || 'mydb',
        password: process.env.DB_PASSWORD || 'password',
        port: process.env.DB_PORT || 5432,
      });

      console.log('Attempting to connect to the database...');
      await client.connect();
      console.log('Connected to the database');

      const result = await client.query('SELECT * FROM "Devices"');
      console.log('Query Results:', result.rows);

      await client.end();
      break;
    } catch (err) {
      retries++;
      console.error(`Failed to connect to the database. Retry ${retries}/${maxRetries}.`, err);
      await new Promise(res => setTimeout(res, 5000));
    }
  }

  if (retries === maxRetries) {
    console.error('Could not connect to the database after multiple attempts. Exiting...');
    process.exit(1);
  }
}

connectToDatabase();


app.use(cors());

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server successfully started on port ${PORT}`);
});
