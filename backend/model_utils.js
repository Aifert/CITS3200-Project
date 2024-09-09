import pg from 'pg' //pg is PostgreSQL
const { Client } = pg;

const ALIVETIME = 15;

let isConnecting = false;
let isConnected = false;

let client = new Client({
        user: process.env.DB_USER || 'user',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'testdb',
        password: process.env.DB_PASSWORD || 'password',
        port: process.env.DB_PORT || 5432,
      });


async function connectToDatabase() {
  const maxRetries = 10;
  let retries = 0;
  isConnecting = true;

  while (retries < maxRetries) {
    try {
      client = new Client({
        user: process.env.DB_USER || 'user',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'testdb',
        password: process.env.DB_PASSWORD || 'password',
        port: process.env.DB_PORT || 5432,
      });

      console.log('Attempting to connect to the database...');
      await client.connect();
      console.log('Connected to the database');
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

async function recheckConnection() {
  if (!isConnected && !isConnecting) {
    await connectToDatabase();
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

async function getAliveChannels() {
  await recheckConnection();
  // Get channels which have received data in last 15 seconds from strength table 
  // On a currently non-streaming device
  // unless the channel itself is being streamed
  const query = `SELECT DISTINCT ch.c_id, ch.c_freq, ch.c_name FROM "Strength" AS st INNER JOIN "Channels" AS ch ON st.c_id = ch.c_id 
                WHERE st.s_sample_time > ${Math.floor(new Date().getTime()/1000) - ALIVETIME} AND 
                ((d_id NOT IN (SELECT d_id FROM "Channels" AS c INNER JOIN "Session_Listeners" AS sl ON c.c_id = sl.c_id)) 
                OR (st.c_id IN (SELECT c_id FROM "Session_Listeners")))`;
  
  let res = await client.query(query);
  return convertToAPIForm(res.rows);
}

async function getBusyChannels() {
  await recheckConnection();
  // Get channels which have received data in last 15 seconds from strength table 
  // On a currently streaming device
  // but not the channel being streamed
  const query = `SELECT DISTINCT ch.c_id, ch.c_freq, ch.c_name FROM "Strength" AS st INNER JOIN "Channels" AS ch ON st.c_id = ch.c_id 
                WHERE st.s_sample_time > ${Math.floor(new Date().getTime()/1000) - ALIVETIME} AND 
                ((d_id IN (SELECT d_id FROM "Channels" AS c INNER JOIN "Session_Listeners" AS sl ON c.c_id = sl.c_id)) 
                AND NOT (st.c_id IN (SELECT c_id FROM "Session_Listeners")))`;
  
  let res = await client.query(query);
  return convertToAPIForm(res.rows);
}

async function getOfflineChannels() {
  await recheckConnection();
  // Get channels which have not received any data in last 15 seconds
  const query = `SELECT DISTINCT ch.c_id, ch.c_freq, ch.c_name FROM "Channels" AS ch 
                WHERE ch.c_id NOT IN (SELECT c_id FROM "Strength" 
                WHERE s_sample_time > ${Math.floor(new Date().getTime()/1000) - ALIVETIME})`;
  
  let res = await client.query(query);
  return convertToAPIForm(res.rows);
}

async function getChannelStrength(requestObj) {
  await recheckConnection();
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
    throw new Error("Neither blacklist nor whitelist has been specified")
  }
  let query = `SELECT c_id, s_strength, s_sample_time FROM "Strength"
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

export{ getAliveChannels, getOfflineChanneels, getBusyChannels, getChannelStrength};