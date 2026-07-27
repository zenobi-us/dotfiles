# Security and multi-user mode

InvokeAI is a powerful local service that can read/write files, download large models, execute workflow nodes, and load arbitrary Python node packs. Network exposure changes the threat model.

## Safe default

Current default bind is loopback (`127.0.0.1`) and multi-user mode is disabled.

Do not change to `host: 0.0.0.0` as a casual connectivity fix. That exposes the port on all interfaces while single-user mode grants system-admin behavior without authentication.

## Network exposure checklist

Before exposing InvokeAI beyond loopback:

1. Enable multi-user mode and create an administrator.
2. Put the service behind HTTPS or a trusted TLS reverse proxy.
3. Restrict ingress with host firewall, VPN, private network, or proxy access policy.
4. Set only necessary CORS origins; CORS is not authentication.
5. Configure proxy subpath `base_url` and trusted `forwarded_allow_ips` correctly.
6. Protect login and API endpoints from untrusted internet exposure/rate abuse.
7. Use least-privilege normal users for automation where possible.
8. Review file permissions for root, outputs, models, nodes, DB, and credentials.
9. Back up before enabling multi-user migrations or changing ownership.
10. Test REST and Socket.IO authentication from a non-admin user.

## Multi-user behavior

Current `multiuser: true` behavior includes:
- JWT bearer authentication for most APIs
- admin vs normal-user authorization
- user ownership and visibility for workflows, images/boards, and queue items
- redacted queue details for other users
- authenticated Socket.IO connections and user/admin rooms

Discover exact requirements from local OpenAPI and `/api/v1/auth/status`.

Login tokens currently expire after inactivity windows associated with normal/remember-me login. Current middleware can send a refreshed token in `X-Refreshed-Token` on successful mutating requests. Client behavior must match the installed release.

## Credential handling

Credentials may exist in:
- JWT tokens
- `api_keys.yaml`
- external-provider environment variables
- `remote_api_tokens` URL regex entries
- Hugging Face login/token state
- reverse-proxy/service secrets

Rules:
- never commit or paste secrets into workflow JSON, logs, or reports
- do not put passwords/tokens directly in reusable shell history
- use environment files/secret stores with restricted permissions
- redact headers and config fields in diagnostics
- back up `api_keys.yaml` securely and separately
- rotate exposed tokens/keys; deleting a log line is not remediation

## Custom nodes and models

Custom nodes are arbitrary Python code. Review repository, dependencies, install scripts, network behavior, and file access before installation.

Model files can also be dangerous, especially pickle-based formats. InvokeAI scans model installs by default. Do not enable `unsafe_disable_picklescan` in production; source describes it as allowing arbitrary code execution risk.

Prefer safetensors and trusted sources, while recognizing that node-pack dependencies and remote provider code remain supply-chain risks.

## Reverse proxy subpaths

Current `base_url` supports serving below a path such as `/invoke`. It must not collide with reserved routes such as `/api`, `/ws`, `/docs`, or `/openapi.json`.

Set `forwarded_allow_ips` to the actual trusted proxy address, not `*`, unless the network design explicitly requires and protects it.

Verify:
- root UI URL
- `/openapi.json` and `/docs`
- REST redirects
- Socket.IO handshake at `<base_url>/ws/socket.io`
- generated OpenAPI server paths

## Authorization testing

Test at least:
- unauthenticated request rejected in multi-user mode
- normal user can access own resources
- normal user cannot perform admin model/config/user operations
- normal user cannot read another user's private workflow/board details
- admin sees intended global resources
- deleted/deactivated user's existing token cannot connect to Socket.IO
- token refresh/relogin path works without logging tokens

## Incident response

If an instance was exposed unauthenticated:
1. remove network exposure
2. preserve logs and configuration evidence
3. rotate external provider/Hugging Face credentials
4. inspect users, node packs, model installs, workflows, outputs, and filesystem changes
5. rebuild the code environment from trusted sources if arbitrary code execution is plausible
6. restore data only after validation

Do not assume changing the port removes exposure.

## Primary sources

Verified against InvokeAI main commit `68b90174aafebbbba45d14b049fb6852271c76a8`:

- [Multi-user admin guide](https://invoke-ai.github.io/InvokeAI/features/multi-user-mode/admin-guide/)
- [Multi-user API guide](https://invoke-ai.github.io/InvokeAI/features/multi-user-mode/api-guide/)
- [`auth.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/api/routers/auth.py)
- [`auth_dependencies.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/api/auth_dependencies.py)
- [`sockets.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/api/sockets.py)
- [`config_default.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/services/config/config_default.py)
