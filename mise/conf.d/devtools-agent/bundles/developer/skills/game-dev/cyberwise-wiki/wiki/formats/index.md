# Formats

How a file is laid out, and how it misleads you. Binary containers, text
presets, injector builds and the document shapes the family reads and writes.

An article here should be enough to actually parse the thing: real offsets, real
magic numbers, a real hex dump. Where a claim was checked against one file on
one patch, the article says so - these are internal formats with no
compatibility promise, and the save container drifts fastest of anything in this
bundle.

## Save files

- [A sav.dat is an LZ4 block container with an uncompressed index bolted on the end](/formats/cyberpunk-save-container) - the chunk table, the node table read from the footer backwards, the packed-VLQ count, and the offset arithmetic that overruns your buffer by exactly the header size
- [Appearance lives in a save node CDPR misspelled, and its blocks can disagree with each other](/formats/appearance-in-a-save) - `Characetr`, the length-prefixed resource/option grammar, and why a part renders in the creator and not in the world
- [An ACU preset's LocKey number is a hash of a group name, not a localization key](/formats/acu-preset) - FNV1a-64 group hashes, why two presets legitimately differ in line count, and why the indices must never be reconciled against notes

## Injectors and shaders

- [The ReShade add-on build is identified by being UNSIGNED, not by its filename](/formats/reshade-addon-build) - the `.addon64` trigger, the Authenticode test, and the sourcing traps that make a shader look missing
- [Two shader packs by one author ship the same headers, and the copies differ](/formats/stacked-shader-packs) - recursive `EffectSearchPaths`, compile errors that move between launches, and the folder layout that fixes it

## Documents

- [The character-document formats, and what each one is structurally good at](/formats/character-document-formats) - seven shapes for a V's backstory, the question that unlocks each, and how each one characteristically fails
