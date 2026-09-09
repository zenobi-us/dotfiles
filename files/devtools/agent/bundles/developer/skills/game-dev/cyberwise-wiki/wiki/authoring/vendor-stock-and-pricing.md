---
type: Engine Mechanic
title: Vendor stock and item pricing are both arrays of records, not values
description: Stock is an array mixing inline and shared records gated by player level, prices are arrays of Price component records combined at runtime, and several of those components exist but are read by nothing - which is why editing a price often changes nothing at all.
tags: [tweakxl, tweakdb, vendors, pricing, authoring, cyberware]
status: stable
generated: { by: "claude", at: "2026-08-24T21:15:00-04:00" }
---

# Vendor stock and item pricing are both arrays of records, not values

Both look like scalars from the outside - a vendor has a list of things, an item
has a price - and neither is. Both are arrays of *records* assembled at runtime,
and almost every "my vendor mod does nothing" and "my price mod does nothing"
traces back to editing the wrong end of one of them.

This is high-drift material: structure and component names have moved between
patches. Re-verify against the current string table rather than carrying an ID
forward on faith.

## Vendor stock

Stock lives in `Vendors.<vendor_id>.itemStock`, an array mixing **per-vendor
inline records** (`Vendors.<id>_inlineN`) and shared named records.

**Counting inline names undercounts badly.** One vendor showed 61 inline names
against 166 actual entries - the rest were shared records referenced by name. A
scan that greps for `_inline` and reports a total is wrong by a factor of nearly
three, and wrong in the direction that makes a vendor look emptier than it is.

Each entry carries `generationPrereqs`, typically a **player-level tier gate**.
At low tiers only tier-1 slots roll, which is the real reason early-game
netrunner vendors stock almost nothing: the entries are there, the player is not
allowed to roll them yet.

Two authoring traps:

- **`quantity` is `array:TweakDBID`, not a scalar.** Writing `quantity: 1`
  makes TweakXL reject the whole record. Omit it and inherit from `$base`.
- **Use `$base: Vendors.<a real inline stock slot>`** when authoring a new slot,
  so you inherit the correct record type rather than hardcoding an RTTI type
  name you cannot verify.

### Do not fabricate stock entries

Inventing a new stock record produced a vendor listing with **no display name**.
Three plausible explanations for that were each chased and disproved before the
real cause was found: the fabricated entry itself was the problem.

The reliable pattern for "let me buy X earlier" is the opposite of adding
anything - **clear `generationPrereqs: []` on the vendor's own existing slots**.
Those keep CDPR's authored name, price, quality and quantity, so there is
nothing left that can be malformed. You are removing a gate, not authoring a
record.

### The change will not show up until the vendor restocks

**Inventories are rolled once and persisted in the save.** A TweakDB change to
stock does not appear in a vendor already rolled. Skip roughly **24 in-game
hours** and re-check. Testing before that measures the save, not the tweak, and
produces a false negative that sends the whole investigation somewhere else.

## Pricing

Cyberware price is not a scalar on the item. `.buyPrice` is an **array of
`Price.*` component records** combined at runtime, and
`Price.ItemQualityMultiplier` is a **curve lookup**, not a value.

Quickhacks price from `Price.BaseHackPrice` x `ItemQualityMultiplier` x a
per-type multiplier.

### Some price records exist and nothing reads them

**`Price.CommonQuickhack` and its siblings are real records that nothing
consumes.** Editing them changes no price anywhere. This is a long-standing
source of "my price mod does nothing" - the record is found, the edit applies,
TweakXL logs no error, and the value is simply never read.

Existence in the string table proves a record is *declared*. It does not prove
anything reads it. Confirm the value you changed is on the path that computes
the number you are watching.

### Attached parts are billed with the item

A cyberdeck shipping pre-installed quickhacks in its `slotPartList` costs
several times the price of an identical bare deck. The parts are not free extras
- they are in the bill.

When diagnosing a price difference between two items that look the same, **diff
the two records' field lists first**. A field present on one and absent on the
other is usually the whole answer, and finding it takes seconds compared with
tracing the price computation.

## Related

- [What a vendor will buy is decided by tag filters, and one record can be every vendor of a kind](/engine/vendor-buy-filters-and-shared-records) - the buying half of the same record
- [Never guess a TweakDB record ID - the game writes the real list](/authoring/finding-the-real-record-id)
- [A TweakXL record is resolved last-wins, and that is the lever for everything else](/authoring/tweakxl-records-are-last-wins)
- [A mod that enumerates records will hand the player abstract templates](/patterns/record-enumeration-leaks-templates)
