# Session Management Reference

## Campaign Persistence

### Save Path

```
${TTRPG_CAMPAIGNS:-${XDG_DATA_HOME:-$HOME/.local/share}/ttrpg-campaigns}/[campaign-name].md
```

Before first save, ensure the directory exists:
```bash
mkdir -p ${TTRPG_CAMPAIGNS:-${XDG_DATA_HOME:-$HOME/.local/share}/ttrpg-campaigns}
```

### Campaign File Format

```markdown
# [Campaign Name] - Session Summary

**Character:** [Name]
**Location:** [Current place]
**Session:** [X]
**Universe:** [Name or "Custom"]
**Adult Mode:** [enabled/disabled]

## Current Situation
[Brief recap of what just happened]

<!-- INTERNAL_STATE
GAUGES:
  stress: [0-100]
  fragmentation: [0-100]
  morality: [-100 to +100]
  desire: [0-100 or N/A]

SETTINGS:
  adult_mode: [true/false]
  last_saved: [ISO timestamp]
-->

## Player Character
<!-- PC_START -->
**Name:** [Name]
**Origin:** [Background]
**Appearance:** [Visual identity]
**Motivation:** [Drive]
**Moral Line:** [Won't cross]
**Hidden Weakness:** [Vulnerability]
<!-- PC_END -->

## World State
<!-- FACTION_START -->
- **[Faction]** | Power: [X]/10 | Attitude: [Hostile/Neutral/Friendly] | Territory: [Area]
<!-- FACTION_END -->

## Companions
<!-- COMPANION_START -->
- **[Name]** | Trust: [X]/10 | Status: [Alive/Injured/Missing] | Location: [With player/Elsewhere]
  - Last interaction: [Note]
  - Hidden agenda: [What player doesn't know]
<!-- COMPANION_END -->

## NPC-NPC Relationships
<!-- NPC_NPC_START -->
- **[NPC A]** ↔ **[NPC B]**: [Type] - [Note]
<!-- NPC_NPC_END -->

## Locations Discovered
<!-- LOCATION_START -->
- **[Location]** | Status: [Safe/Dangerous/Unknown] | Owner: [Faction/NPC]
  - NPCs present: [Who]
  - Secrets: [Undiscovered]
<!-- LOCATION_END -->

## Active Objectives
<!-- QUEST_START -->
- **[Objective]** | Type: [Main/Side/Personal] | Status: [Active/Complete/Failed]
  - Goal: [What]
  - Stakes: [What's at risk]
  - Progress: [Current state]
<!-- QUEST_END -->

## Inventory & Resources
<!-- INVENTORY_START -->
**Currency:** [Amount]
**Key Items:** [List with significance]
**Weapons/Gear:** [Equipment and condition]
<!-- INVENTORY_END -->

## Key Decisions & Consequences
<!-- CONSEQUENCE_START -->
1. **[Decision]**
   - World: [Effect]
   - Relationships: [Effect]
   - Delayed: [What comes next]
<!-- CONSEQUENCE_END -->

## Pending Consequences
<!-- DELAYED_START -->
- **Session [X]:** [Trigger] → [Effect]
<!-- DELAYED_END -->

## Safety Settings
**Lines:** [Topics never included]
**Veils:** [Topics off-screen only]

## Next Session Hooks
- [Unresolved threat]
- [Opportunity]
- [Character thread]
- [Approaching consequence]
```

---

## Session End Protocol

### Explicit Triggers
- "Let's stop here" / "save game" / "end session"
- "I need to go" / "until next time" / "save and quit"

### Implicit Triggers (Natural Pause Points)
- After a major story beat (chapter end, boss defeat, betrayal reveal)
- After a significant choice with pending consequences
- Safe location reached, night falls, natural break

### On Session End
1. Generate Consequence Report for any unresolved choices
2. Write campaign state to file using the format above
3. Provide a brief "next time" hook — tease what's coming
4. Confirm: "Campaign saved. See you next time, [character name]."

### If Save Fails
Inform the player, then output the full state to chat as a backup they can paste later.

---

## Campaign Resume Protocol

### The "Previously On..." Summary

When resuming, present:

```markdown
## CAMPAIGN SUMMARY: [Campaign Name]
**Session [X]** | **[Universe]**

### Your Character
**[Name]** — [Brief identity reminder]
Current state: [Physical/mental from gauges]

### Previously...
[2-3 paragraph cinematic recap. Write like a TV recap — dramatic, engaging.
Remind of emotional stakes, not just facts. Highlight consequences of choices.
Tease pending threats.]

### Your Companions
| Name | Status | Relationship |
|------|--------|-------------|
| [NPC 1] | [Status] | [Trust + recent dynamic] |

### World State
- **[Faction A]:** [Status and attitude]
- **[Faction B]:** [Status and attitude]

### Unresolved Threads
- [Active threat or mystery]
- [Pending consequence about to trigger]

### Where We Left Off
[Specific scene/location/moment]

Ready to continue?
```

### Summary Tone
- Write the recap like a prestige TV "previously on" — dramatic, taut
- Remind the player of emotional stakes, not just plot points
- Highlight how their choices shaped the current situation
- Tease approaching consequences
- Make them want to play

### Player Options After Summary
- "Ready to continue" → resume from last scene
- "Remind me about [thing]" → provide detail
- "What were my options?" → recap pending choices
- "Let's start fresh" → offer new campaign

---

## Error Recovery

### Continuity Error
```
[META PAUSE] I noticed an inconsistency: [describe conflict].
Which version is canon?
A) [First version]
B) [Second version]
C) Let's retcon — what actually happened?
```

### NPC Behavior Inconsistency
```
[META PAUSE] [NPC] acted out of character there.
A) Retcon — they actually did [consistent action]
B) In-story explanation — they were [lying/manipulated/desperate]
C) Character development — this IS who they're becoming
```

### Lost Track of State
```
[META PAUSE] Let me confirm the current situation:
- Location: [X]
- Present: [NPCs]
- Recent events: [Y]
Correct?
```

### Campaign File Corruption
```
[META PAUSE] The campaign file appears corrupted. Let me try to recover:
1. I'll extract what I can from the valid sections.
2. For anything missing, I'll ask you to fill in what you remember.
3. I'll note what was lost so we can reconstruct as we play.

Here's what I recovered: [valid data]
What do you remember about: [missing sections]?
```

Attempt to parse valid markdown sections first. Reconstruct from player memory for anything lost. Resume with rebuilt state and note any gaps to fill naturally during play.

### Dice Dispute
```
[META PAUSE] Roll breakdown:
Base: [X] + Modifier: [Y] + Situational: [Z] = Total: [Result]
Does this look right?
```
