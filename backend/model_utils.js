const { Client } = require('pg')
const fs = require('fs');

const ALIVETIME = 120;
const STRENGTHMAX = -70.0;
const STRENGTHMIN = -110;

let isConnecting = false;
let isConnected = false;
let hasEverConnected = false;

let client = new Client({
        user: process.env.DB_USER || 'user',
        host: process.env.DB_HOST || 'db',
        database: process.env.DB_NAME || 'mydb',
        password: process.env.DB_PASSWORD || 'password',
        port: process.env.DB_PORT || 5432,
      });


async function connectToDatabase(dbName = "testdbmu", isNew = false) {
  const maxRetries = 10;
  let retries = 0;
  isConnecting = true;

  while (retries < maxRetries) {
    try {
      client = new Client({
        user: process.env.DB_USER || 'user',
        host: process.env.DB_HOST || 'db',
        database: process.env.DB_NAME || dbName ,
        password: process.env.DB_PASSWORD || 'password',
        port: process.env.DB_PORT || 5432,
      });
      await client.connect();
      isConnected = true;
      if (isNew) {
        console.log("NEW");
        const initQuery = fs.readFileSync("./webserver/database/init.sql");
        const initResponse = await client.query(initQuery.toString());
      }
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

async function recheckConnection(dbName = "testdbmu") {
  let isNew = false;
  if (!hasEverConnected) {
    await client.connect();
    hasEverConnected = true;
    console.log("mydb", client.database, dbName)
  }
  if ((client.database != dbName) || (!isConnected && !isConnecting)) {
    if (client.database != dbName) {
      const exists = (await client.query(`SELECT datname FROM pg_database WHERE datname = '${dbName}'`)).rows.length;
      console.log(exists);
      if (exists == 0) {
        await client.query("CREATE DATABASE "+dbName);
        isNew = true;
      }
      await client.end();
    }
    await connectToDatabase(dbName, isNew);
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
      //This will always return false, as nothing in the whitelist will return nothing
      return "=-1"
    }
    cond = `IN ${"(" + requestObj.whitelist.toString() + ")"}`
  } else if ("blacklist" in requestObj) {
    if (requestObj.blacklist.length === 0) {
      cond = "<>-1"
    } else {
      cond = ` NOT IN ${"(" + requestObj.blacklist.toString() + ")"}`
    }
  } else {
    throw new Error("Neither blacklist nor whitelist has been specified")
  }
  return cond;
}

function getCondStartEndTimes(requestObj) {
  let cond = "";
  if ("start-time" in requestObj) {
    cond += ` AND s_sample_time >= ${requestObj["start-time"]}`
  }
  if ("end-time" in requestObj) {
    cond += ` AND s_sample_time <= ${requestObj["end-time"]}`
  }
  return cond;
}

async function getChannelStrength(requestObj, dbName) {
  await recheckConnection(dbName);
  let cond = getCondFromWhiteBlackList(requestObj)+getCondStartEndTimes(requestObj);

  let query = `SELECT c_id, 
              CASE WHEN s_strength < ${STRENGTHMIN} THEN ${STRENGTHMIN} WHEN s_strength > ${STRENGTHMAX} THEN ${STRENGTHMAX} ELSE s_strength END AS "s_strength",
              s_sample_time FROM "strength"
              WHERE c_id ${cond}
              ORDER BY c_id, s_sample_time`;
  let res = await client.query(query);
  let query2 = `SELECT c_id, AVG(s_strength) AS s_average FROM "strength"
              WHERE c_id ${cond} GROUP BY c_id`;
  let aveStrength = await client.query(query2);
  let output = {};;
  for (const row of res.rows) {
    if (!(row.c_id in output)) {
      output[row.c_id] = {};
      output[row.c_id].values = {}
    }
      output[row.c_id].values[row.s_sample_time] = row.s_strength;
  }
  for (const row of aveStrength.rows) {
      output[row.c_id]["average"] = row.s_average;
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
    cond += `AND a_start_time <= ${requestObj["end-time"]}`;
  }
  let query = `SELECT c_id, a_start_time, a_end_time FROM "utilisation"
              WHERE c_id ${cond}
              ORDER BY c_id, a_start_time`;
  let res = await client.query(query);
  let output = {};
  for (const row of res.rows) {
    if (!(row.c_id in output)) {
      output[row.c_id] = {};
      output[row.c_id].values = [];
    }
      output[row.c_id].values.push([row.a_start_time, row.a_end_time]);
  }

  let percentageStart = requestObj?.["start-time"] ? requestObj["start-time"] : -1;
  let percentageEnd = requestObj?.["end-time"] ? requestObj["end-time"] : Math.floor(new Date().getTime()/1000);
  Object.keys(output).forEach(c_id => {
    const values = output[c_id].values;
    let totalTime = 0, utilTime = 0;

    let startTime = percentageStart === -1 ? values[0][0] : percentageStart;

    values.forEach((timePair, index) => {
      const [start, end] = timePair;
      if (end < startTime) return;

      const thisStart = Math.max(start, startTime);
      const nextStart = values[index + 1]?.[0] || percentageEnd; 

      totalTime += nextStart - thisStart;
      utilTime += Math.min(end, percentageEnd) - thisStart;
    });

    output[c_id].average = (utilTime / totalTime) * 100;
  });

  return output;

  return output;
}

async function isDeviceNew(deviceId, dbName) {
  await recheckConnection(dbName);
  let query = `SELECT d_id FROM "devices" WHERE d_id = ${deviceId}`
  return (await client.query(query)).rows.length === 0;
}

async function updateDeviceInfo(dataObj, dbName) {
  await recheckConnection(dbName);
  let query = "";
  if (await isDeviceNew(dataObj["soc-id"], dbName)) {
    query = `INSERT INTO "devices" ("d_id", "d_address", "d_port")
                  VALUES (${dataObj["soc-id"]}, '${dataObj.address.split(":")[0]}', ${dataObj.address.split(":")[1]})`;
  } else {
    query = `UPDATE "devices" SET "d_address" = '${dataObj.address.split(":")[0]}',
                   "d_port" = ${dataObj.address.split(":")[1]}
                   WHERE "d_id"=${dataObj["soc-id"]}`;
  }
  await client.query(query);
}

async function isChannelNew(deviceId, freq, dbName) {
  await recheckConnection(dbName);
  const query = `SELECT c_id FROM "channels" WHERE d_id = ${deviceId} AND c_freq = ${freq}`;
  return (await client.query(query)).rows.length === 0;
}

async function updateChannelInfo(deviceId, freq, dbName) {
  await recheckConnection(dbName);
  if (await isChannelNew(deviceId, freq, dbName)) {
    const query = `INSERT INTO "channels" (c_freq, c_name, d_id)
                  VALUES (${freq}, 'Channel ${freq}', ${deviceId})`;
    await client.query(query);
  }
}

async function processIncomingData(dataObj, dbName) {
  try{
    await recheckConnection(dbName);

    if ("address" in dataObj) {
      await updateDeviceInfo(dataObj, dbName);
    }
    for (let frequency in dataObj.data) {
      const freqObj = dataObj.data[frequency];
      await updateChannelInfo(dataObj["soc-id"], frequency, dbName);
      const channelId = (await client.query(`SELECT c_id FROM "channels" WHERE c_freq = ${frequency} AND d_id = ${dataObj["soc-id"]}`)).rows[0]["c_id"];
      if ("strength" in freqObj) {
        for (let timePeriod in freqObj.strength) {
          const query = `INSERT INTO "strength" ("c_id", "s_sample_time", "s_strength")
                        VALUES (${channelId}, ${timePeriod}, ${freqObj.strength[timePeriod]})`
          await client.query(query);
        }
      }
      if ("usage" in freqObj) {
        for (let timePeriod in freqObj.usage) {
          let query = `INSERT INTO "utilisation" ("c_id", "a_start_time", "a_end_time")
                        VALUES (${channelId}, ${freqObj.usage[timePeriod][0]}, ${freqObj.usage[timePeriod][1]})`
          await client.query(query);
        }
      }
    }

    return "Successfully processed data"
  }
  catch(error){
    throw error;
  }
}
module.exports = {
  getAliveChannels,
  getOfflineChannels,
  getBusyChannels,
  getChannelStrength,
  getChannelUtilisation,
  processIncomingData
}
