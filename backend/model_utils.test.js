const { Client } = require('pg');
const fs = require('fs');
const model_utils = require('./model_utils');

const initclient = new Client({
  user: 'user',
  host: 'db',
  database: 'mydb',
  password: 'password',
  port: 5432,
});

const testclient = new Client({
  user: 'user',
  host: 'db',
  database: 'testdbmu',
  password: 'password',
  port: 5432,
});

const insertclient = new Client({
  user: 'user',
  host: 'db',
  database: 'testdbi',
  password: 'password',
  port: 5432,
});

test("Connect to Init Server", async () => {
  await initclient.connect();
  let oldExists = await initclient.query("SELECT 1 FROM pg_database WHERE datname='testdbmu'");
  if (oldExists.rows.length === 1) {
    await initclient.query("DROP DATABASE testdbmu WITH (FORCE)");
  }  
  let creation = await initclient.query("CREATE DATABASE testdbmu");
  expect(creation.command).toBe("CREATE");

  oldExists = await initclient.query("SELECT 1 FROM pg_database WHERE datname='testdbi'");
  if (oldExists.rows.length === 1) {
    await initclient.query("DROP DATABASE testdbi WITH (FORCE)");
  }  
  creation = await initclient.query("CREATE DATABASE testdbi");
  expect(creation.command).toBe("CREATE");
});

test("Connect to Test Server", async () => {
  await testclient.connect();
  const initQuery = fs.readFileSync("./webserver/database/init.sql");
  const initResponse = await testclient.query(initQuery.toString());
  expect(initResponse.length).toBeGreaterThan(1);
  const populateQuery = fs.readFileSync("./webserver/database/testpopulate.sql");
  const populateResponse = await testclient.query(populateQuery.toString());
  expect(populateResponse.length).toBeGreaterThan(1);
});

test("Channel States", async () => {
  const nowTime = Math.floor(new Date().getTime()/1000)-1;
  const query1 = `INSERT INTO "strength" (c_id, s_sample_time, s_strength)
  VALUES (1, ${nowTime}, -80.0)`;
  const query2 = `INSERT INTO "strength" (c_id, s_sample_time, s_strength)
  VALUES (3, ${nowTime}, -80.0)`;
  let creation = await testclient.query(query1);
  expect(creation.command).toBe("INSERT");
  creation = await testclient.query(query2);
  expect(creation.command).toBe("INSERT");

  let active = await model_utils.getAliveChannels('testdbmu');
  expect(active.length).toBe(1);

  let busy = await model_utils.getBusyChannels('testdbmu');
  expect(busy.length).toBe(1);

  let offline = await model_utils.getOfflineChannels('testdbmu');
  expect(offline.length).toBe(2);
  expect(Object.keys(offline[0])).toContain("channel-id");
  expect(Object.keys(offline[0])).toContain("frequency");
  expect(Object.keys(offline[0])).toContain("channel-name");

  const removalQuery = `DELETE FROM "strength" WHERE s_sample_time = ${nowTime}`;
  await testclient.query(removalQuery);
});

test("Strength Data", async () => {
  const requestObjAll = {};
  requestObjAll.blacklist = [];
  const output = await model_utils.getChannelStrength(requestObjAll, 'testdbmu');
  const totalStrength = Object.keys(output).length;
  expect(totalStrength).toBeGreaterThan(1);
  expect(Object.keys(output[Object.keys(output)[0]]).length).toBeGreaterThan(0);

  const requestObjBlack = {};
  requestObjBlack.blacklist = [Object.keys(output)[0]];
  const blackOutput = await model_utils.getChannelStrength(requestObjBlack, 'testdbmu');
  const blackTotal = Object.keys(blackOutput).length;
  expect(blackTotal).toBe(totalStrength-1);
  expect(Object.keys(blackOutput)).not.toContain(Object.keys(output)[0]);

  const requestObjWhite = {};
  requestObjWhite.whitelist = [Object.keys(output)[0]];
  const whiteOutput = await model_utils.getChannelStrength(requestObjWhite, 'testdbmu');
  const whiteTotal = Object.keys(whiteOutput).length;
  expect(whiteTotal).toBe(1);
  expect(Object.keys(whiteOutput)).toContain(Object.keys(output)[0]);

  const nowTime = Math.floor(new Date().getTime()/1000);
  const query1 = `INSERT INTO "strength" (c_id, s_sample_time, s_strength)
  VALUES (1, ${nowTime}, -80.0)`;
  
  const creation = await testclient.query(query1);
  expect(creation.command).toBe("INSERT");
  
  requestObjAll["start-time"] = nowTime-2;
  const timedOutput = await model_utils.getChannelStrength(requestObjAll, 'testdbmu');
  expect(Object.keys(timedOutput).length).toBe(1);
  
  const requestObjAllOthers = {};
  requestObjAllOthers.blacklist = [];
  requestObjAllOthers["end-time"] = nowTime-2;
  const otherTimedOutput = await model_utils.getChannelStrength(requestObjAllOthers, 'testdbmu');
  expect(Object.keys(otherTimedOutput).length).toBe(totalStrength);
});

test("Utilisation Data", async () => {
    const requestObjAll = {};
  requestObjAll.blacklist = [];
  const output = await model_utils.getChannelUtilisation(requestObjAll, 'testdbmu');
  const totalStrength = Object.keys(output).length;
  expect(totalStrength).toBeGreaterThan(1);
  expect(Object.keys(output[Object.keys(output)[0]]).length).toBeGreaterThan(0);

  const requestObjBlack = {};
  requestObjBlack.blacklist = [Object.keys(output)[0]];
  const blackOutput = await model_utils.getChannelUtilisation(requestObjBlack, 'testdbmu');
  const blackTotal = Object.keys(blackOutput).length;
  expect(blackTotal).toBe(totalStrength-1);
  expect(Object.keys(blackOutput)).not.toContain(Object.keys(output)[0]);

  const requestObjWhite = {};
  requestObjWhite.whitelist = [Object.keys(output)[0]];
  const whiteOutput = await model_utils.getChannelUtilisation(requestObjWhite, 'testdbmu');
  const whiteTotal = Object.keys(whiteOutput).length;
  expect(whiteTotal).toBe(1);
  expect(Object.keys(whiteOutput)).toContain(Object.keys(output)[0]);

  const nowTime = Math.floor(new Date().getTime()/1000);
  const query1 = `INSERT INTO "utilisation" (c_id, a_start_time, a_end_time)
  VALUES (1, ${nowTime}, ${nowTime+1})`;
  
  const creation = await testclient.query(query1);
  expect(creation.command).toBe("INSERT");
  
  requestObjAll["start-time"] = nowTime-2;
  const timedOutput = await model_utils.getChannelUtilisation(requestObjAll, 'testdbmu');
  expect(Object.keys(timedOutput).length).toBe(1);
  
  const requestObjAllOthers = {};
  requestObjAllOthers.blacklist = [];
  requestObjAllOthers["end-time"] = nowTime-2;
  const otherTimedOutput = await model_utils.getChannelUtilisation(requestObjAllOthers, 'testdbmu');
  expect(Object.keys(otherTimedOutput).length).toBe(totalStrength);
})


test("Connect to Insertion Server", async () => {
  await insertclient.connect();
  const initQuery = fs.readFileSync("./webserver/database/init.sql");
  const initResponse = await insertclient.query(initQuery.toString());
  expect(initResponse.length).toBeGreaterThan(1);
})

test("Testing SDR Insertion", async () => {
  const testObj = {
    "soc-id": 2, 
    "address": "128.10.20.30:8080",
    "data": {
      162475000: {
        "usage": [
        [1724322719, 1724322724, false],
        [1724322719, "NULL", true]
        ],
        "strength": {
          1724322719: -75.1,
          1724322724: -73.2
        }
      },
      163825000: {
        "usage": [
        [1724322600, 1724322710, false]
        ],
        "strength": {
          1724322600: -105.1,
          1724322724: -103.2
        }
      }
    }
  }
  await model_utils.processIncomingData(testObj, "testdbi");
  const deviceTable = (await insertclient.query(`SELECT * FROM "devices"`)).rows;
  const channelTable = (await insertclient.query(`SELECT * FROM "channels"`)).rows;
  const strengthTable = (await insertclient.query(`SELECT * FROM "strength"`)).rows;
  const utilTable = (await insertclient.query(`SELECT * FROM "utilisation"`)).rows;

  expect(deviceTable.length).toBe(1);
  expect(channelTable.length).toBe(2);
  expect(strengthTable.length).toBe(4);
  expect(utilTable.length).toBe(3);
  expect(deviceTable[0]["d_address"]).toBe("128.10.20.30");
  expect(deviceTable[0]["d_port"]).toBe(8080);

  const testObj2 = {
    "soc-id": 2, 
    "address": "127.10.20.30:8980",
    "data": {
      162475000: {
        "usage": [],
        "strength": {
          1724372719: -75.5,
          1724372724: -73.7
        }
      },
      163825100: {
        "usage": [
        [1724372600, 1724372710]
        ],
        "strength": {
          1724372600: -106.2,
          1724372724: -104.3
        }
      }
    }
  }
  await model_utils.processIncomingData(testObj2, "testdbi");
  const deviceTable2 = (await insertclient.query(`SELECT * FROM "devices"`)).rows;
  const channelTable2 = (await insertclient.query(`SELECT * FROM "channels"`)).rows;
  const strengthTable2 = (await insertclient.query(`SELECT * FROM "strength"`)).rows;
  const utilTable2 = (await insertclient.query(`SELECT * FROM "utilisation"`)).rows;

  expect(deviceTable2.length).toBe(1);
  expect(channelTable2.length).toBe(3);
  expect(strengthTable2.length).toBe(8);
  expect(utilTable2.length).toBe(4);
  expect(deviceTable2[0]["d_address"]).toBe("127.10.20.30");
  expect(deviceTable2[0]["d_port"]).toBe(8980);

})



test("Disconnect from Server", async () => {
  await testclient.end();
  await insertclient.end();
  await initclient.end();
})