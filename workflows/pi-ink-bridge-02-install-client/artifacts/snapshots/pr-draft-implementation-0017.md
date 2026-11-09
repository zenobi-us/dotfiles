---
title: Persistent host bootstrap
type: Report
---

# Persistent host bootstrap

Host bootstrap passed. Whole ticket remains blocked on separately approved device installation, activation, and repeat-install acceptance. Source and tracker are unchanged.

## Problem

The existing protocol-1 listener occupies port 47840. This operation must preserve it and prepare real persistent production trust before installation approval.

## Implementation

The production `scripts/provision-tablet.sh` bootstrap started Pitchfork `global/pi-ink-bridge` on HTTP 58840 and HTTPS 58841. The registered `/annotate add-device` handler then reused it through a controlled agent-host API boundary. Both caller processes exited. Later health and exact trust bytes remained unchanged.

State: `/home/zenobius/.local/share/pi-ink-bridge` (0700). Identity, certificate, key and runtime file are 0600. No identity existed there before bootstrap. Bun 1.4.3 process 1182586 runs under Pitchfork 2.30.1 supervisor 1182041. Supervisor parent is PID 4536. No temporary lifecycle or one-off identity was introduced. Keep the service running.

Runtime build: `fc66b96a4895ba5253c862d9883ecc392fb7a9ad299d1edf534c94e89873a6f5`.

Use `MISE_AUTO_INSTALL=0 PI_INK_SETUP_PORT=58840 PI_INK_TLS_PORT=58841` for later add-device callers. No shell profile or unrelated configuration was changed. The existing 47840 listener remained OMP PID 20453, fd 41. This operation sent it no traffic and made no service changes.

## Public trust

| Value | Actual value |
| --- | --- |
| Server ID | `256377c7f22604161e086b332a63e19b` |
| HTTPS origin | `https://192.168.86.35:58841` |
| LAN setup URL | `http://192.168.86.35:58840/setup` |
| Certificate SHA256 | `03fee0acc6c98861805f154244d33dbad2bdbea7087f7d61135a9e47e6a4a3d1` |
| Exact trust-record SHA256 | `bcd72b4841d47400e61b8fde5116863dac43f8c4e28730155b4f8304c0a8c86e` |
| Installer SHA256 | `765593a9a36fdbf097d67bb3a41d613038150268636616447b9244b87c17578f` |
| ZIP SHA256 | `03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629` |
| Packaged sidebar SHA256 | `33580da2dfe58623ff5b31d6c3a679dd4f678ab8a65d057c497f24078b2447be` |

Certificate SANs: 127.0.0.1, 192.168.86.35, 10.147.17.161, 10.11.99.10 and DNS brass. Certificate expires Nov  5 01:31:17 2036 GMT. The origin IP matches its SAN. Loopback management supplied the certificate and exact record. Python verified TLS with this certificate as the trust anchor and normal IP validation. HTTPS and loopback health matched protocol 2, ID, fingerprint and runtime build.

The public record contains only serverId, name, origin, certificate and fingerprint. It contains no key or credential. Exact bytes and public certificate are retained in evidence. No private keys, tokens or unrelated configuration are included.

## Commands and checks

```sh
# Extension directory; host-only. Both commands completed.
MISE_AUTO_INSTALL=0 PI_INK_SETUP_PORT=58840 PI_INK_TLS_PORT=58841 sh scripts/provision-tablet.sh
MISE_AUTO_INSTALL=0 mise exec pitchfork@2.30.1 -- pitchfork status pi-ink-bridge
ss -ltnp '( sport = :47840 or sport = :58840 or sport = :58841 )'
ps -o pid,ppid,lstart,args -p 1182586,20453
ps -o pid,ppid,lstart,args -p 1182041
```

The registered handler was invoked from the real `index.ts`, with only command registration and agent UI notification controlled. It emitted one info notification with the same real trust values. No SSH command was executed.

Python urllib fetched `/health`, `/instructions`, `/tablet/server.json`, `/tablet/install.sh` and `/tablet/client.zip` only from loopback 58840. It verified the exact trust-record digest in the generated command, installer and ZIP SHA256, and packaged sidebar bytes. It used `ssl.create_default_context(cadata=record.certificate)` to request the actual HTTPS origin `/health`. No insecure bypass was used. Identity and exact record checks passed again after both callers exited.

No passed host suite, device preflight, firmware capture, parser build or native resource check was repeated. Desktop-local checks do not prove tablet LAN or firewall reachability.

## Changed files

Only workflow evidence, this immutable snapshot, implementation result, manifest and projections changed. Include the authorized parent start-0016 receipt/projections in the same workflow commit. Source commit remains `125a2d8af313f00baa289a5fb10fc34a0df77023`; tree `e7233a633267c8cc386827fde44ae3d8383ba219` before the workflow commit.

## Next approval request

Approve ONE hash-pinned cable installation using the real trust and payload values above. First perform a fresh read-only preflight with strict existing SSH host-key verification. Check Ferrari/aarch64 and IMG_VERSION 3.28.0.172, all exact stock/native hashes, absent production targets, root ownership, permissions and no-symlink boundaries. Compare the captured QMD manifest. Abort on drift; no automatic repair or retry.

Allowed persistent production writes:

- **Target:** `/home/root/.local/share/pi-ink-bridge`.
- **Target:** `/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629`.
- **Target:** `/home/root/xovi/exthome/appload/pi-annotations`.
- **Target:** `/home/root/xovi/exthome/qt-resource-rebuilder/pi-annotations.qmd`.

The installer can use its own temporary extraction/staging directories and remove only that transient staging. It creates immutable release files and initial config.json/server-ca.pem in the production base. It publishes only the two named AppLoad/sidebar symlinks. Preserve retained QMDs, prototype files/services, pairing/drafts/notebooks and unrelated data. Do not change firmware, Developer Mode, firewall, cloud or account settings.

No restart or reboot is included. After installation, request separate owner saved/closed confirmation and approval for one Xochitl restart and native launch observation. Repeat-install acceptance needs separate approval. Real Qt runtime/type/layout and post-restart native launch remain untested.

## Review and merge

No independent review occurred. Latest reviewer verdict: none. Resolved review findings: none. Remaining acceptance: installation, activation/native launch and repeat-install. Not merged or pushed. Ticket remains claimed; no triage/completion change.

## Evidence and history

- **Implementation result:** [implementation-0017](../../events/implementation-0017.json).
- **Bootstrap evidence:** [Verification](../evidence/host-bootstrap-0016/bootstrap-verification.json).
- **Exact public record:** [server.json](../evidence/host-bootstrap-0016/server.json).
- **Public certificate:** [certificate.pem](../evidence/host-bootstrap-0016/certificate.pem).
- **Installation proposal:** [Exact request and unexecuted generated command](../evidence/host-bootstrap-0016/installation-approval-request.json).
- **Previous payload proposal:** [Approved payload identity and future write set](../evidence/sidebar-resources-0013/installation-proposal.json).

- **implementation-0002:** [implementation-0002.json](../../events/implementation-0002.json).
- **implementation-0005:** [implementation-0005.json](../../events/implementation-0005.json).
- **implementation-0008:** [implementation-0008.json](../../events/implementation-0008.json).
- **implementation-0011:** [implementation-0011.json](../../events/implementation-0011.json).
- **implementation-0014:** [implementation-0014.json](../../events/implementation-0014.json).
- **start-0001:** [start-0001.json](../../events/start-0001.json).
- **start-0004:** [start-0004.json](../../events/start-0004.json).
- **start-0007:** [start-0007.json](../../events/start-0007.json).
- **start-0010:** [start-0010.json](../../events/start-0010.json).
- **start-0013:** [start-0013.json](../../events/start-0013.json).
- **start-0016:** [start-0016.json](../../events/start-0016.json).
- **start-complete-0003:** [start-complete-0003.json](../../events/start-complete-0003.json).
- **start-complete-0006:** [start-complete-0006.json](../../events/start-complete-0006.json).
- **start-complete-0009:** [start-complete-0009.json](../../events/start-complete-0009.json).
- **start-complete-0012:** [start-complete-0012.json](../../events/start-complete-0012.json).
- **start-complete-0015:** [start-complete-0015.json](../../events/start-complete-0015.json).
- **implementation-0017:** [Result](../../events/implementation-0017.json).

