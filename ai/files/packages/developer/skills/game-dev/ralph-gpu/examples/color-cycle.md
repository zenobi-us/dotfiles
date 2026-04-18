# Time-Based Color Cycling

A hypnotic pattern that cycles through colors over time. Combines time, distance, and angle for a mesmerizing effect.

```typescript
import { gpu } from 'ralph-gpu';

// Initialize WebGPU context
const canvas = document.getElementById('canvas');
const ctx = await gpu.init(canvas, { autoResize: true });

// Create a fragment shader pass
const colorCycle = ctx.pass(`
  @fragment
  fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let uv = pos.xy / globals.resolution;
    let t = globals.time * 0.5;
    
    // Cycle through hues
    let r = sin(t) * 0.5 + 0.5;
    let g = sin(t + 2.094) * 0.5 + 0.5;
    let b = sin(t + 4.188) * 0.5 + 0.5;
    
    // Create radial pattern
    let center = uv - 0.5;
    let dist = length(center);
    let angle = atan2(center.y, center.x);
    let pattern = sin(dist * 20.0 - globals.time * 3.0 + angle * 3.0);
    
    let color = vec3f(r, g, b) * (pattern * 0.3 + 0.7);
    return vec4f(color, 1.0);
  }
`);

// Render loop
function frame() {
  colorCycle.draw();
  requestAnimationFrame(frame);
}
frame();
```
