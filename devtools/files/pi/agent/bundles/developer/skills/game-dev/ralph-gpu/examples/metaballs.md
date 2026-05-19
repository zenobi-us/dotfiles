# Metaballs

Organic-looking "blobs" that merge together based on an implicit surface. This effect uses a distance-based field and a threshold to create smooth blending.

```typescript
import { gpu } from 'ralph-gpu';

// Initialize WebGPU context
const canvas = document.getElementById('canvas');
const ctx = await gpu.init(canvas, { autoResize: true });

// Create a metaballs pass
const metaballs = ctx.pass(`
@fragment
fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let uv = (pos.xy - globals.resolution * 0.5) / globals.resolution.y;
  
  // Ball positions (animated)
  let t = globals.time;
  let p1 = vec2f(sin(t) * 0.3, cos(t * 1.3) * 0.3);
  let p2 = vec2f(sin(t * 0.7 + 2.0) * 0.3, cos(t) * 0.3);
  let p3 = vec2f(sin(t * 1.2 + 4.0) * 0.3, cos(t * 0.8 + 1.0) * 0.3);
  
  // Metaball field
  let r = 0.1;
  let field = r / length(uv - p1) + r / length(uv - p2) + r / length(uv - p3);
  
  // Threshold and color
  let threshold = 1.0;
  let c = smoothstep(threshold, threshold + 0.1, field);
  let col = mix(vec3f(0.1, 0.1, 0.2), vec3f(0.2, 0.8, 1.0), c);
  
  return vec4f(col, 1.0);
}
`);

// Render loop
function frame() {
  metaballs.draw();
  requestAnimationFrame(frame);
}
frame();
```
