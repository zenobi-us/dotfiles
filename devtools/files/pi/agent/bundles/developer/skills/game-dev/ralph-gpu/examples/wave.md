# Animated Wave

A glowing sine wave with custom uniforms. The wave animates over time using globals.time.

```typescript
import { gpu } from 'ralph-gpu';

// Initialize WebGPU context
const canvas = document.getElementById('canvas');
const ctx = await gpu.init(canvas, { autoResize: true });

// Define parameters
const params = {
  amplitude: { value: 0.3 },
  frequency: { value: 8.0 },
  color: { value: [0.2, 0.8, 1.0] }
};

// Create a fragment shader pass with uniforms
const wave = ctx.pass(`
  struct Params { amplitude: f32, frequency: f32, color: vec3f }
  @group(1) @binding(0) var<uniform> u: Params;

  @fragment
  fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let uv = pos.xy / globals.resolution;
    let w = sin(uv.x * u.frequency + globals.time * 2.0) * u.amplitude;
    let d = abs(uv.y - 0.5 - w);
    let glow = 0.02 / d;
    return vec4f(u.color * glow, 1.0);
  }
`, { uniforms: params });

// Render loop
function frame() {
  wave.draw();
  requestAnimationFrame(frame);
}
frame();
```
