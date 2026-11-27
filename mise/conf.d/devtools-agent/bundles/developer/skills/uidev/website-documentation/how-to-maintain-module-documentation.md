---
title: Maintain module documentation
---

# Maintain module documentation

Use the `website-documentation` skill when you add or change a mise module, capability overview, or task guide.

1. Name the affected module and capability. Ask the agent to use `website-documentation`. For example: “Use website-documentation to document the Mise shell integration in shells-zsh. Preserve existing source locations.”
2. Review the proposed capability boundary. Group related implementation files into one capability. Keep existing bundle and skill pages as links.
3. Review the module README, capability README, and HOWTO. Check the opening visual, source links, prerequisites, steps, verification, and recovery.
4. For a layout change, review the locally served UX preview before authorizing production changes.
5. Review the rendered pages on wide and narrow screens. Follow module → capability → how-to and return to the parent. Confirm missing visuals leave readable content.

The skill follows the website's current design-system entry point and live page-kind catalogue. It does not create a second `design.md` policy.

