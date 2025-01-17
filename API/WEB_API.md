# RRMS API ‒ Web Page ↔ WebServer

>All data is HTTP Web Page→WebServer, unless otherwise specified. All requests should be authenticated
>This document only includes the data flow as an API, not the page-loading HTTP endpoints

## HTTP from Front-end → WebServer Initialisation

### GET /api_v2/active-channels

#### Responses Parameters

| Name | Type | Data Type | Description |
| :---- | :---- | :---- | :---- |
| code | Required | Integer | HTTP response code |
| errors | Optional | List\[String\] | If response is not 2xx, error messages are here |
| alive | Optional | List\[Object\*\] | List of all the channel name/frequency pairs available for monitoring |
| offline | Optional | List\[Object\*\] | List of all the channel name/frequency pairs with historic analytics but not currently online |

\*See below for example structure

#### Responses Example

	/api_v2/active-channels

	{
		"code": 200,
		"alive": [{
			"channel-id": 21892,
			"channel-name": "Perth 1",
			"frequency": 162.475
		}],
		"busy": [{
			"channel-id": 21321892,
			"channel-name": "Perth 2",
			"frequency": 162.55
		}],
		"offline": [{
			"channel-id": 192838,
			"channel-name": "Perth 1",
			"frequency": 162.825
		}]
	}

#### When to Use

When first loading/reloading/opening, get a list of channels to request streaming from, and a list of channels you can get analytics from

## HTTP from Front-end → WebServer Streaming

### GET /monitor-channels/start

#### Parameters

| Name | Type | Data Type | Description |
| :---- | :---- | :---- | :---- |
| session-id | Required | String | Unique string identifying the session |
| channel-id | Optional | Integer | Radio channel name to listen in to |

#### Parameters Example

	{
		"session-id": 10437528,
		"channel-id": 21892
	}

#### Responses Parameters

| Name | Type | Data Type | Description |
| :---- | :---- | :---- | :---- |
| code | Required | Integer | HTTP response code |
| errors | Optional | List\[String\] | If response is not 2xx, error messages are here |
| stream | Required | A byte stream of MPEG audio

#### Responses Example

	{
		"code": 200,
		"stream": <BYTE STREAM>
	}

#### When to Use

When requesting to connect to a stream, the web server will generate an http audio stream and return it

## HTTP from Front-end → WebServer Analytics

### GET /analytics/data

#### Parameters

| Name | Type | Data Type | Description |
| :---- | :---- | :---- | :---- |
| white-list | Optional | List\[Integer\] | If used, only get data for these channels |
| black-list | Optional | List\[Integer\] | If used, return data for all channels except these ones. Only one of white or black list should be included |
| start-time | Required | Integer | Length of time ago (in seconds) to request data for |
| end-time | Optional | Integer | Latest raw time (in seconds) that data should be requested until. If not included, assumed at late as possible |
| sample-rate | Optional | Integer | Length of time to merge into a single average datapoint. Default is daily |
| avg-data | optional | Boolean | Whether or not to calculate utilisation averages for this time period, instead of uptime pairs. Default is false |

#### Parameters Example

	/api_v2/analytics/data?blacklist=[21892]&start-time=86400&sample-rate=1800&avg-data=false

	{
		"black-list": [21892],
		"start-time": 86400,
		"sample-rate": 1800,
		"avg-data": false
	}

#### Responses Parameters

| Name | Type | Data Type | Description |
| :---- | :---- | :---- | :---- |
| code | Required | Integer | HTTP response code |
| errors | Optional | List\[String\] | If response is not 2xx, error messages are here |
| data | Optional | Object\[Object\]\* | Analytics data for a single frequency |

\*See below for example structure

#### Responses Example

For avg-data = false:

	{
		"code": 200,
		"data": {
			21892: {
				"strength": {
					"values": {
						0: -80.3,
						1: -85.5
					},
					"average": -82.7
				},
				"utilisation": {
					"values" : {
						[1724322716, 1724322723], //(start_time, end_time)
						[1724322725, 1724322727]
					},
					"average": 79.54
				}
			}
			192838: {
				"strength": {
					"values" : {
						0: -100.6,
						1: -90.65
					},
					"average": -95.63
				},
				"utilisation": {
					"values": {
						[1724322716, 1724322720]
					},
					"average": 100.0
				}
			}
		}
	}

For avg-data = true:

	{
		"code": 200,
		"data": {
			21892: {
				"strength": {
					"values": {
						0: -80.3,
						1: -85.5
					},
					"average": -82.7
				},
				"utilisation": {
					"zones" : {
						0: 53.333,
						1: 100.0
					"average": 79.54
				}
			}
			192838: {
				"strength": {
					"values" : {
						0: -100.6,
						1: -90.65
					},
					"average": -95.63
				},
				"utilisation": {
					"values": {
						0: 16.66,
						1: 0.0
					},
					"average": 100.0
				}
			}
		}
	}
#### When to Use

When requiring data \- either when initially requesting or when asking for periodic updates \- for a specific list or for all of the channels.
Black list is efficient if one set of data is already received for a single analytics page
While list is efficient if just one is wanted

### GET /api_v2/analytics/strength-dump

#### Parameters

| Name | Type | Data Type | Description |
| :---- | :---- | :---- | :---- |
| white-list | Optional | List\[Integer\] | If used, only get data for these channels |
| black-list | Optional | List\[Integer\] | If used, return data for all channels except these ones.Only one of white or black list should be included |
| start-time | Required | Integer | Length of time ago (in seconds) to request data for |
| end-time | Optional | Integer | Latest raw time (in seconds) that data should be requested until. If not included, assumed at late as possible |

#### Parameters Example

	/api_v2/analytics/strength-dump?blacklist=[21892]&start-time=86400

	{
		"black-list": [21892],
		"start-time": 86400
	}


#### Responses

Respond will download a file "strength-data.csv" from the browser

#### When to Use

When a user requests the data dump file for strength data \- it is to be created on the web server and passed to the web interface by this request.

### GET /api_v2/analytics/util-dump

#### Parameters

| Name | Type | Data Type | Description |
| :---- | :---- | :---- | :---- |
| white-list | Optional | List\[Integer\] | If used, only get data for these channels |
| black-list | Optional | List\[Integer\] | If used, return data for all channels except these ones.Only one of white or black list should be included |
| start-time | Required | Integer | Length of time ago (in seconds) to request data for |
| end-time | Optional | Integer | Latest raw time (in seconds) that data should be requested until. If not included, assumed at late as possible |

#### Parameters Example

	/api_v2/analytics/util-dump?blacklist=[21892]&start-time=86400

	{
		"black-list": [21892],
		"start-time": 86400
	}




#### Responses

Respond will download a file "util-data.csv" from the browser

#### When to Use

When a user requests the data dump file for utilisation data \- it is to be created on the web server and passed to the web interface by this request.

## HTTP from Front-end → WebServer Notifications

### GET api/notification

#### Parameters

| Name | Type | Data Type | Description |
| :---- | :---- | :---- | :---- |
| channel_id | Required | Integer: List\[Integer\] | A set of 3 query values per specified channel|

Each channel id contains a list of length 3.
Index 0 is the channel strength threshold (in dB)
Index 1 is the utilisation % threshold
Index 2 is the time period to calculate utilisation % with (in seconds)

#### Parameters Example

	/api_v2/notification?21892=[-100, 5, 3600]&2098=[-110, 20, 86400]

	{
		21892: [-100, 5, 3600], //Index 0 is Strength cut off for a notification.
		2098: [-110, 20, 86400] //Index 1 is % cut off for utilisation, Index 2 is time period to measure % over
	}

#### Responses Parameters

| Name | Type | Data Type | Description |
| :---- | :---- | :---- | :---- |
| strength | Required | Boolean | True if is above threshold, False if below, null if not alive |
| util | Required | Boolean | True if is above threshold, False if below |


\*See below for example structure

#### Responses Example

	{
		21892: {
			"strength": true,
			"util": false
		},
		2098: {
			"strength": true,
			"util": true
		},
	}

#### When to Use

Is designed to be queried once a minute, with information about the states of the requested notifications. The front-end should display a notification whenever the booleans change
