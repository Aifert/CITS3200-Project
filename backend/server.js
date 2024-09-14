/*
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg'; // PostgreSQL client
*/
const express = require('express');
const cors = require('cors');
const path = require('path');
const { fileURLToPath } = require('url');
const dotenv = require('dotenv');
const pg = require('pg')
const model_utils = require("./model_utils");

//import { getAliveChannels, getOfflineChannels, getBusyChannels, getChannelStrength, getChannelUtilisation } from "./model_utils.js";

const app = express();
const PORT = process.env.PORT || 9000;
//const __filename = fileURLToPath(import.meta.url);
//const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Client } = pg;

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

app.get('/active-channels', async (req, res) => {
  try{
    let returnVal = {}
    returnVal["active"] = await model_utils.getAliveChannels();
    returnVal["busy"] = await model_utils.getBusyChannels();
    returnVal["offline"] = await model_utils.getOfflineChannels();
    res.send(returnVal)
  }
  catch(error){
    res.status(500).send({
      code: 500,
      message: "Error occurred while getting channels",
      error: error.message,
    })
  }
});

app.get('/analytics/data', async (req, res) => {
  console.log(req);
  const sendObj = req.query;
  let requestObj = {}
  for (const elem in sendObj) {
    requestObj[elem] = sendObj[elem].includes("[")?JSON.parse(sendObj[elem]):parseInt(sendObj[elem]);
  }
  try{
    const strengthData = await model_utils.getChannelStrength(requestObj)
    const utilisationData = await model_utils.getChannelUtilisation(requestObj)
    let returnVal = {}
    for (const key in strengthData) {
      returnVal[key] = {}
      returnVal[key]["strength"] = strengthData[key]
    }
    for (const key in utilisationData) {
      if (!(key in returnVal)) {
        returnVal[key] = {}
      }
      returnVal[key]["utilisation"] = utilisationData[key]
    }
    res.send(returnVal)
  }
  catch(error){
    res.status(500).send({
      code: 500,
      message: "Error occurred while getting channels",
      error: error.message,
    })
  }
});

app.listen(PORT, () => {
  console.log(`Server successfully started on port ${PORT}`);
});
