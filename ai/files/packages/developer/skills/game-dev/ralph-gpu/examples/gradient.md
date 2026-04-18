# Simple Gradient

The simplest possible shader — map UV coordinates to colors. This creates a gradient from black (bottom-left) to cyan (top-right).

```typescript
import { gpu } from 'ralph-gpu';

// Initialize WebGPU context
const canvas = document.getElementById('canvas');
const ctx = await gpu.init(canvas, { autoResize: true });

// Create a fragment shader pass
const gradient = ctx.pass(`
  @fragment
  fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let uv = pos.xy / globals.resolution;
    return vec4f(uv, 0.5, 1.0);
  }
`);

// Render loop
function frame() {
  gradient.draw();
  requestAnimationFrame(frame);
}
frame();
```
