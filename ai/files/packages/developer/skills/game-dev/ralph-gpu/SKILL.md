---
name: ralph-gpu
description: Minimal WebGPU shader library for creative coding and real-time graphics. Provides fullscreen passes, particles, compute shaders, render targets, and ping-pong buffers with automatic uniform bindings and global time/resolution tracking.
---

# ralph-gpu

A minimal WebGPU shader library for creative coding and real-time graphics.

## When to Use

Use this skill when:
- Building WebGPU shader effects, creative coding projects, or real-time graphics
- Working with fullscreen shader passes, particle systems, or compute shaders
- Need guidance on ralph-gpu API, render targets, or WGSL shader patterns
- Implementing GPU-accelerated simulations or visual effects

## Installation

```bash
npm install ralph-gpu
# For TypeScript support:
npm install -D @webgpu/types
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| `gpu` | Module entry point for initialization |
| `ctx` | GPU context — manages state and rendering |
| `pass` | Fullscreen shader (fragment only, uses internal quad) |
| `material` | Shader with custom vertex code (particles, geometry) |
| `target` | Render target (offscreen texture) |
| `pingPong` | Pair of render targets for iterative effects |
| `compute` | Compute shader for GPU-parallel computation |
| `storage` | Storage buffer for large data (particles, simulations) |
| `sampler` | Custom texture sampler with explicit filtering/wrapping |
| `texture` | Load images, canvases, video, or raw data as GPU textures |

## Auto-Injected Globals

Every shader automatically has access to these uniforms:

```wgsl
struct Globals {
  resolution: vec2f,  // Current render target size in pixels
  time: f32,          // Seconds since init
  deltaTime: f32,     // Seconds since last frame
  frame: u32,         // Frame count since init
  aspect: f32,        // resolution.x / resolution.y
}
@group(0) @binding(0) var<uniform> globals: Globals;
```

## Quick Start

```tsx
import { gpu } from "ralph-gpu";

// Check support
if (!gpu.isSupported()) {
  console.error("WebGPU not supported");
  return;
}

// Initialize
const ctx = await gpu.init(canvas, { autoResize: true });

// Create fullscreen shader pass
const pass = ctx.pass(\`
  @fragment
  fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let uv = pos.xy / globals.resolution;
    return vec4f(uv, sin(globals.time) * 0.5 + 0.5, 1.0);
  }
\`);

// Render loop
function frame() {
  pass.draw();
  requestAnimationFrame(frame);
}
frame();
```

## API Overview

### Context Creation

```tsx
const ctx = await gpu.init(canvas, {
  autoResize?: boolean,  // Auto-handle canvas sizing (default: false)
  dpr?: number,          // Device pixel ratio
  debug?: boolean,       // Enable debug mode
  events?: {             // Event tracking
    enabled: boolean,
    types?: string[],
    historySize?: number
  }
});
```

### Fullscreen Passes

```tsx
// Simple mode (auto-generated bindings)
const pass = ctx.pass(wgslCode, {
  uTexture: someTarget,
  color: [1, 0, 0],
  intensity: 0.5
});
pass.set("intensity", 0.8);  // Update uniforms

// Manual mode (explicit bindings)
const pass = ctx.pass(wgslCode, {
  uniforms: {
    myValue: { value: 1.0 }
  }
});
pass.uniforms.myValue.value = 2.0;
```

### Render Targets

```tsx
const target = ctx.target(512, 512, {
  format?: "rgba8unorm" | "rgba16float" | "r16float" | "rg16float",
  filter?: "linear" | "nearest",
  wrap?: "clamp" | "repeat" | "mirror",
  usage?: "render" | "storage" | "both"
});

ctx.setTarget(target);  // Render to target
ctx.setTarget(null);    // Render to screen
```

### Ping-Pong Buffers

```tsx
const simulation = ctx.pingPong(128, 128, {
  format: "rgba16float"
});

// In render loop:
uniforms.inputTex.value = simulation.read;
ctx.setTarget(simulation.write);
processPass.draw();
simulation.swap();
```

### Particles (Instanced Quads)

```tsx
const particles = ctx.particles(1000, {
  shader: wgslCode,      // Full vertex + fragment shader
  bufferSize: 1000 * 16, // Buffer size in bytes
  blend: "additive"
});

particles.write(particleData);  // Float32Array
particles.draw();
```

### Compute Shaders

```tsx
const compute = ctx.compute(\`
  @compute @workgroup_size(64)
  fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    // GPU computation
  }
\`);

compute.storage("buffer", storageBuffer);
compute.dispatch(Math.ceil(count / 64));
```

### Storage Buffers

```tsx
const buffer = ctx.storage(byteSize);
buffer.write(new Float32Array([...]));

// Bind to shader
pass.storage("dataBuffer", buffer);
```

### Texture Loading

```tsx
// From URL (async)
const tex = await ctx.texture("image.png");

// From canvas / video / ImageBitmap (sync)
const tex = ctx.texture(canvas);

// From raw pixel data (sync)
const tex = ctx.texture(new Uint8Array(data), { width: 256, height: 256 });

// Options
const tex = await ctx.texture("photo.jpg", {
  filter: "linear",     // "linear" | "nearest"
  wrap: "repeat",       // "clamp" | "repeat" | "mirror"
  format: "rgba8unorm", // GPU texture format
  flipY: true,          // Flip vertically on load
});

// Bind to shader (manual mode)
const pass = ctx.pass(shader, {
  uniforms: {
    uTex: { value: tex },  // .texture and .sampler auto-bound
  }
});

// Update from live source (canvas, video)
tex.update(videoElement);

// Clean up
tex.dispose();
```

## Important Notes

**WGSL Alignment**: `array<vec3f>` has 16-byte stride, not 12. Always pad to 16 bytes:
```tsx
// Correct: [x, y, z, 0.0] per element
const buffer = ctx.storage(count * 16);
```

**Particle Rendering**: Use instanced quads, not point-list (WebGPU points are always 1px)

**Texture References**: Target references stay valid after resize — no need to update uniforms

**Screen Readback**: Cannot read pixels from screen, only from render targets

## Examples

Full working examples extracted from the docs app:

- [Simple Gradient](./examples/gradient.md) — The simplest possible shader — map UV coordinates to colors. This creates a gradient from black (bottom-left) to cyan (top-right).
- [Animated Wave](./examples/wave.md) — A glowing sine wave with custom uniforms. The wave animates over time using globals.time.
- [Time-Based Color Cycling](./examples/color-cycle.md) — A hypnotic pattern that cycles through colors over time. Combines time, distance, and angle for a mesmerizing effect.
- [Raymarching Sphere](./examples/raymarching.md) — A basic 3D sphere rendered using raymarching. This demonstrates how to create 3D shapes and lighting entirely within a fragment shader.
- [Perlin-style Noise](./examples/noise.md) — Layered fractional Brownian motion (fBm) noise. This technique is fundamental for generating procedural textures, terrain, and natural-looking patterns.
- [Metaballs](./examples/metaballs.md) — Organic-looking "blobs" that merge together based on an implicit surface. This effect uses a distance-based field and a threshold to create smooth blending.
- [Mandelbrot Set](./examples/fractal.md) — The classic complex number fractal. This shader computes the set by iterating z = z² + c and mapping the escape time to vibrant colors.
- [Alien Planet](./examples/alien-planet.md) — A procedurally generated alien world with atmospheric scattering and an orbiting moon. Uses raymarching with fBm noise for terrain detail.
- [Fluid Simulation](./examples/fluid.md) — Real-time Navier-Stokes fluid simulation using ping-pong buffers, vorticity confinement, and pressure projection.
- [Triangle Particles](./examples/triangle-particles.md) — GPU-driven particle system with SDF-based physics. 30,000 particles spawn on triangle edges and flow along a signed distance field with chromatic aberration postprocessing.

## Resources

- [GitHub Repository](https://github.com/your-org/ralph-gpu)
- [API Documentation](https://ralph-gpu.dev/docs)
- [WebGPU Specification](https://gpuweb.github.io/gpuweb/)
