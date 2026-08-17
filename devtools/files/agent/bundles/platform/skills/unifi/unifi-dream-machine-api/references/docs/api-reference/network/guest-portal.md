# Guest Portal

**Category:** Network

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/rest/hotspotop`

---

#### Method: `list_operators`

**HTTP Method:** GET

**Endpoint:** `/rest/hotspotop`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f5ce05644140db67310b0",
      "name": "Operator1",
      "site_id": "691f5ca15644140db673108c",
      "note": "Front desk operator"
    }
  ]
}
```

**Notes:**
- Returns hotspot operator accounts
- Operators can create guest vouchers


#### Method: `list_vouchers`

**HTTP Method:** GET

**Endpoint:** `/stat/voucher`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f5ce05644140db67310b1",
      "code": "12345-67890",
      "quota": 1,
      "duration": 480,
      "used": 0,
      "create_time": 1732291234
    }
  ]
}
```

**Notes:**
- Returns guest portal vouchers


#### Method: `list_payments`

**HTTP Method:** GET

**Endpoint:** `/stat/payment`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": []
}
```

**Notes:**
- Returns guest portal payment records


#### Method: `create_operator`

**HTTP Method:** POST

**Endpoint:** `/rest/hotspotop`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with operator configuration

**Required Fields:**
- `name` (string): Operator name
- `x_password` (string): Operator password

**Optional Fields:**
See Response Fields table above for all available configuration fields.

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f5ce05644140db67310b0",
      "name": "Operator1",
      "site_id": "691f5ca15644140db673108c",
      "note": "Front desk operator"
    }
  ]
}
```

**Notes:**
- Creates new hotspot operator account


#### Method: `update_operator`

**HTTP Method:** PUT

**Endpoint:** `/rest/hotspotop/{operator_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `operator_id` (path, required): Operator ID to update
- Request body: JSON object with fields to update (see Response Fields table above for available fields)

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f5ce05644140db67310b0",
      "name": "Operator1",
      "site_id": "691f5ca15644140db673108c",
      "note": "Front desk operator"
    }
  ]
}
```

**Notes:**
- Must include `_id` field in request body


#### Method: `delete_operator`

**HTTP Method:** DELETE

**Endpoint:** `/rest/hotspotop/{operator_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `operator_id` (path, required): Operator ID to delete

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": []
}
```

---

