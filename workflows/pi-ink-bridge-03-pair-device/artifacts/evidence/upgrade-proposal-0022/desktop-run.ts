import { deploy } from "./desktop-deploy";
const spec = {
  "id": "global/pi-ink-bridge",
  "directory": "/home/zenobius/.local/share/pi-ink-bridge",
  "owner": 1000,
  "bun": "/home/zenobius/.local/share/mise/installs/bun/1.4.3/bin/bun",
  "pitchfork": "/home/zenobius/.local/share/mise/installs/pitchfork/2.30.1/.mise-bins/pitchfork",
  "oldPID": 2532009,
  "oldStart": "18037566",
  "oldService": "/home/zenobius/.local/share/pi-ink-bridge/runtimes/c5df23c290a5c31886c86d4e1af9a226e7d147007fd5843972919ecaa6d1e356/service.js",
  "oldBuild": "c5df23c290a5c31886c86d4e1af9a226e7d147007fd5843972919ecaa6d1e356",
  "serverID": "256377c7f22604161e086b332a63e19b",
  "fingerprint": "03fee0acc6c98861805f154244d33dbad2bdbea7087f7d61135a9e47e6a4a3d1",
  "httpPort": 58840,
  "tlsPort": 58841,
  "lanAddress": "192.168.86.35",
  "build": "2fa9ad053469efb6f844dc89087e85d7bf1393527ffb3bbd9cb502a98c880e12",
  "staging": "/home/zenobius/.local/share/pi-ink-bridge/runtimes/.stage-pairing-0022",
  "backup": "/home/zenobius/.local/share/pi-ink-bridge/.backup-pairing-0022",
  "privateFiles": {
    "coordinator-id": {
      "exists": true,
      "uid": 1000,
      "gid": 1000,
      "mode": "600",
      "size": 33,
      "device": 35,
      "inode": 39511964,
      "sha256": "e6f86d8b6d8a1ff45ec30c1d6552cff5e3882ef9b11a38fe4f46e3e0e8c89045"
    },
    "certificate.pem": {
      "exists": true,
      "uid": 1000,
      "gid": 1000,
      "mode": "600",
      "size": 717,
      "device": 35,
      "inode": 39511966,
      "sha256": "8e5b94fe2995e86baf3ee80a788caeb740efee2983942e4499b026ebaec1f7d9"
    },
    "key.pem": {
      "exists": true,
      "uid": 1000,
      "gid": 1000,
      "mode": "600",
      "size": 241,
      "device": 35,
      "inode": 39511965,
      "sha256": "4d428d3629dcc1680847c0a2e8605a05444c63807c2822da27bc5b537d804c31"
    },
    "devices.json": {
      "exists": false
    }
  },
  "oldFiles": {
    "service.js": {
      "uid": 1000,
      "gid": 1000,
      "mode": "600",
      "size": 12721,
      "device": 35,
      "inode": 39654481,
      "sha256": "215341b1d83029d7e00118dc3d615c0704d766f4ca7fc713eab52296627c187f"
    },
    "build-id": {
      "uid": 1000,
      "gid": 1000,
      "mode": "600",
      "size": 64,
      "device": 35,
      "inode": 39654482,
      "sha256": "2404d10ce1d759195bb5acd35e623cbf1d8c496b84e9a17858fd8c4bf80835cf"
    },
    "tablet-client/dist/client.zip": {
      "uid": 1000,
      "gid": 1000,
      "mode": "600",
      "size": 2971444,
      "device": 35,
      "inode": 39654483,
      "sha256": "ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33"
    },
    "tablet-client/production-install.sh": {
      "uid": 1000,
      "gid": 1000,
      "mode": "600",
      "size": 3013,
      "device": 35,
      "inode": 39654484,
      "sha256": "765593a9a36fdbf097d67bb3a41d613038150268636616447b9244b87c17578f"
    }
  },
  "payload": {
    "service.js": {
      "source": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/pi-ink-bridge-03-pair-device/artifacts/evidence/upgrade-proposal-0022/service.js",
      "size": 28017,
      "sha256": "ade22fd9cf706e30bacfce15315a2df82af193a166b5f81e16278333c03d2767"
    },
    "build-id": {
      "text": "2fa9ad053469efb6f844dc89087e85d7bf1393527ffb3bbd9cb502a98c880e12",
      "size": 64,
      "sha256": "7e4290fb7a700c79d8cb2ead492d3faa81377bc335b3a3bfb0437c7694c0f4e8"
    },
    "tablet-client/dist/client.zip": {
      "source": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/pi-ink-bridge-03-pair-device/artifacts/evidence/upgrade-proposal-0022/client.zip",
      "size": 3006550,
      "sha256": "8468df658f658820bbf6f31e6b8c0d683a67109a5998a86467c959ca803d8962"
    },
    "tablet-client/production-install.sh": {
      "source": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/pi-ink-bridge-03-pair-device/artifacts/evidence/upgrade-proposal-0022/production-install.sh",
      "size": 3370,
      "sha256": "b5baa9d881b6693496cb622c29c96e0408c878b27a5197c04ac8882956686eae"
    }
  }
};
console.log(JSON.stringify(await deploy(spec)));
