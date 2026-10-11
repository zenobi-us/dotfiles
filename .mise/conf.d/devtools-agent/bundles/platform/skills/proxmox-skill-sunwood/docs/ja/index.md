---
layout: home

hero:
  name: Proxmox Skill
  text: Codex 向けの安全な VM / LXC 操作
  tagline: Proxmox VE の確認、起動、VM 作成、template clone、LXC 作成をまとめた、公開向け Codex skill と軽量 CLI です。
  image:
    src: /proxmox-skill-mark.svg
    alt: Proxmox Skill logo
  actions:
    - theme: brand
      text: はじめに
      link: /ja/guide/getting-started
    - theme: alt
      text: コマンド一覧
      link: /ja/guide/command-reference
    - theme: alt
      text: GitHub
      link: https://github.com/Sunwood-ai-labs/proxmox-skill

features:
  - title: 変更前に確認
    details: nodes、nextid、list-vms、list-cts を先に実行し、安全な inspect-first フローを保ちます。
  - title: 一つの helper で両対応
    details: 同じ uv-run スクリプトから、QEMU VM と LXC container の両方を操作できます。
  - title: 公開しやすい構成
    details: 秘密情報は .env に閉じ込め、repo には .env.example だけを含める構成です。
---

## この repo の役割

`SKILL.md` だけでも Codex は動かせますが、公開リポジトリとしては README、閲覧しやすい docs、検証メモ、再利用しやすい automation 面まで揃っている方が扱いやすくなります。この repo はその一式をまとめています。

## できること

- Proxmox node と既存 guest の確認
- 既存 QEMU VM / LXC の起動
- 空の VM シェル作成
- template からの VM clone
- ローカル template からの LXC 作成

## 検証メモ

この repo の LXC フローは、実際の Proxmox VE 環境で create、start、状態確認、stop まで通しています。公開 docs では node 名や credential を伏せた形で再現可能な例に整理しています。
