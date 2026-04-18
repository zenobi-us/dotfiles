# Raymarching Sphere

A basic 3D sphere rendered using raymarching. This demonstrates how to create 3D shapes and lighting entirely within a fragment shader.

```typescript
import { gpu } from 'ralph-gpu';

// Initialize WebGPU context
const canvas = document.getElementById('canvas');
const ctx = await gpu.init(canvas, { autoResize: true });

// Create a raymarching pass
const raymarch = ctx.pass(`
@fragment
fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let uv = (pos.xy - globals.resolution * 0.5) / min(globals.resolution.x, globals.resolution.y);
  
  // Camera
  let ro = vec3f(0.0, 0.0, -3.0);
  let rd = normalize(vec3f(uv, 1.0));
  
  // Raymarching
  var t = 0.0;
  for (var i = 0; i < 64; i++) {
    let p = ro + rd * t;
    let d = length(p) - 1.0; // sphere SDF
    if (d < 0.001) { break; }
    t += d;
  }
  
  // Shading
  let p = ro + rd * t;
  let n = normalize(p);
  let light = normalize(vec3f(1.0, 1.0, -1.0));
  let diff = max(dot(n, light), 0.0);
  
  let col = vec3f(0.2, 0.5, 1.0) * (diff * 0.8 + 0.2);
  
  // If we missed everything, return background
  if (t > 10.0) {
    return vec4f(0.1, 0.1, 0.15, 1.0);
  }
  
  return vec4f(col, 1.0);
}
`);

// Render loop
function frame() {
  raymarch.draw();
  requestAnimationFrame(frame);
}
frame();
```
