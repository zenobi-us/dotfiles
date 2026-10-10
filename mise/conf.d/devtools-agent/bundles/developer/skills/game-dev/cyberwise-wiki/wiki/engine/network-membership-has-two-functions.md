---
type: Engine Mechanic
title: An access point answers "who is on this network" with two different functions, and only one of them is the device graph you wrapped
description: GetImmediateSlaves and GetPuppets read the same network by different routes - one through the DeviceSystem children, one through GetAllDescendants - so a mod that wraps the first is invisible to every NPC-facing path in the base game. And vanilla's own failed-breach response turns out to be a distraction stim, not an alarm.
tags: [redscript, devices, access-point, netrunning, breach, npc, quickhacks, wrapmethod]
status: draft
generated: { by: "claude", at: "2026-08-28T23:05:00-04:00" }
---

# An access point answers "who is on this network" with two different functions

A mod that gates quickhacks behind breaching an access point has to be able to
say what "this network" contains. The base game exposes that in two places, and
they are **not** layered the way the names suggest.

| function | declared | route |
|---|---|---|
| `GetImmediateSlaves()` | `masterController.script:145` | `DeviceSystem.GetChildren(entityID)` |
| `GetPuppets()` | `masterController.script:128` | `GetAllDescendants()` → `DeviceSystem.GetAllDescendants(entityID)`, filtered to `PuppetDeviceLinkPS` |

`GetPuppets()` does not call `GetImmediateSlaves()`. It goes to the DeviceSystem
independently. So **wrapping `GetImmediateSlaves()` to add a device to a network
has no effect on anything that asks about people.**

That matters because the NPC-facing paths all use the second one:

- `SendMinigameFailedToAllNPCs()` — `accessPointController.script:1151` — walks
  `GetPuppets()` and queues a `MinigameFailEvent` at each link. This is the
  entire vanilla response to a failed breach.
- `PingSquad()` — `accessPointController.script:1357` — walks `GetPuppets()`.

## What it looks like when you get it wrong

A mod adopted stranded devices onto a nearby access point by wrapping
`GetImmediateSlaves()`. Devices worked: breaching the access point opened them,
through vanilla's own `RefreshSlaves` propagation. People did nothing at all —
and the visible symptom was **"failing a breach does nothing"**, which reads as a
weak or missing alarm and sends you looking at stim types, attitude agents and
targeting queries.

It was none of those. `GetPuppets()` returned an empty array, so vanilla's
failure broadcast was correctly built, correctly sent, and addressed to nobody.
Three releases went into escalating the alarm's *content* while its *recipient
list* was empty.

**The fix is one wrap**, and it restores more than the thing you were chasing:

```swift
@wrapMethod(MasterControllerPS)
public final const func GetPuppets() -> array<ref<PuppetDeviceLinkPS>> {
  let puppets: array<ref<PuppetDeviceLinkPS>> = wrappedMethod();
  // append your adopted PuppetDeviceLinkPS, deduped
  return puppets;
}
```

Mend the graph rather than hand-rolling a roster inside the one function you
noticed was broken, and every vanilla behaviour keyed on network membership
comes back at once.

## An NPC's seat on the network is its PuppetDeviceLinkPS

`ScriptedPuppetPS.GetDeviceLink()` returns a `PuppetDeviceLinkPS`
(`scriptedPuppetPS.script:474`), and that link — not the puppet, not the puppet's
PS — is what the network functions address. `PuppetDeviceLinkPS extends
DeviceLinkComponentPS extends SharedGameplayPS`, so it is a device-graph object
that happens to describe a person.

`ScriptedPuppetPS.IsConnectedToAccessPoint()` (`scriptedPuppetPS.script:240`) is
just `GetDeviceLink().HasNetworkBackdoor()`, which is
`GetParentDevice().HasNetworkBackdoor()`. An NPC is "networked" exactly when the
device it hangs off has a backdoor — which is why granting backdoors to device
classes changes who is protected.

## Vanilla's failed-breach response is a nudge, not an alarm

Worth knowing before you build on top of it, because it is much weaker than its
name suggests. `ScriptedPuppet.OnMinigameFailEvent`
(`scriptedPuppet.script:5769`) is two lines:

```
StimBroadcasterComponent.SendStimDirectly( GetPlayer( GetGame() ), gamedataStimType.ProjectileDistraction, this );
NPCStatesComponent.AlertPuppet( this );
```

A **`ProjectileDistraction`** stim and an alert state. That is "something
happened over there, go and look". It carries no hostility, does not enter
combat, and never points the NPC at the player. So on a *fully wired vanilla
network*, blowing a breach produces a shrug — any mod claiming the base game
makes "the room hear you" is overstating it.

To get an actual response you have to escalate on top: set the attitude agent
hostile toward the player's, then `TriggerSecuritySystemNotification(..., COMBAT)`
and a `gamedataStimType.Combat` broadcast. Send the `MinigameFailEvent` as well,
because it is the message other mods hook — just do not expect it to do the work.

## Which NPCs the game considers ambient

For any rule that should apply to posted guards but not to street population,
these are the game's own predicates rather than an inference from behaviour:

| predicate | declared | means |
|---|---|---|
| `ScriptedPuppet.IsCrowd()` | `scriptedPuppet.script:1815` | character record's crowd flag **or** `CrowdMemberComponent.IsInCrowd()` — the population system: pedestrians, ambient street life |
| `ScriptedPuppet.IsCivilian()` | `scriptedPuppet.script:1728` | reaction preset group is `Civilian` (the others are `Police`, `Ganger`) |
| `GetMountedVehicle(obj)` | `vehicles.script:1727` | global; non-null for drivers and passengers |

There is **no "is a guard" flag**. The workable test is a list of exclusions, so
it fails toward treating somebody as posted who was not — which is the cheaper
direction to be wrong in.

`m_isCrowd` is assigned inside `ScriptedPuppet.OnGameAttached`
(`scriptedPuppet.script:645`). A `@wrapMethod` that tests `IsCrowd()` **before**
calling `wrappedMethod()` reads an unset field and every pedestrian in Night City
passes.

## See also

- `engine/compiled-script-bundle.md` — a symbol in the bundle is not a feature in
  the game
- `process/the-deployment-manifest-says-who-ships-what.md`

Signatures above are from the game's own shipped script source at
`<game>\tools\redmod\scripts\`, patch 2.31. Read it rather than the compiled
bundle when you need a signature — it is the authored source, with names intact.
