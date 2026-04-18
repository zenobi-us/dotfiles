# Perlin-style Noise

Layered fractional Brownian motion (fBm) noise. This technique is fundamental for generating procedural textures, terrain, and natural-looking patterns.

```typescript
import { gpu } from 'ralph-gpu';

// Initialize WebGPU context
const canvas = document.getElementById('canvas');
const ctx = await gpu.init(canvas, { autoResize: true });

// Create a noise pass
const noisePass = ctx.pass(`
// Include a simple hash function and noise
fn hash(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453);
}

fn noise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2f(1.0, 0.0)), u.x),
    mix(hash(i + vec2f(0.0, 1.0)), hash(i + vec2f(1.0, 1.0)), u.x),
    u.y
  );
}

@fragment
fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let uv = pos.xy / globals.resolution;
  var n = 0.0;
  var amp = 0.5;
  var freq = 4.0;
  for (var i = 0; i < 5; i++) {
    n += amp * noise(uv * freq + globals.time * 0.5);
    amp *= 0.5;
    freq *= 2.0;
  }
  return vec4f(vec3f(n), 1.0);
}
`);

// Render loop
function frame() {
  noisePass.draw();
  requestAnimationFrame(frame);
}
frame();
```
