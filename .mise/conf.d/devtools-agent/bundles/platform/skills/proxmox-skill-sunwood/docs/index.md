---
layout: home

hero:
  name: Proxmox Skill
  text: Safe VM and LXC operations for Codex
  tagline: A public Codex skill plus a zero-dependency helper CLI for Proxmox VE inspection, guest start, VM creation, template clone, and LXC provisioning.
  image:
    src: /proxmox-skill-mark.svg
    alt: Proxmox Skill logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Command Reference
      link: /guide/command-reference
    - theme: alt
      text: GitHub
      link: https://github.com/Sunwood-ai-labs/proxmox-skill

features:
  - title: Inspect before mutate
    details: Start with nodes, nextid, list-vms, and list-cts so the workflow stays explicit and safe.
  - title: One helper, two guest types
    details: Drive both QEMU VM and LXC container tasks from the same uv-run script and the same local .env file.
  - title: Public-safe structure
    details: Keep secrets local with .env, publish only .env.example, and share a reusable public-facing skill repository.
---

## Why this repo exists

`SKILL.md` is useful for Codex, but a polished public repository also needs a readable README, browsable docs, validation notes, and a predictable automation surface. This project packages all of those together.

## What you can do

- inspect Proxmox nodes and existing guests
- start an existing QEMU VM or LXC container
- create a blank VM shell
- clone a VM or template into a new VM ID
- create a new LXC container from a local Proxmox template

## Validation note

The LXC workflow in this repository was exercised against a live Proxmox VE environment for create, start, status confirmation, and stop. The public docs intentionally keep node names and credentials out of the published examples.
