# RRMS API ‒ SoC ↔ WebServer

> All API calls use JSON and HTTP unless otherwise specified

>DISCLAIMER: This API is flexible and subject to change

## SoC Initialisation

### HTTP from SoC → WebServer Analytics

### POST /upload/data

#### Parameters

|             |          |                   |                                                                                                  |
| ----------- | -------- | ----------------- | ------------------------------------------------------------------------------------------------ |
| **Name**    | **Type** | **Data Type**     | **Description**                                                                                  |
| soc-id      | Required | String            | An ID used to uniquely identify a SoC (Predetermined)      |
| address | Optional | String | IP address and Port to be used by Web Server to talk back to SoC later |
| message-id | Optional | integer | Sequential counter of messages, which can be used to detect if the program has restarted |
| data  | Required | Object[Object]\* | An Object, with frequencies as indexes, then usage and strength data |

\*See example for structure


#### Parameters Example

	/data/upload?soc-id=162475163&address=128.10.20.30:8080&data={162475000:{usage:[1724322719, false],strength={1724322719:-75.1},channel-name=Fremantle}}

	{
		"soc-id": 162475163,
		"address": “128.10.20.30:8080”,
		"message-id": 112,
		data: {
			162475000: {
				"usage": [
				[1724322719, false], //(time, is_start_time)
				[1724322719, true]
				],
				"strength" {
					1724322719: -75.1,
					1724322724: -73.2
				},
				"channel-name": Fremantle,
			},
			163825000: {
				"usage": [
				[1724322600, false] //(time, is_start_time)
				],
				"strength" {
					1724322600: -105.1,
					1724322724: -103.2
				},
				"channel-name": Marble Bar,
			}
		}
	}


#### Responses

|          |                   |                                                                     |
| -------- | ----------------- | ------------------------------------------------------------------- |
| **Code** | **Content-Type**  | **Example**                                                         |
| 200      | application/json  | {"code": 200}                                                       |
| 400      | application/json  | {"code": 400, "messages": ["Parameter 'timestamps' not provided"]} |
| 500      | application/json  | {"code": 400, "messages": ["Internal Server Error"]}               |


#### When to Use

/data/multiple will be used whenever the server is lacking analytics data at any particular data point, and so an SoC can send the missing information, if it has it. Data will be sent as JSON - unless otherwise mentioned.


## SoC Monitoring WebServer → SoC

SoC Monitoring requires a constant connection, so will a HTTP stream interface for this purpose.
We assume the Web Server hold the IP information of the SoC already.


### POST /tune

#### Parameters

|             |          |                   |                                                                                                  |
| ----------- | -------- | ----------------- | ------------------------------------------------------------------------------------------------ |
| **Name**    | **Type** | **Data Type**     | **Description**                                                                                  |
| freq     | Required | Integer       | The Hz value the SDR should stream |


#### Parameters Example

	/tune?freq=477112500

	{
		"freq": 477112500,
	}


#### Responses

|          |                   |                                                                     |
| -------- | ----------------- | ------------------------------------------------------------------- |
| **Code** | **Content-Type**  | **Example**                                                         |
| 200      | application/json  | {"code": 200}                                                       |
| 400      | application/json  | {"code": 400, "messages": ["Parameter 'timestamps' not provided"]} |
| 500      | application/json  | {"code": 400, "messages": ["Internal Server Error"]}               |


#### When to Use

When changing which frequency should be streamed, send this request to the raspberry pi and rtl_fm will restart

### GET STREAM /stream

#### Parameters

 N/A

#### Responses

|          |                   |                                                                     |
| -------- | ----------------- | ------------------------------------------------------------------- |
| **Code** | **Content-Type**  | **Example**                                                         |
| 200      | application/json  | {"code": 200}                                                       |
| 400      | application/json  | {"code": 400, "messages": ["Parameter 'timestamps' not provided"]} |
| 500      | application/json  | {"code": 400, "messages": ["Internal Server Error"]}               |


#### When to Use

A 200 response will begin a stream, so the HTTP request does not get closed, and will stream all mp3 audio as it comes in