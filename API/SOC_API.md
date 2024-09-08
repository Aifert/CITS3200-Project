# RRMS API ‒ SoC ↔ WebServer

> All API calls use JSON and HTTP unless otherwise specified

>DISCLAIMER: This API is flexible and subject to change

## SoC Initialisation

### HTTP from SoC → WebServer Analytics

### POST /data

#### Parameters

|             |          |                   |                                                                                                  |
| ----------- | -------- | ----------------- | ------------------------------------------------------------------------------------------------ |
| **Name**    | **Type** | **Data Type**     | **Description**                                                                                  |
| soc-id      | Required | String            | An ID used to uniquely identify a SoC (Predetermined)      |
| address | Optional | String | IP address and Port to be used by Web Server to talk back to SoC later |
| data  | Required | Object[Object]\* | An Object, with frequencies as indexes, then frequencies as indexes, then usage and strength data |

\*See example for structure


#### Parameters Example

	{    
		"soc-id": 162475163, 
		“address”: “128.10.20.30:8080”,
		data: {
			162475000: {
				"usage": [
				(1724322719, 1724322724, false), //(start_time, end_time, sdr_busy)
				(1724322719, null, true)
				],
				"strength" {
					1724322719: -75.1,
					1724322724: -73.2
				}
			},
			163825000: {
				"usage": [
				(1724322600, 1724322710, false) //(start_time, end_time, sdr_busy)
				],
				"strength" {
					1724322600: -105.1,
					1724322724: -103.2
				}
			}
		}
	}


#### Responses

|          |                   |                                                                     |
| -------- | ----------------- | ------------------------------------------------------------------- |
| **Code** | **Content-Type**  | **Example**                                                         |
| 200      | application/json  | {"code": 200}                                                       |
| 400      | application/json  | {"code": 400, "messages": ["Parameter ‘timestamps’ not provided"]} |
| 500      | application/json  | {"code": 400, "messages": ["Internal Server Error"]}               |


#### When to Use

/data/multiple will be used whenever the server is lacking analytics data at any particular data point, and so an SoC can send the missing information, if it has it. Data will be sent as JSON - unless otherwise mentioned.


## SoC Monitoring

SoC Monitoring requires a constant connection, so will utilise websockets for this purpose.  
We assume the Web Server hold the IP information of the SoC already.


### Socket soc-init

#### soc-init Parameters

|           |          |               |                                                                                                      |
| --------- | -------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| **Name**  | **Type** | **Data Type** | **Description**                                                                                      |
| type      | Required | String        | "soc-init"|
| frequency | Required | Float         | Desired Frequency for RoIP Monitoring|


#### Parameters Example

	{    
		"type": "soc-init", 
		"frequency": 162.475
	}


#### When to Use

Soc-init is designed to be originally sent from the Web Server, when monitoring is first requested


### Socket soc-abort

#### Parameters

|           |          |               |                                                 |
| --------- | -------- | ------------- | ----------------------------------------------- |
| **Name**  | **Type** | **Data Type** | **Description**                                 |
| type      | Required | String        | "soc-abort"                                     |
| frequency | Required | Float         | Frequency no longer desired for RoIP Monitoring |


#### Parameters Example

	{    
		"type": "soc-abort", 
		"frequency": 162.475
	}


#### Response Parameters

|           |          |               |                                                 |
| --------- | -------- | ------------- | ----------------------------------------------- |
| **Name**  | **Type** | **Data Type** | **Description**                                 |
| type      | Required | String        | "soc-init"                                      |
| frequency | Required | Float         | Frequency no longer desired for RoIP Monitoring |




#### Response Parameters Example

	{    
		"type": "soc-abort", 
		"frequency": 162.475
	}

This is how the web server can indicate to an SoC that live RoIP is no longer required

Soc-abort is designed to be originally sent from the web server.


### Socket stream

TBA - Need to investigate implementations.

Current thoughts is either send raw binary through websockets, or use a library such as FFMPEG