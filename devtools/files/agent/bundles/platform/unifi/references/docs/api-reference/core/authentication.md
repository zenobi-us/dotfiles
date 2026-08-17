# Authentication

**Category:** Core

[← Back to API Reference](../README.md)

---

**Endpoint:** `/api/auth/login`

---

#### Method: `login`

**HTTP Method:** POST

**Parameters:**
- `username` (required): Admin username
- `password` (required): Admin password

**Response:**
```json
{
  "unique_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "username": "admin",
  "first_name": "Admin",
  "last_name": "User",
  "email": "admin@example.com",
  "email_alert_enabled": false,
  "email_alert_grouping_enabled": false,
  "email_alert_grouping_delay": 60,
  "push_alert_enabled": true,
  "is_professional_installer": false,
  "html_email_enabled": true,
  "ui_settings": {}
}
```

**Notes:**
- Returns session cookie for subsequent requests
- Session cookie required for all authenticated endpoints
- Alternative: Use API key authentication with `X-API-KEY` header


#### Method: `logout`

**HTTP Method:** POST

**Endpoint:** `/api/auth/logout`

**Parameters:**
- Session cookie (required): From login response

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
- Invalidates current session
- No response body on success


---

## API Key Authentication

**Recommended Method:** Use API key instead of session-based authentication

**Creating API Key:**
1. Log into UniFi Network Application
2. Navigate to Settings → Admins
3. Select admin account
4. Scroll to API Access
5. Click Create API Key
6. Copy key (shown only once)

**Using API Key:**
- Include in `X-API-KEY` header for all requests
- No session management required
- Can be revoked independently

---

## Error Responses

**401 Unauthorized:**
```json
{
  "meta": {
    "msg": "api.err.LoginRequired",
    "rc": "error"
  }
}
```

**403 Forbidden:**
```json
{
  "meta": {
    "msg": "api.err.Forbidden",
    "rc": "error"
  }
}
```

---
