//import pg from 'pg' //pg is PostgreSQL
const { Client } = require('pg')

const ALIVETIME = 15;

let isConnecting = false;
let isConnected = false;

let client = new Client({
        user: process.env.DB_USER || 'user',
        host: process.env.DB_HOST || 'db',
        database: process.env.DB_NAME || 'testdb',
        password: process.env.DB_PASSWORD || 'password',
        port: process.env.DB_PORT || 5432,
      });


async function connectToDatabase(dbName = "testdbmu") {
  const maxRetries = 10;
  let retries = 0;
  isConnecting = true;

  while (retries < maxRetries) {
    try {
      client = new Client({
        user: process.env.DB_USER || 'user',
        host: process.env.DB_HOST || 'db',
        database: dbName || process.env.DB_NAME,
        password: process.env.DB_PASSWORD || 'password',
        port: process.env.DB_PORT || 5432,
      });
      await client.connect();
      isConnected = true;
      break;
    } catch (err) {
      retries++;
      console.error(`Failed to connect to the database. Retry ${retries}/${maxRetries}.`, err);
      await new Promise(res => setTimeout(res, 5000));
    }
  }
  isConnecting = false;
  if (retries === maxRetries) {
    console.error('Could not connect to the database after multiple attempts. Exiting...');
    process.exit(1);
  }
}

async function recheckConnection(dbName) {
  if (!isConnected && !isConnecting) {
    await connectToDatabase(dbName);
  }
}

function convertToAPIForm(arr) {
  let output = [];
  for (const elem of arr) {
    let info = {};
    info["channel-id"] = elem["c_id"];
    info["frequency"] = elem["c_freq"];
    info["channel-name"] = elem["c_name"];
    output.push(info);
  }
  return output;
}

async function getAliveChannels(dbName) {
  await recheckConnection(dbName);
  // Get channels which have received data in last 15 seconds from strength table 
  // On a currently non-streaming device
  // unless the channel itself is being streamed
  const query = `SELECT DISTINCT ch.c_id, ch.c_freq, ch.c_name FROM "strength" AS st INNER JOIN "channels" AS ch ON st.c_id = ch.c_id 
                WHERE st.s_sample_time > ${Math.floor(new Date().getTime()/1000) - ALIVETIME} AND 
                ((d_id NOT IN (SELECT d_id FROM "channels" AS c INNER JOIN "session_listeners" AS sl ON c.c_id = sl.c_id)) 
                OR (st.c_id IN (SELECT c_id FROM "session_listeners")))`;
  
  let res = await client.query(query);
  return convertToAPIForm(res.rows);
}

async function getBusyChannels(dbName) {
  await recheckConnection(dbName);
  // Get channels which have received data in last 15 seconds from strength table 
  // On a currently streaming device
  // but not the channel being streamed
  const query = `SELECT DISTINCT ch.c_id, ch.c_freq, ch.c_name FROM "strength" AS st INNER JOIN "channels" AS ch ON st.c_id = ch.c_id 
                WHERE st.s_sample_time > ${Math.floor(new Date().getTime()/1000) - ALIVETIME} AND 
                ((d_id IN (SELECT d_id FROM "channels" AS c INNER JOIN "session_listeners" AS sl ON c.c_id = sl.c_id)) 
                AND NOT (st.c_id IN (SELECT c_id FROM "session_listeners")))`;
  
  let res = await client.query(query);
  return convertToAPIForm(res.rows);
}

async function getOfflineChannels(dbName) {
  await recheckConnection(dbName);
  // Get channels which have not received any data in last 15 seconds
  const query = `SELECT DISTINCT ch.c_id, ch.c_freq, ch.c_name FROM "channels" AS ch 
                WHERE ch.c_id NOT IN (SELECT c_id FROM "strength" 
                WHERE s_sample_time > ${Math.floor(new Date().getTime()/1000) - ALIVETIME})`;
  
  let res = await client.query(query);
  return convertToAPIForm(res.rows);
}

function getCondFromWhiteBlackList(requestObj) {
  let cond = "";
  //whitelist has precedence over blacklist
  if ("whitelist" in requestObj) {
    if (requestObj.whitelist.length === 0) {
      return {}
    }
    cond = `IN ${"(" + requestObj.whitelist.toString() + ")"}`
  } else if ("blacklist" in requestObj) {
    if (requestObj.blacklist.length === 0) {
      cond = "=1 OR 1=1"
    } else {
      cond = `NOT IN ${"(" + requestObj.blacklist.toString() + ")"}`
    }
  } else {
    console.log(requestObj);
    throw new Error("Neither blacklist nor whitelist has been specified")
  }
  return cond;
}

function getCondStartEndTimes(requestObj) {
  let cond = "";
  if ("start-time" in requestObj) {
    cond += `AND s_sample_time >= ${requestObj["start-time"]}`
  }
  if ("end-time" in requestObj) {
    cond += `AND s_sample_time <= ${requestObj["end-time"]}`
  }
  return cond;
}

async function getChannelStrength(requestObj, dbName) {
  await recheckConnection(dbName);
  let cond = getCondFromWhiteBlackList(requestObj)+getCondStartEndTimes(requestObj);

  let query = `SELECT c_id, s_strength, s_sample_time FROM "strength"
              WHERE c_id ${cond}
              ORDER BY c_id, s_sample_time`;
  let res = await client.query(query);
  let output = {};
  for (const row of res.rows) {
    if (!(row.c_id in output)) {
      output[row.c_id] = {}
    }
      output[row.c_id][row.s_sample_time] = row.s_strength;
  }
  return output;
}

async function getChannelUtilisation(requestObj, dbName) {
  await recheckConnection(dbName);
  let cond = getCondFromWhiteBlackList(requestObj);
  if ("start-time" in requestObj) {
    cond += `AND (a_end_time IS NULL OR a_end_time >= ${requestObj["start-time"]})`
  }
  if ("end-time" in requestObj) {
    cond += `AND a_start_time <= ${requestObj["end-time"]}`
  }

  let query = `SELECT c_id, a_start_time, a_end_time FROM "utilisation"
              WHERE c_id ${cond}
              ORDER BY c_id, a_start_time`;
  let res = await client.query(query);
  let output = {};
  for (const row of res.rows) {
    if (!(row.c_id in output)) {
      output[row.c_id] = []
    }
      output[row.c_id].push([row.a_start_time, row.a_end_time]);
  }
  return output;
}

//export{ getAliveChannels, getOfflineChannels, getBusyChannels, getChannelStrength, getChannelUtilisation};

exports.getAliveChannels = getAliveChannels;
exports.getOfflineChannels = getOfflineChannels;
exports.getBusyChannels = getBusyChannels;
exports.getChannelStrength = getChannelStrength;
exports.getChannelUtilisation = getChannelUtilisation;