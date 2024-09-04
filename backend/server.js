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

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server successfully started on port ${PORT}`);
});
