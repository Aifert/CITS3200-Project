# RRMS API ‒ SoC ↔ WebServer

> All API calls use JSON and HTTP unless otherwise specified

## SoC Initialisation

### HTTP from SoC → WebServer Analytics

### POST /data/single

#### Parameters

|             |          |               |                                                                                             |
| ----------- | -------- | ------------- | ------------------------------------------------------------------------------------------- |
| **Name**    | **Type** | **Data Type** | **Description**                                                                             |
| soc-id      | Required | String        | An ID used to uniquely identify a SoC (Initially use a concatenation of the SoC’s channels) |
| address | Required | String | IP address and Port to be used by Web Server to talk back to SoC later |
| timestamp   | Required | Integer       | A timestamp of when this data was sampled (UTC Unix Epoch time)                             |
| soc-names | Optional | List\[String\] | Names of the channels listened to by this SoC |
| frequencies | Optional | List[Float]  | A list of frequencies listened to by the SoC. (i.e keys in the usage and strength Objects)  |
| sample-rate | Optional | Integer       | How often this data is sampled, measured in milliseconds/message                            |
| usage       | Optional | Object\*      | Holds a mapping from frequency to usage data at this timestamp                              |
| strength    | Optional | Object\*      | Holds a mapping from frequency to signal strength at the given timestamp                    |

See example for structure


#### Parameters Example


	{    
		"soc-id": 162.475.163.825.162.9875,
		"address": "128.10.20.30:8080",
		"timestamp": 1724322719,
	    "soc-names": [“208 Halls Creek”, “209 Halls Creek”, “210 Halls Creek”],
		"frequencies": [162.475, 163.825, 162.9875],
		"sample-rate": 5000, 
		"usage": {
			162.475: 0.5, 
			163.825: 0.2, 
			162.987: 0.0 }, 
		"strength": {        
			162.475: 0.5, 
			163.825: 6.2, 
			162.9875: 0.0 }
	}


#### Responses

|          |                   |                                                                    |
| -------- | ----------------- | ------------------------------------------------------------------ |
| **Code** | **Content-Type**  | **Example**                                                        |
| 200      | application/json  | {"code": 200,}                               |
| 400      | application/json  | {"code": 400, "messages": ["Parameter ‘timestamp’ not provided"]} |
| 500      | application/json  | {"code": 400, "messages": ["Internal Server Error"]}              |


#### When to Use

/data/single will be constantly pinged, at a previously agreed upon sample-rate, whenever a SoC can connect to the web server
The consistency of this ping is how a web-server can know if this SoC is online
Web server is to store this data in a database on device
On 400 response code, will include a list of all error messages


### POST /data/multiple

#### Parameters

|             |          |                   |                                                                                                  |
| ----------- | -------- | ----------------- | ------------------------------------------------------------------------------------------------ |
| **Name**    | **Type** | **Data Type**     | **Description**                                                                                  |
| soc-id      | Required | String            | An ID used to uniquely identify a SoC (Initially use a concatenation of the SoC’s channels)      |
| address | Optional | String | IP address and Port to be used by Web Server to talk back to SoC later |
| timestamps  | Required | Object[Object]\* | An Object, with timestamps as indexes, then frequencies as indexes, then usage and strength data |
| frequencies | Optional | Float             | A list of frequencies listened to by the SoC. (i.e keys in the usage and strength Objects)       |
| sample-rate | Optional | Integer           | How often this data is sampled, measured in milliseconds/message                                 |

\*See example for structure


#### Parameters Example

	{    
		"soc-id": 162.475.163.825.162.9875, 
		“address”: “128.10.20.30:8080”,
		"timestamps": {        
			1724322719: {            
				"usage": {                
					162.475: 0.5, 
					163.825: 0.2, 
					162.987: 0.0 }            
				"strength": {                
					162.475: 0.5, 
					163.825: 6.2, 
					162.987: 0.0 } }        
			1724322724: {            
				"usage": {                
					162.475: 0.5, 
					163.825: 0.2, 
					162.987: 0.0 }            
				"strength": {                
					162.475: 0.5, 
					163.825: 6.2, 
					162.987: 0.0 } }, 
		"frequencies": [162.475, 163.825, 162.9875]    
		"sample-rate": 5000
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