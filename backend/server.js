import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { exec } from 'child_process';

import pg from 'pg' //pg is PostgreSQL


const { Client } = pg

const client = new Client({
  user: 'user',
  host: 'db',
  database: 'mydb',
  password: 'password',
  port: 5432,
});

//Simple demo of SQL query, will delete
client.connect().then(() => {
  client.query('SELECT * FROM "Devices"', (err, res) => {
    console.log(res.rows)
    client.end()
  });
});



const app = express();
const PORT = process.env.PORT || 9000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

app.use(cors());

app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

app.use(express.static(path.join(__dirname, 'public')));

const secret = process.env.WEBHOOK_API_KEY;

function verifySignature(req, res, buf) {
    const signature = `sha1=${crypto
        .createHmac('sha1', secret)
        .update(buf)
        .digest('hex')}`;

    if (req.headers['x-hub-signature'] !== signature) {
        return res.status(401).send('Invalid signature.');
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server successfully started on port ${PORT}`);
});
