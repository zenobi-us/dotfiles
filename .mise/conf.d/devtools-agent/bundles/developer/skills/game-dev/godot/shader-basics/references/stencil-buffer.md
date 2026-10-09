# Stencil Buffer Effects (Godot 4.5+)

Reference for `skills/shader-basics/SKILL.md` — stencil-write/read render modes, X-ray vision portal worked example.

> ← Back to [SKILL.md](../SKILL.md)

---
## 9. Stencil Buffer Effects (Godot 4.5+)

Godot 4.5 exposes hardware stencil operations on all backends (Vulkan, D3D12, Metal, GLES3). Stencils let you mark pixels during one draw pass and test against those marks in a later pass — enabling portals, X-ray vision through walls, per-object masks, and holes-in-geometry that were impossible without custom CompositorEffect code before 4.5.

### How It Works

The stencil works in two passes:
1. **Write pass** — marks pixels with a reference value using `stencil_write_mode`
2. **Read pass** — tests pixels against the written value using `stencil_read_mode`

### Key Render Modes (spatial and canvas_item)

| Render mode keyword | Effect |
|---------------------|--------|
| `stencil_write_mode` | Marks stencil during this draw (`write`, `write_inv`, or off) |
| `stencil_read_mode` | Reads (tests against) the stencil (`read`, `read_inv`, or off) |
| `stencil_value` | Reference value used for the stencil test (0–255) |
| `stencil_compare` | Comparison function: `equal`, `not_equal`, `always`, `never`, etc. |

### Example — X-Ray Vision Portal

Pass 1: Mask shader marks where the portal mesh is rendered.

```glsl
// portal_mask.gdshader
shader_type spatial;
render_mode unshaded, stencil_write_mode, stencil_value = 1;

void fragment() {
    // Write stencil value 1 everywhere the portal mesh appears.
    // The portal itself can be invisible — just set ALPHA = 0 if needed.
    ALBEDO = vec3(0.0);
    ALPHA = 0.0;
}
```

Pass 2: X-ray shader only draws where stencil value is 1.

```glsl
// xray_object.gdshader
shader_type spatial;
render_mode unshaded, stencil_read_mode, stencil_compare = equal, stencil_value = 1;

void fragment() {
    // Only visible inside the portal area.
    ALBEDO = vec3(0.2, 0.8, 1.0);
}
```

In your scene, assign `portal_mask.gdshader` to the portal mesh and `xray_object.gdshader` to the character/object you want to see through walls. Render priority controls draw order (portal mask must render before the x-ray pass).

> **Note:** Stencil render modes are a Godot 4.5+ feature. The exact keyword names were settled at release — consult the [PR #80710](https://github.com/godotengine/godot/pull/80710) for the full list of compare functions and write modes.

> **When to use:** Use stencil effects for portal/window cutouts, selective object highlights, and masking effects. For per-object outlines without stencils, the multi-pass highlight approach in Section 3 is simpler.

C# uses the same shader code and `ShaderMaterial.SetShaderParameter()` API — stencil state is set entirely in the `.gdshader` render modes, not in GDScript/C#.

---

