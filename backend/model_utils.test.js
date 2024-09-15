const { Client } = require('pg');
const fs = require('fs');
const model_utils = require('./model_utils');
//import { getAliveChannels, getOfflineChannels, getBusyChannels, getChannelStrength, getChannelUtilisation } from "./model_utils.js";

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

test("Connect to Init Server", async () => {
  await initclient.connect();
  const oldExists = await initclient.query("SELECT 1 FROM pg_database WHERE datname='testdbmu'");
  if (oldExists.rows.length === 1) {
    await initclient.query("DROP DATABASE testdbmu WITH (FORCE)");
  }  
  const creation = await initclient.query("CREATE DATABASE testdbmu");
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
  console.log(timedOutput);
  expect(Object.keys(timedOutput).length).toBe(1);
  
  const requestObjAllOthers = {};
  requestObjAllOthers.blacklist = [];
  requestObjAllOthers["end-time"] = nowTime-2;
  const otherTimedOutput = await model_utils.getChannelUtilisation(requestObjAllOthers, 'testdbmu');
  expect(Object.keys(otherTimedOutput).length).toBe(totalStrength);
})

test("Disconnect from Server", async () => {
  await testclient.end();
  await initclient.end();
})