# Input and bindings

What decides which key does what on a modded install, and why every simple
version of that question - "is this key free?", "what does this mouse button
do?" - has a wrong answer that looks right.

The recurring shape: a binding you cannot find is not a key that is free. Every
article here is a different way of not finding one.

- [Five separate stores hold key bindings, and no single one answers what a key is bound to](/input/five-binding-stores) - the stores, their formats, `overridableUI` precedence, `buttonGroup` indirection, and the sixth file holding the game's own claims
- [A mod can change what a vanilla key does without registering a key of its own](/input/a-mod-can-repurpose-a-vanilla-mapping) - why hiding base-game rows to cut noise hides the rows the question was about
- [A programmable mouse is a layer over the binding stores, not another store](/input/a-peripheral-profile-is-a-layer) - the three-way join, and the dead button that only the join can find
- [Describing a device's physical geometry so a tool can draw it](/input/describing-a-device-physical-geometry) - the block a user bundle carries so a renderer can draw the real arrangement, and why a registry of peripherals shipped inside a tool is the wrong home for it
- [One key has four spellings, and comparing any two of them directly finds nothing](/input/one-key-four-spellings) - canonicalise before comparing, or a taken key reports as free
- [A binding store can lose its contents, and an empty store looks exactly like the wrong store](/input/a-binding-store-can-empty-itself) - the bound-to-total ratio, and the wrong inference it prevents
- [A binding can be stored as a packed integer instead of a key name](/input/packed-key-codes) - CET's 16-bit slots, `0` for unbound, and the VK 255 chord that can never match
- [An input context is not a category, and a shared key is usually not a fault](/input/input-contexts-are-not-categories) - why a dialogue tool gets filed under "Vehicle"
- [A bind dialog reading "unknown+key" is a device on the machine, not a mod](/input/a-phantom-input-device-poisons-the-bind-dialog) - the extended-key split that names the layer, and the software theories eliminated first, at length *(draft: one machine, one event)*
