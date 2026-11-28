---
schemaVersion: tracker-ticket/v2
blocked_by: 
  - skill-contract-manifests-03-safe-upgrades
id: skill-contract-manifests-16-web-design-metadata
parent: skill-contract-manifests
sequence: 16
title: Adopt contracts in web-design source metadata
triage: ready-for-agent
type: enhancement
work_status: "claimed"
---

## What to build

Use an authoritative record-family contract for web-design source metadata and its actual consumers.

Implement this slice under the parent initiative. Preserve its contract ownership, safety boundaries, and scope limits.

## Acceptance criteria

- [ ] Declare source-metadata production or acceptance as applicable, authoritative ownership, validation, historical reading, and supported upgrades.
- [ ] Replace the known numeric schemaVersion identifier through an explicit historical contract and declared conversion. Do not classify an unknown explicit version as unversioned.
- [ ] Exercise actual metadata validation and consumption with the current format, the supported historical format, and rejected invalid identifiers.
- [ ] Preserve source locations, asset associations, capture metadata, and checksums. Do not independently version ordinary design prose or opaque assets without a structural consumer need.

## Verification

Exercise the changed behaviour through actual owning commands, not helper tests alone. Check persisted content and rejected operations. Update affected guidance and examples with the implementation.

## Comments



- Review 2026-11-26T09:15:25.403Z: **FAILURE**. Commit `9689169146996ad84d19430cd19aa2a386c733b2`; tree `67e2145f36f92662554a7bc7c9d2a0032c5a3bb7`. [Review artifact](../../workflows/skill-contract-manifests-16-web-design-metadata/artifacts/reviews/review-review-0008.md).


- Review 2026-11-26T21:14:17.955Z: FAILURE. Source `fb4104c7ea2e27f215fab95ec69682b71b101c1b`, tree `c7ecc92e759b7720f1ffadc4d2377473ff481403`. Four low hard prose-rule findings; Spec has no findings. [Independent review](../../workflows/skill-contract-manifests-16-web-design-metadata/artifacts/reviews/review-review-0017.md).


- Review 2026-11-26T21:47:39.841Z: FAILURE. Source `d50d3bb1719c03c53f9dc911a34017ca09cddfd6`, tree `bb15b43f805dbc4946d846862e16caddd485621a`. Three low hard prose-rule findings; Spec has no findings. [Independent review](../../workflows/skill-contract-manifests-16-web-design-metadata/artifacts/reviews/review-review-0023.md).


- Review 2026-11-26T22:16:26.879Z: FAILURE. Source `dab2338e6be69e208c39c6c05164c0a1a066dbf7`, tree `85f6c82ecdf7dd5d51f6d4552ea933b7ab82a78f`. Two low hard opening-block findings; Spec has no findings. [Independent review](../../workflows/skill-contract-manifests-16-web-design-metadata/artifacts/reviews/review-review-0029.md).


- Review 2026-11-27T01:25:05.254Z: FAILURE. Source `14705f57e663196bc211fbf394a8829820dcf9fc`, tree `77df53d39098775775469a221d525467d1c3e35a`. Two low hard findings remain: table presentation and American spelling. Spec has no findings. [Independent review](../../workflows/skill-contract-manifests-16-web-design-metadata/artifacts/reviews/review-review-0035.md).


- Review 2026-11-27T21:32:23.324Z: FAILURE. Source `b039c503841014575faf26c16d3dfa61e9c63db6`, tree `29ef53bfe84e272f0ea7e965bc554f33f21f194c`. Two low hard first-use definition findings remain. Spec has no findings. [Independent review](../../workflows/skill-contract-manifests-16-web-design-metadata/artifacts/reviews/review-review-0041.md).


- Review 2026-11-28T05:35:31.689Z: FAILURE. Source `b0d12b0912d15b1c1add96caca33afa573f5144b`, tree `c163046bd7dd4e1a0874a34215b523a8c13af70a`. One primary hard first-use finding remains; both independent leaves reported no findings. [Independent review](../../workflows/skill-contract-manifests-16-web-design-metadata/artifacts/reviews/review-review-0047.md).


- Review 2026-11-28T09:36:48.987Z: FAILURE. Source `a30ab1903988834d63abd2b997659e103112a88f`, tree `c78f0057fbb2be8e003ed7fd7a381d91eba0486d`. One hard help-text first-use finding remains; Spec has no findings. [Independent review](../../workflows/skill-contract-manifests-16-web-design-metadata/artifacts/reviews/review-review-0053.md).


- Review 2026-11-28T13:43:15.732Z: SUCCESS. Source `9d00fc4548d4bd8c5a79aa7d11661ad28dfd4930`, tree `97a55fab87da13de54a7724062a36adc4626aa70`. [Immutable review](../../workflows/skill-contract-manifests-16-web-design-metadata/artifacts/reviews/review-review-0059.md).
