# Mandelbrot Set

The classic complex number fractal. This shader computes the set by iterating z = z² + c and mapping the escape time to vibrant colors.

```typescript
import { gpu } from 'ralph-gpu';

// Initialize WebGPU context
const canvas = document.getElementById('canvas');
const ctx = await gpu.init(canvas, { autoResize: true });

// Create a fractal pass that explores the Mandelbrot set
const fractal = ctx.pass(`
@fragment
fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let uv = (pos.xy - globals.resolution * 0.5) / globals.resolution.y;
  
  // Zoom around interesting area
  let zoom = 1.5;
  let c = uv * zoom + vec2f(-0.7, 0.0);
  
  var z = vec2f(0.0);
  var iter = 0;
  let max_iter = 100;
  
  for (var i = 0; i < max_iter; i++) {
    z = vec2f(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    if (dot(z, z) > 4.0) {
      break;
    }
    iter = i;
  }
  
  if (iter == max_iter - 1) {
    return vec4f(0.0, 0.0, 0.05, 1.0);
  }
  
  let t = f32(iter) / f32(max_iter);
  let col = vec3f(
    0.5 + 0.5 * sin(t * 10.0 + globals.time * 0.5),
    0.5 + 0.5 * sin(t * 10.0 + 2.0 + globals.time * 0.3),
    0.5 + 0.5 * sin(t * 10.0 + 4.0 + globals.time * 0.4)
  );
  
  return vec4f(col * 1.2, 1.0);
}
`);

// Render loop
function frame() {
  fractal.draw();
  requestAnimationFrame(frame);
}
frame();
```
