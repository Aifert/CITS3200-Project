# RRMS API ‒ Web Page ↔ WebServer

>All data is HTTP Web Page→WebServer, unless otherwise specified. All requests should be authenticated
>This document only includes the data flow as an API, not the page-loading HTTP endpoints

## HTTP from Front-end → WebServer Initialisation

### GET /session-id

#### Responses Parameters

| Name | Type | Data Type | Description |
| :---- | :---- | :---- | :---- |
| code | Required | Integer | HTTP response code |
| errors | Optional | List\[String\] | If response is not 2xx, error messages are here |
| session-id | Optional | Integer | Unique integer identifying the session |

#### Responses Example

	{
	"code": 200,
	"session-id": 10437528
	}

#### When to Use

When first loading/reloading/opening (TBD implementation), get a unique session-id the server can later use to track request sources

### GET /active-channels

#### Responses Parameters

| Name | Type | Data Type | Description |
| :---- | :---- | :---- | :---- |
| code | Required | Integer | HTTP response code |
| errors | Optional | List\[String\] | If response is not 2xx, error messages are here |
| alive | Optional | List\[Object\*\] | List of all the channel name/frequency pairs available for monitoring |
| offline | Optional | List\[Object\*\] | List of all the channel name/frequency pairs with historic analytics but not currently online |

\*See below for example structure

#### Responses Example

	{
		"code": 200,
		"alive": [{
			"name": "224 Kalbarri",
			"frequency": 162.475
		}]
		"offline": [{
			"name": "225 Kalbarri",
			"frequency": 162.825
		}]
	}

#### When to Use

When first loading/reloading/opening, get a list of channels to request streaming from, and a list of channels you can get analytics from

## HTTP from Front-end → WebServer Streaming

### GET /stream/start

#### Parameters

| Name | Type | Data Type | Description |
| :---- | :---- | :---- | :---- |
| session-id | Required | String | Unique integer identifying the session |
| channel | Optional | String | Radio channel name to listen in to (preferred over frequency) |
| frequency | Optional | Float | Radio frequency to listen in to |

#### Parameters Example

	{
		"session-id": 10437528,
		"channel": "224 Kalbarri"
	}

#### Responses Parameters

| Name | Type | Data Type | Description |
| :---- | :---- | :---- | :---- |
| code | Required | Integer | HTTP response code |
| errors | Optional | List\[String\] | If response is not 2xx, error messages are here |
| endpoint | Optional | Integer | Unique integer to be used as a streaming endpoint (Or a cryptographic key) |

#### Responses Example

	{
		"code": 200,
		"endpoint": 642982454
	}

#### When to Use

When requesting to connect to a stream, the web server will generate an http endpoint to connect to and provide it here.

### GET /stream/start

#### Parameters

| Name | Type | Data Type | Description |
| :---- | :---- | :---- | :---- |
| session-id | Required | String | Unique integer identifying the session |
| channel | Optional | String | Radio channel name to listen in to (preferred over frequency) |
| frequency | Optional | Float | Radio frequency to stop listening to |
| endpoint | Optional | Integer | Web Server end point to stop listening to |

#### Parameters Example

	{
		"session-id": 10437528,
		"channel": "224 Kalbarri"
	}

#### Responses Parameters

| Name | Type | Data Type | Description |
| :---- | :---- | :---- | :---- |
| code | Required | Integer | HTTP response code |
| errors | Optional | List\[String\] | If response is not 2xx, error messages are here |

#### Responses Example

	{
		"code": 200
	}

#### When to Use

When stopping listening to a radio stream, tell the server to stop streaming data

### STREAM /stream/{endpoint}

#### When to use

This is not an HTTP request, it is a raw TCP socket for MP3 data streaming straight to the website. The endpoint should be unique and not guessable.

## HTTP from Front-end → WebServer Analytics

### GET /analytics/single

#### Parameters

| Name | Type | Data Type | Description |
| :---- | :---- | :---- | :---- |
| channel | Required | String | Radio channel to get analytics for |
| start-time | Required | Integer | Length of time ago (in seconds) to request data for |
| end-time | Optional | Integer | Latest raw time (in seconds) that data should be requested until. If not included, assumed at late as possible |

#### Parameters Example

	{
		"channel": "224 Kalbarri",
		"start-time": 86400
	}

#### Responses Parameters

| Name | Type | Data Type | Description |
| :---- | :---- | :---- | :---- |
| code | Required | Integer | HTTP response code |
| errors | Optional | List\[String\] | If response is not 2xx, error messages are here |
| data | Optional | Object\[Object\]\* | Analytics data for a single frequency |

\*See below for example structure

#### Responses Example

	{
		"code": 200,
		"data": {
				"224 Kalbarri": {
					"strength": {
						1724322719: 0.3,
						1724322724: 0.35
					},
					"utilisation": {
						(1724322716, 1724322723),
						(1724322725, 1724322727)
					}
				}
			}
	}

#### When to Use

When requiring data \- either when initially requesting or when asking for periodic updates \- for a single frequency.

### GET /analytics/bulk

#### Parameters

| Name | Type | Data Type | Description |
| :---- | :---- | :---- | :---- |
| white-list | Optional | List\[Float\] | If used, only get data for these channels |
| black-list | Optional | List\[Float\] | If used, return data for all channels except these ones.Only one of white or black list should be included |
| start-time | Required | Integer | Length of time ago (in seconds) to request data for |
| end-time | Optional | Integer | Latest raw time (in seconds) that data should be requested until. If not included, assumed at late as possible |

#### Parameters Example

	{
		"black-list": ["224 Kalbarri"],
		"start-time": 86400
	}

#### Responses Parameters

| Name | Type | Data Type | Description |
| :---- | :---- | :---- | :---- |
| code | Required | Integer | HTTP response code |
| errors | Optional | List\[String\] | If response is not 2xx, error messages are here |
| data | Optional | Object\[Object\]\* | Analytics data for a single frequency |

\*See below for example structure

#### Responses Example

	{
		"code": 200,
		"data": {
			"224 Kalbarri": {
				"strength": {
					1724322719: 0.3,
					1724322724: 0.35
				},
				"utilisation": {
					(1724322716, 1724322723),
					(1724322725, 1724322727)
				}
			}
			"224 Kalbarri": {
				"strength": {
					1724322720: 0.6,
					1724322725: 0.65
				},
				"utilisation": {
					(1724322716, 1724322720)
				}
			}
		}
	}

#### When to Use

When requiring data \- either when initially requesting or when asking for periodic updates \- for a specific list or for all of the channels.
Black list is efficient if one set of data is already received for a single analytics page

### GET /analytics/data-dump

#### Responses Parameters

| Name | Type | Data Type | Description |
| :---- | :---- | :---- | :---- |
| code | Required | Integer | HTTP response code |
| errors | Optional | List\[String\] | If response is not 2xx, error messages are here |
| file | Optional | File | Analytics data for a single frequency |

\*See below for example structure

#### Responses Example

	{
		"code": 200,
		"file: ___
	}

#### When to Use

When a user requests the data dump file \- it is to be created on the web server and passed to the web interface by this request.
