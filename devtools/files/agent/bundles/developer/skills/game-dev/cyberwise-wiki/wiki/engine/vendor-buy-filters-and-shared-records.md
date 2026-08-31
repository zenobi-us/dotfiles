---
type: Engine Mechanic
title: What a vendor will buy is decided by tag filters, and one record can be every vendor of a kind
description: A vendor record carries four tag arrays - two governing what it sells, two governing what it will buy from the player - and vendor ids split into per-shop and shared, so an identical edit can silence a whole category of shops or nothing at all.
tags: [vendors, tweakdb, tweakxl, tags, records, economy]
status: stable
generated: { by: "claude", at: "2026-08-24T19:38:47-04:00" }
---

# What a vendor will buy is decided by tag filters, and one record can be every vendor of a kind

Two separate facts, and the second is the one that produces surprises.

## Four arrays, and the pairs do different jobs

A `gamedataVendor_Record` carries four tag arrays. This is a complete one, quoted
from a mod's own template record:

```yaml
Vendors.vendorxl_custom:
  $type: gamedataVendor_Record
  vendorType: VendorType.Junk
  customerFilterTags:
    - Quest
    - UnequipBlocked
    - Currency
    - Cyberware
    - Underwear
    - base_fists
    - BaseWeapon
    - TppHead
    - StandardAmmo
    - HideAtVendor
    - ChargedConsumable
    - CraftingPart
    - Recipe
    - skillbook
  customerInverseFilterTags: []
  vendorFilterTags:
    - Prop
    - Currency
    - CraftingPart
    - HideAtVendor
  vendorInverseFilterTags: []
```

The `vendor*` pair governs what the vendor **offers**; the `customer*` pair
governs what it will **buy from the player**. That is the field most people are
looking for and it is not obvious from the names - "customer" is V, not the
shopkeeper.

Within each pair, `*FilterTags` is a **refuse** list. Every vanilla-shaped
record shipped with the same customer list above: quest items, currency,
cyberware, base fists and the third-person head are things no shop buys.

`*InverseFilterTags` is the opposite test - a **require** list, empty on every
vanilla-derived record examined. The clean demonstration is the idiom a
vendor-filter mod documents for shutting a shop's buy counter entirely:

```yaml
# Apply this to any vendor that will not buy anything from player:
#
# customerInverseFilterTags: [ ThisVendorDoesNotBuyAnything ]
```

`ThisVendorDoesNotBuyAnything` is a tag **carried by no item in the game**. If
the inverse list were another refuse list, adding a tag nothing has would do
nothing at all; the technique works because the array means *accept only these*,
and nothing matches. The require-list reading is inferred from that plus the
uniformly empty vanilla arrays - it was not confirmed against engine code.

## Vendor ids are per-shop or shared, and nothing marks which

Vendor ids come in two shapes, visible in the ids themselves:

| id | scope |
|---|---|
| `wat_kab_clothingshop_01` | one shop, one district code, one instance |
| `wat_lch_netrunner_01` | likewise - `Nix` behind the Afterlife bar |
| `Clothes` | **every street clothing vendor in the city** |
| `Market`, `Tech_Junk` | likewise, whole classes of stall |

**One edit to a shared record changes every shop backed by it**, which is how a
single line silences an entire category of vendor at once. The reverse case is
the one that wastes an evening: an apparently identical edit to a neighbouring
record does nothing, because **no vendor in the world is backed by that record**.
Both exist in the same list - one catalogue of vendor ids annotates
`Clothes_EP1` as "seemingly unused", sitting one line below `Clothes`, which is
used everywhere.

`vendorType` is a separate axis again: it is an enum on the record, so several
distinct vendor records share a type, and changing the type does not change what
the record buys.

## The rule this generalises to

**Before believing a setting is inert or catastrophic, count what is actually
behind it.** "It did nothing" and "it broke everything" are the same edit applied
to records with zero and forty referents, and the record itself looks identical
in both cases. Resolve the id to the set of world instances that use it before
concluding anything about the edit.

## What was not verified

The read above comes from vendor records on disk and the documented idiom of a
mod built for this, on patch 2.31. The per-shop / shared split is inferred from
id naming and from a third-party catalogue's annotations; no exhaustive mapping
of world vendor instances to records was performed, and "unused" records were not
independently confirmed to be unused.

## Related

- [Vendor stock and item pricing are both arrays of records, not values](/authoring/vendor-stock-and-pricing) - the selling half, and why stock edits do not show up until a restock
- [Never guess a TweakDB record ID - the game writes the real list](/authoring/finding-the-real-record-id)
- [A TweakXL record is resolved last-wins, and that is the lever for everything else](/authoring/tweakxl-records-are-last-wins)
