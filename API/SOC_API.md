# RRMS API ‒ SoC ↔ WebServer

## SoC Initialisation

### POST /init

#### Parameters

|             |          |               |                                                                                                     |
| ----------- | -------- | ------------- | --------------------------------------------------------------------------------------------------- |
| **Name**    | **Type** | **Data Type** | **Description**                                                                                     |
| soc-id      | Required | String        | An ID used to uniquely identify a SoC (Initially use a concatenation of the SoC’s channels)         |
| frequencies | Required | List[Float]  | A list of frequencies listened to by the SoC                                                        |
| reboot      | Optional | Boolean       | True if lost connection and is re-connecting, False if connecting for the first time. Assumed False |


#### Responses

|          |                   |                                                                                                           |
| -------- | ----------------- | --------------------------------------------------------------------------------------------------------- |
| **Code** | **Content-Type**  | **Example**                                                                                               |
| 201      | application/json  | {"code": 201, "messages": ["Configuration created successfully", "missing-times": [[1000011, 1001011]} |
| 400      | application/json  | {"code": 400, "messages": ["Parameter ‘frequencies’ not provided"]}                                      |
| 500      | application/json  | {"code": 400, "messages": ["Internal Server Error"]}                                                     |


#### When to Use

/init is used when a SoC first connects to internet, so the Web Server knows it is active

/init is re-used if connection is lost, and then restores without a reboot of the pi

On status code 2xx, missing-times is provided by the server. This is all of the (relevant) timestamps where the server is missing analytics data from this device


## SoC Analytics

### POST /data/single

#### Parameters

|             |          |               |                                                                                             |
| ----------- | -------- | ------------- | ------------------------------------------------------------------------------------------- |
| **Name**    | **Type** | **Data Type** | **Description**                                                                             |
| soc-id      | Required | String        | An ID used to uniquely identify a SoC (Initially use a concatenation of the SoC’s channels) |
| timestamp   | Required | Integer       | A timestamp of when this data was sampled (UTC Unix Epoch time)                             |
| frequencies | Optional | List[Float]  | A list of frequencies listened to by the SoC. (i.e keys in the usage and strength Objects)  |
| sample-rate | Optional | Integer       | How often this data is sampled, measured in milliseconds/message                            |
| usage       | Optional | Object\*      | Holds a mapping from frequency to usage data at this timestamp                              |
| strength    | Optional | Object\*      | Holds a mapping from frequency to signal strength at the given timestamp                    |

See example for structure


#### Parameters Example


	{    
		"soc-id": 162.475.163.825.162.9875,
		"timestamp": 1724322719,
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
| 200      | application/json  | {"code": 200, "start-stream": False}                               |
| 400      | application/json  | {"code": 400, "messages": ["Parameter ‘timestamp’ not provided"]} |
| 500      | application/json  | {"code": 400, "messages": ["Internal Server Error"]}              |


#### When to Use

/data/single will be constantly pinged, at a previously agreed upon sample-rate, whenever a SoC can connect to the web server

Web server is to store this data

On 200 response code, the parameter "start-stream" will indicate if the web server has requested some live monitoring from this SoC


### POST /data/multiple

#### Parameters

|             |          |                   |                                                                                                  |
| ----------- | -------- | ----------------- | ------------------------------------------------------------------------------------------------ |
| **Name**    | **Type** | **Data Type**     | **Description**                                                                                  |
| soc-id      | Required | String            | An ID used to uniquely identify a SoC (Initially use a concatenation of the SoC’s channels)      |
| timestamps  | Required | Object[Object]\* | An Object, with timestamps as indexes, then frequencies as indexes, then usage and strength data |
| frequencies | Optional | Float             | A list of frequencies listened to by the SoC. (i.e keys in the usage and strength Objects)       |
| sample-rate | Optional | Integer           | How often this data is sampled, measured in milliseconds/message                                 |

\*See example for structure


#### Parameters Example

	{    
		"soc-id": 162.475.163.825.162.9875, 
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

SoC Monitoring requires a constant connection, so will utilise websockets for this purpose


### Socket soc-init

#### Parameters

|             |          |               |                                                                                             |
| ----------- | -------- | ------------- | ------------------------------------------------------------------------------------------- |
| **Name**    | **Type** | **Data Type** | **Description**                                                                             |
| type        | Required | String        | "soc-init"                                                                                  |
| soc-id      | Required | String        | An ID used to uniquely identify a SoC (Initially use a concatenation of the SoC’s channels) |
| frequencies | Optional | List[Float]  | A list of frequencies listened to by the SoC. (i.e keys in the usage and strength Objects)  |


#### Parameters Example

	{    
		"type": "soc-init", 
		"soc-id": 162.475.163.825.162.9875, 
		"frequencies": [162.475, 163.825, 162.9875]
	}


#### Response Parameters

|           |          |               |                                                                                                      |
| --------- | -------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| **Name**  | **Type** | **Data Type** | **Description**                                                                                      |
| type      | Required | String        | "soc-init"                                                                                           |
| frequency | Required | Float         | Desired Frequency for RoIP Monitoring                                                                |
| confirm   | Optional | Boolean       | (Hopefully) redundant check to see if the web server still wants this SoC to stream. Default is True |


#### Response Parameters Example

	{    
		"type": "soc-init", 
		"frequency": 162.475, 
		"confirm": true
	}


#### When to Use

When it is indicated that monitoring is requested on this SoC, and/or if a SoC wants to check if monitoring is required, soc-init can be used

Soc-init is designed to be originally sent from a SoC


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