# はじめに

## 概要

このリポジトリは二つの読者を同時に想定しています。

- Codex: [SKILL.md](https://github.com/Sunwood-ai-labs/proxmox-skill/blob/main/SKILL.md)
- 人間の運用者: README とこの docs

helper script は小さく保ち、Python 標準ライブラリ中心で実装してあります。

## 前提

- Python 3.11 以上
- [uv](https://docs.astral.sh/uv/)
- Proxmox VE への接続権限
- ticket 発行と VM / LXC 操作ができるユーザー

## 環境ファイル

`.env.example` を `.env` としてコピーし、値を設定します。

```powershell
Copy-Item .env.example .env
```

想定キー:

- `IP`
- `USR`
- `PWD`
- 任意で `PORT`
- 任意で `VERIFY_SSL`

`USR` に realm がない場合、helper は `@pam` を補います。

## 最初に実行するコマンド

変更前に確認系コマンドを実行します。

```powershell
uv run .\scripts\proxmox_vm.py nodes
uv run .\scripts\proxmox_vm.py nextid
uv run .\scripts\proxmox_vm.py list-vms --node pve
uv run .\scripts\proxmox_vm.py list-cts --node pve
```

## 次に読むページ

- [コマンド一覧](./command-reference.md)
- [安全設計と検証](./safety-and-validation.md)
