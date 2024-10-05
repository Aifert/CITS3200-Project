const { Client } = require('pg')
const fs = require('fs');

const ALIVETIME = 150;
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


async function connectToDatabase(dbName = "mydb", isNew = false) {
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

async function recheckConnection(dbName = "mydb") {
  let isNew = false;
  if (!hasEverConnected) {
    await client.connect();
    hasEverConnected = true;
  }
  if ((client.database != dbName) || (!isConnected && !isConnecting)) {
    if (client.database != dbName) {
      const exists = (await client.query(`SELECT datname FROM pg_database WHERE datname = '${dbName}'`)).rows.length;
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
    info["device-id"] = elem["d_id"];
    output.push(info);
  }
  return output;
}

async function getAliveChannels(dbName) {
  await recheckConnection(dbName);
  // Get channels which have received data in last 15 seconds from strength table 
  // On a currently non-streaming device
  // unless the channel itself is being streamed
  const query = `SELECT DISTINCT ch.c_id, ch.c_freq, ch.c_name, ch.d_id FROM "strength" AS st INNER JOIN "channels" AS ch ON st.c_id = ch.c_id 
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
  const query = `SELECT DISTINCT ch.c_id, ch.c_freq, ch.c_name, ch.d_id FROM "strength" AS st INNER JOIN "channels" AS ch ON st.c_id = ch.c_id 
                WHERE st.s_sample_time > ${Math.floor(new Date().getTime()/1000) - ALIVETIME} AND 
                ((d_id IN (SELECT d_id FROM "channels" AS c INNER JOIN "session_listeners" AS sl ON c.c_id = sl.c_id)) 
                AND NOT (st.c_id IN (SELECT c_id FROM "session_listeners")))`;
  
  let res = await client.query(query);
  return convertToAPIForm(res.rows);
}

async function getOfflineChannels(dbName) {
  await recheckConnection(dbName);
  // Get channels which have not received any data in last 15 seconds
  const query = `SELECT DISTINCT ch.c_id, ch.c_freq, ch.c_name, ch.d_id FROM "channels" AS ch 
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
    const newStartTime = Math.floor(new Date().getTime()/1000) - requestObj["start-time"];
    cond += ` AND s_sample_time >= ${newStartTime}`
  }
  if ("end-time" in requestObj) {
    cond += ` AND s_sample_time <= ${requestObj["end-time"]}`
  }
  return cond;
}

async function getChannelStrength(requestObj, dbName) {
  await recheckConnection(dbName);
  const nowTime = Math.floor(new Date().getTime()/1000);
  let endTime = nowTime;
  if ("end-time" in requestObj) {
    endTime = requestObj["end-time"];
  }
  let sampleRate = 24*60*60; //Defaults to every day
  if ("sample-rate" in requestObj) {
    sampleRate = requestObj["sample-rate"];
  }
  let cond = getCondFromWhiteBlackList(requestObj)+getCondStartEndTimes(requestObj);
  let query = `SELECT c_id, FLOOR((${endTime}-s_sample_time)/${sampleRate}) AS zone, 
   CASE WHEN AVG(s_strength) < ${STRENGTHMIN} THEN ${STRENGTHMIN} WHEN AVG(s_strength) > ${STRENGTHMAX} THEN ${STRENGTHMAX} ELSE AVG(s_strength) END AS "s_strength" 
   FROM "strength" WHERE c_id ${cond}
   GROUP BY c_id, zone
   ORDER BY c_id, zone`
  let res = await client.query(query);
  let query2 = `SELECT c_id, AVG(s_strength) AS s_average FROM "strength"
              WHERE c_id ${cond} GROUP BY c_id`;
  let aveStrength = await client.query(query2);

const SECONDS_IN_A_DAY = 86400;
let maxZone = SECONDS_IN_A_DAY / sampleRate;
  let minZone = 0

   if ("start-time" in requestObj) {
    maxZone = (requestObj["start-time"]-(nowTime-endTime))/sampleRate;
   }

   //Don't include more than 50 data points in total - otherwise it can easily slow down the front end and server
   maxZone = maxZone - minZone > 50 ? minZone + 50 : maxZone;

  let output = {};
  for (const row of res.rows) {
    if (!(row.c_id in output)) {
      output[row.c_id] = {};
      output[row.c_id].values = {};
      for (let i = minZone; i < maxZone; i++) {
        output[row.c_id].values[i] = null;
      }
    }
    if (row.zone < maxZone && row.zone >= minZone) {
      output[row.c_id].values[row.zone] = row.s_strength;
    }
  }
  for (const row of aveStrength.rows) {
      output[row.c_id]["average"] = row.s_average;
  }
  return output;
}

function calculateZoneUtilAvg(pairedValues, nowTime, sampleRate, currentZone) {
  let zoneTime = nowTime - currentZone * sampleRate; //"end-time" of this zone of length sampleRate
  let zoneUpTime = 0; //holds the usage time across this zone
  if (!pairedValues[pairedValues.length-1][1]) {
    pairedValues[pairedValues.length-1][1] = nowTime;
  }
  //pairedValues can be presumed to be sorted
  //while there are unfinished uptime pairs, and the last one fits within this zone at all
  while (pairedValues.length > 0 && pairedValues[pairedValues.length-1][1] > zoneTime-sampleRate) {
    //if the uptime pair finishes within this zone, pop it from values
    if (pairedValues[pairedValues.length-1][0] > zoneTime-sampleRate) {
      const oldVal = pairedValues.pop()
      zoneUpTime += Math.min(oldVal[1], zoneTime) - oldVal[0];
    } else {
      //add the portion of the uptime pair that is in this zone to uptime
      zoneUpTime += Math.min(pairedValues[pairedValues.length-1][1], zoneTime) - (zoneTime-sampleRate);
      break;
    }
  }
  return 100.0*zoneUpTime/sampleRate; //%up time for this zone
}

async function getChannelUtilisation(requestObj, dbName) {
  const nowTime = Math.floor(new Date().getTime()/1000);
  await recheckConnection(dbName);
  
  let sampleRate = 24*60*60; // default to one day
  let avgData = false;

  let maxZone = 60*24*60*30/sampleRate;
  let minZone = 0
  if ("avg-data" in requestObj && requestObj["avg-data"] === "true") {
    avgData = true
    if ("sample-rate" in requestObj) {
      sampleRate = requestObj["sample-rate"];
    }
  }

  let cond = getCondFromWhiteBlackList(requestObj);
  let percentageStart = requestObj?.["start-time"] ? nowTime-requestObj["start-time"] : -1;
  let percentageEnd = requestObj?.["end-time"] ? requestObj["end-time"] : nowTime;
  
  if ("start-time" in requestObj) {
    cond += `AND (a_end_time IS NULL OR a_end_time >= ${nowTime-requestObj["start-time"]})`
    maxZone = (requestObj["start-time"]-(nowTime-percentageEnd))/sampleRate;
  }
  if ("end-time" in requestObj) {
    cond += `AND a_start_time <= ${requestObj["end-time"]}`;
    //minZone = (nowTime - requestObj["end-time"])/sampleRate;
  }

  //Don't include more than 50 data points in total - otherwise it can easily slow down the front end and server
   maxZone = maxZone - minZone > 50 ? minZone + 50 : maxZone;

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

  //If want to calculate averages per sample time period
  if (avgData) {
    const nowTime = percentageEnd;//Math.floor(new Date().getTime()/1000);
    for (let cId in output) {
      output[cId].zones = {}; //one zone for every "sample-time" length period

      //If last timeslot ends in null, set it to the current time for easlier calculation
      if (!output[cId].values[output[cId].values.length-1][1]) {
        output[cId].values[output[cId].values.length-1][1] = nowTime;
      }
      //Calulate for every specified zone
      for (let zone = minZone; zone < maxZone; zone++) {
        output[cId].zones[zone] = calculateZoneUtilAvg(output[cId].values, percentageEnd, sampleRate, zone);
      }
    }
  }
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
    let recentMin = `SELECT c.c_freq, j.m FROM "channels" AS c JOIN (SELECT c_id, MAX(a_start_time) AS m FROM "utilisation" WHERE a_end_time IS NULL GROUP BY c_id) AS j ON c.c_id=j.c_id`
    let results = (await client.query(recentMin)).rows;
    if ("address" in dataObj) {
      await updateDeviceInfo(dataObj, dbName);
    }
    let startTime = [Math.floor(new Date().getTime()/1000), false];
    for (let frequency in dataObj.data) {
      const freqObj = dataObj.data[frequency];
      await updateChannelInfo(dataObj["soc-id"], frequency, dbName);
      const channelId = (await client.query(`SELECT c_id FROM "channels" WHERE c_freq = ${frequency} AND d_id = ${dataObj["soc-id"]}`)).rows[0]["c_id"];
      if ("strength" in freqObj) {
        for (let timePeriod in freqObj.strength) {
          startTime[0] = Math.min(startTime, timePeriod);
          const query = `INSERT INTO "strength" ("c_id", "s_sample_time", "s_strength")
                        VALUES (${channelId}, ${timePeriod}, ${freqObj.strength[timePeriod]})`
          await client.query(query);
        }
      }
      if ("usage" in freqObj) {
        //start time
        for (let r in results) {
          if (results[r]["c_freq"] == frequency) {
            startTime = [results[r]["m"], true]
          }
        }
        let periodRecords = []
        if (startTime < Math.floor(new Date().getTime()/1000)) {
          periodRecords.push([startTime, null])
        }
        for (let timePeriod in freqObj.usage) {
          //if timestamp is a start time
          if (freqObj.usage[timePeriod][1] == "true" || freqObj.usage[timePeriod][1] === true) {
            //if no period records exist, or the most recent one has an end time
            //if most recent period record ends in null, ignore the start time
            if (periodRecords.length === 0 || periodRecords[periodRecords.length-1][1]) {
                periodRecords.push([freqObj.usage[timePeriod][0], null]);
            }
          } else {
            //the most recent period record does not have an end time
            if (periodRecords.length >= 1 && !periodRecords[periodRecords.length-1][1]) {
              periodRecords[periodRecords.length-1][1] = freqObj.usage[timePeriod][0]
            }
          }
        }
        let query = ""
        for (let i = 0; i < periodRecords.length; i++) {
          if (i === 0 && startTime[1]) {
            query = `UPDATE "utilisation" SET a_end_time = ${periodRecords[0][1]} WHERE c_id = ${channelId} AND a_start_time = ${startTime[0]};`+ query
            continue;
          }
          query += `INSERT INTO "utilisation" ("c_id", "a_start_time", "a_end_time") VALUES (${channelId}, ${periodRecords[i][0]}, ${periodRecords[i][1]});`;
        }
        await client.query(query);
      }
    }
    return "Successfully processed data"
  }  catch(error) {
    throw error;
  }
}

async function generateUtilDataDump(requestObj, dbName) {
  try{
    await recheckConnection(dbName);
    let cond = getCondFromWhiteBlackList(requestObj);
    if ("start-time" in requestObj) {
      requestObj["start-time"] = Math.floor(new Date().getTime()/1000) - requestObj["start-time"];
      cond += `AND (a_end_time IS NULL OR a_end_time >= ${requestObj["start-time"]})`
    }
    if ("end-time" in requestObj) {
      cond += `AND a_start_time <= ${requestObj["end-time"]}`;
    }
    let query = `SELECT c.d_id, c.c_name, c.c_freq, u.a_start_time, u.a_end_time, u.a_end_time-u.a_start_time
                FROM "utilisation" AS u JOIN "channels" AS c ON c.c_id=u.c_id
                WHERE c.c_id ${cond}
                ORDER BY c.c_id, u.a_start_time`;
    let res = await client.query(query);
    let output = "Device Number, Channel Name, Channel Frequency, Transmission Start Time, Transmission End Time, Transmission Length";
    for (const row of res.rows) {
      output += "\n" + Object.values(row).toString();
    }
    return output;

  } catch(error){
    throw error;
  }
}

async function generateStrengthDataDump(requestObj, dbName) {
  try{
    await recheckConnection(dbName);
    let cond = getCondFromWhiteBlackList(requestObj)+getCondStartEndTimes(requestObj);
    let query = `SELECT c.d_id, c.c_name, c.c_freq, s.s_sample_time, s.s_strength
                 FROM "channels" AS c JOIN "strength" AS s ON s.c_id=c.c_id
                WHERE s.c_id ${cond}
                ORDER BY s.c_id, s.s_sample_time`;
    let res = await client.query(query);
    let output = "Device Number, Channel Name, Channel Frequency, Sample Time, Strength";
    for (const row of res.rows) {
      output += "\n" + Object.values(row).toString();
    }
    return output;

  } catch(error){
    throw error;
  }
}

//request object is channel-id: [strengthCutOff, utilCutOff, utilTimes]
async function checkNotificationState(requestObj, dbName) {
  try {
    const nowTime = Math.floor(new Date().getTime()/1000);
    await recheckConnection(dbName);
    //If channel is alive, send the most recent strength reading
    let sQuery = `SELECT c_id, s_strength FROM "strength"
                  WHERE (c_id, s_sample_time) IN
                  (SELECT c_id, MAX(s_sample_time) FROM "strength" WHERE s_sample_time >= ${nowTime-ALIVETIME} GROUP BY c_id)`;
    let res = await client.query(sQuery);

    //Make object with channel id as key, and most recent strength value as the value
    let strengthLookUp = {}
    for (let r in res.rows) {
      strengthLookUp[res.rows[r]["c_id"]] = res.rows[r]["s_strength"];
    }
    let output = {};
    //check for every channel
    for (let channel in requestObj) {
      output[channel] = {};
      //If channel is alive it will have a lookup value
      if (channel in strengthLookUp) {
        output[channel]["strength"] = strengthLookUp[channel] >= requestObj[channel][0];
      } else { //If not alive, send null
        output[channel]["strength"] = null;
      }
    }
    let maxTimeAgo = 120; //Needed to ensure all values recieved in sql query
    for (channel in requestObj) {
      maxTimeAgo = Math.max(maxTimeAgo, requestObj[channel][2])
    }
    //get all utilisation pairs within the maximum time ago
    let uQuery = `SELECT c_id, a_start_time, a_end_time FROM "utilisation"
                  WHERE a_end_time >= ${nowTime - maxTimeAgo} OR a_end_time is NULL
                  ORDER BY c_id, a_start_time`;
    res = await client.query(uQuery)
    //Calculate like utilisationdata, but just for a single zone (0)
    let uResults = {};
    for (const row of res.rows) {
      if (!(row.c_id in uResults)) {
        uResults[row.c_id] = {};
        uResults[row.c_id].values = [];
      }
        uResults[row.c_id].values.push([row.a_start_time, row.a_end_time]);
    }
    for (let channel in requestObj) {
      const channelAvg = calculateZoneUtilAvg(uResults[channel].values, nowTime, requestObj[channel][2], 0);
      output[channel]["util"]  = channelAvg >= requestObj[channel][1];
    }
    return output;
  } catch(error) {
    throw error;
  }
}

module.exports = {
  getAliveChannels,
  getOfflineChannels,
  getBusyChannels,
  getChannelStrength,
  getChannelUtilisation,
  processIncomingData,
  generateStrengthDataDump,
  generateUtilDataDump,
  checkNotificationState
}



