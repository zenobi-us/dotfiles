# Fluid Simulation

Real-time Navier-Stokes fluid simulation using ping-pong buffers, vorticity confinement, and pressure projection.

```typescript
import { gpu } from "ralph-gpu";

const canvas = document.getElementById('canvas');
const ctx = await gpu.init(canvas, { dpr: Math.min(devicePixelRatio, 2), autoResize: true });

// Create ping-pong buffers for simulation state
// Velocity and pressure use lower resolution for performance
const SIM = 128, DYE = 256;
const velocity = ctx.pingPong(SIM, SIM, { format: "rg16float", filter: "linear", wrap: "clamp" });
const dye = ctx.pingPong(DYE, DYE, { format: "rgba16float", filter: "linear", wrap: "clamp" });
const pressure = ctx.pingPong(SIM, SIM, { format: "r16float", filter: "linear", wrap: "clamp" });
const divergence = ctx.target(SIM, SIM, { format: "r16float", filter: "nearest", wrap: "clamp" });
const curl = ctx.target(SIM, SIM, { format: "r16float", filter: "nearest", wrap: "clamp" });

// Splat velocity - adds force to the fluid at a point
const splatVelU = { uTarget: { value: velocity.read }, uPoint: { value: [0.5, 0.5] }, uColor: { value: [0, 0, 0] }, uRadius: { value: 0.003 } };
const splatVel = ctx.pass(`
  @group(1) @binding(0) var uTarget: texture_2d<f32>;
  @group(1) @binding(1) var uTargetSampler: sampler;
  struct Params { point: vec2f, color: vec3f, radius: f32 }
  @group(1) @binding(2) var<uniform> params: Params;
  @fragment fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let uv = pos.xy / globals.resolution;
    let base = textureSample(uTarget, uTargetSampler, uv).xy;
    var d = uv - params.point; d.x *= globals.aspect;
    return vec4f(base + exp(-dot(d, d) / params.radius) * params.color.xy, 0.0, 1.0);
  }`, { uniforms: splatVelU });

// Splat dye - adds color to the fluid at a point
const splatDyeU = { uTarget: { value: dye.read }, uPoint: { value: [0.5, 0.5] }, uColor: { value: [1, 0, 0] }, uRadius: { value: 0.003 } };
const splatDye = ctx.pass(`
  @group(1) @binding(0) var uTarget: texture_2d<f32>;
  @group(1) @binding(1) var uTargetSampler: sampler;
  struct Params { point: vec2f, color: vec3f, radius: f32 }
  @group(1) @binding(2) var<uniform> params: Params;
  @fragment fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let uv = pos.xy / globals.resolution;
    let base = textureSample(uTarget, uTargetSampler, uv).rgb;
    var d = uv - params.point; d.x *= globals.aspect;
    return vec4f(base + exp(-dot(d, d) / params.radius) * params.color, 1.0);
  }`, { uniforms: splatDyeU });

// Compute curl (rotation) of velocity field
const curlU = { uVelocity: { value: velocity.read } };
const curlPass = ctx.pass(`
  @group(1) @binding(0) var uVelocity: texture_2d<f32>;
  @group(1) @binding(1) var uVelocitySampler: sampler;
  @fragment fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let e = 1.0 / globals.resolution; let uv = pos.xy / globals.resolution;
    let L = textureSample(uVelocity, uVelocitySampler, uv - vec2f(e.x, 0)).y;
    let R = textureSample(uVelocity, uVelocitySampler, uv + vec2f(e.x, 0)).y;
    let B = textureSample(uVelocity, uVelocitySampler, uv - vec2f(0, e.y)).x;
    let T = textureSample(uVelocity, uVelocitySampler, uv + vec2f(0, e.y)).x;
    return vec4f(0.5 * (R - L - T + B), 0, 0, 1);
  }`, { uniforms: curlU });

// Vorticity confinement - amplifies rotational motion for more turbulent flow
const vortU = { uVelocity: { value: velocity.read }, uCurl: { value: curl }, uCurlStrength: { value: 20.0 }, uDt: { value: 0.016 } };
const vortPass = ctx.pass(`
  @group(1) @binding(0) var uVelocity: texture_2d<f32>;
  @group(1) @binding(1) var uVelocitySampler: sampler;
  @group(1) @binding(2) var uCurl: texture_2d<f32>;
  @group(1) @binding(3) var uCurlSampler: sampler;
  struct Params { curlStrength: f32, dt: f32 }
  @group(1) @binding(4) var<uniform> params: Params;
  @fragment fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let e = 1.0 / globals.resolution; let uv = pos.xy / globals.resolution;
    let L = textureSample(uCurl, uCurlSampler, uv - vec2f(e.x, 0)).x;
    let R = textureSample(uCurl, uCurlSampler, uv + vec2f(e.x, 0)).x;
    let B = textureSample(uCurl, uCurlSampler, uv - vec2f(0, e.y)).x;
    let T = textureSample(uCurl, uCurlSampler, uv + vec2f(0, e.y)).x;
    let C = textureSample(uCurl, uCurlSampler, uv).x;
    var f = 0.5 * vec2f(abs(T) - abs(B), abs(R) - abs(L));
    f = f / (length(f) + 0.0001) * params.curlStrength * C; f.y = -f.y;
    return vec4f(textureSample(uVelocity, uVelocitySampler, uv).xy + f * params.dt, 0, 1);
  }`, { uniforms: vortU });

// Compute divergence - measures how much fluid is expanding/contracting
const divU = { uVelocity: { value: velocity.read } };
const divPass = ctx.pass(`
  @group(1) @binding(0) var uVelocity: texture_2d<f32>;
  @group(1) @binding(1) var uVelocitySampler: sampler;
  @fragment fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let e = 1.0 / globals.resolution; let uv = pos.xy / globals.resolution;
    let L = textureSample(uVelocity, uVelocitySampler, uv - vec2f(e.x, 0)).x;
    let R = textureSample(uVelocity, uVelocitySampler, uv + vec2f(e.x, 0)).x;
    let B = textureSample(uVelocity, uVelocitySampler, uv - vec2f(0, e.y)).y;
    let T = textureSample(uVelocity, uVelocitySampler, uv + vec2f(0, e.y)).y;
    return vec4f(0.5 * (R - L + T - B), 0, 0, 1);
  }`, { uniforms: divU });

// Pressure solve - iterative solver to remove divergence (make fluid incompressible)
const pressU = { uPressure: { value: pressure.read }, uDivergence: { value: divergence } };
const pressPass = ctx.pass(`
  @group(1) @binding(0) var uPressure: texture_2d<f32>;
  @group(1) @binding(1) var uPressureSampler: sampler;
  @group(1) @binding(2) var uDivergence: texture_2d<f32>;
  @group(1) @binding(3) var uDivergenceSampler: sampler;
  @fragment fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let e = 1.0 / globals.resolution; let uv = pos.xy / globals.resolution;
    let L = textureSample(uPressure, uPressureSampler, uv - vec2f(e.x, 0)).x;
    let R = textureSample(uPressure, uPressureSampler, uv + vec2f(e.x, 0)).x;
    let B = textureSample(uPressure, uPressureSampler, uv - vec2f(0, e.y)).x;
    let T = textureSample(uPressure, uPressureSampler, uv + vec2f(0, e.y)).x;
    let d = textureSample(uDivergence, uDivergenceSampler, uv).x;
    return vec4f((L + R + B + T - d) * 0.25, 0, 0, 1);
  }`, { uniforms: pressU });

// Gradient subtract - subtract pressure gradient from velocity to enforce incompressibility
const gradU = { uPressure: { value: pressure.read }, uVelocity: { value: velocity.read } };
const gradPass = ctx.pass(`
  @group(1) @binding(0) var uPressure: texture_2d<f32>;
  @group(1) @binding(1) var uPressureSampler: sampler;
  @group(1) @binding(2) var uVelocity: texture_2d<f32>;
  @group(1) @binding(3) var uVelocitySampler: sampler;
  @fragment fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let e = 1.0 / globals.resolution; let uv = pos.xy / globals.resolution;
    let L = textureSample(uPressure, uPressureSampler, uv - vec2f(e.x, 0)).x;
    let R = textureSample(uPressure, uPressureSampler, uv + vec2f(e.x, 0)).x;
    let B = textureSample(uPressure, uPressureSampler, uv - vec2f(0, e.y)).x;
    let T = textureSample(uPressure, uPressureSampler, uv + vec2f(0, e.y)).x;
    return vec4f(textureSample(uVelocity, uVelocitySampler, uv).xy - vec2f(R - L, T - B), 0, 1);
  }`, { uniforms: gradU });

// Advect velocity - move velocity field along itself (self-advection)
const advVelU = { uVelocity: { value: velocity.read }, uSource: { value: velocity.read }, uDissipation: { value: 0.99 }, uDt: { value: 0.016 } };
const advVelPass = ctx.pass(`
  @group(1) @binding(0) var uVelocity: texture_2d<f32>;
  @group(1) @binding(1) var uVelocitySampler: sampler;
  @group(1) @binding(2) var uSource: texture_2d<f32>;
  @group(1) @binding(3) var uSourceSampler: sampler;
  struct Params { dissipation: f32, dt: f32 }
  @group(1) @binding(4) var<uniform> params: Params;
  @fragment fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let e = 1.0 / globals.resolution; let uv = pos.xy / globals.resolution;
    let v = textureSample(uVelocity, uVelocitySampler, uv).xy;
    return vec4f(textureSample(uSource, uSourceSampler, uv - params.dt * v * e).xy * params.dissipation, 0, 1);
  }`, { uniforms: advVelU });

// Advect dye - move color along velocity field
const advDyeU = { uVelocity: { value: velocity.read }, uSource: { value: dye.read }, uDissipation: { value: 0.98 }, uDt: { value: 0.016 } };
const advDyePass = ctx.pass(`
  @group(1) @binding(0) var uVelocity: texture_2d<f32>;
  @group(1) @binding(1) var uVelocitySampler: sampler;
  @group(1) @binding(2) var uSource: texture_2d<f32>;
  @group(1) @binding(3) var uSourceSampler: sampler;
  struct Params { dissipation: f32, dt: f32 }
  @group(1) @binding(4) var<uniform> params: Params;
  @fragment fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let velE = 1.0 / vec2f(128.0, 128.0);
    let uv = pos.xy / globals.resolution;
    let v = textureSample(uVelocity, uVelocitySampler, uv).xy;
    return vec4f(textureSample(uSource, uSourceSampler, uv - params.dt * v * velE).rgb * params.dissipation, 1);
  }`, { uniforms: advDyeU });

// Display - render dye with tone mapping
const dispU = { uDye: { value: dye.read } };
const dispPass = ctx.pass(`
  @group(1) @binding(0) var uDye: texture_2d<f32>;
  @group(1) @binding(1) var uDyeSampler: sampler;
  @fragment fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let c = textureSample(uDye, uDyeSampler, pos.xy / globals.resolution).rgb;
    return vec4f(pow(c / (1.0 + c), vec3f(0.45)), 1);
  }`, { uniforms: dispU });

// HSL to RGB color conversion
function hsl(h, s, l) {
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const hue = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  return [hue(h + 1/3), hue(h), hue(h - 1/3)];
}

// Animation loop
let lastX = 0.5, lastY = 0.5;
function frame() {
  const t = ctx.time;
  const dt = 0.016;
  
  // Animated input point
  const x = 0.5 + 0.3 * Math.sin(t);
  const y = 0.5 + 0.2 * Math.cos(t * 4);
  const dx = (x - lastX) * 6000;
  const dy = (y - lastY) * 6000;
  const col = hsl((t * 0.1) % 1, 1, 0.5);
  
  // 1. Splat velocity and dye at input point
  splatVelU.uTarget.value = velocity.read;
  splatVelU.uPoint.value = [x, y];
  splatVelU.uColor.value = [dx, dy, 0];
  ctx.setTarget(velocity.write);
  ctx.autoClear = false;
  splatVel.draw();
  velocity.swap();
  
  splatDyeU.uTarget.value = dye.read;
  splatDyeU.uPoint.value = [x, y];
  splatDyeU.uColor.value = col;
  ctx.setTarget(dye.write);
  splatDye.draw();
  dye.swap();
  
  // 2. Compute curl and apply vorticity confinement
  curlU.uVelocity.value = velocity.read;
  ctx.setTarget(curl);
  curlPass.draw();
  
  vortU.uVelocity.value = velocity.read;
  vortU.uCurl.value = curl;
  vortU.uDt.value = dt;
  ctx.setTarget(velocity.write);
  vortPass.draw();
  velocity.swap();
  
  // 3. Compute divergence and solve for pressure
  divU.uVelocity.value = velocity.read;
  ctx.setTarget(divergence);
  divPass.draw();
  
  // Jacobi iterations for pressure
  for (let i = 0; i < 3; i++) {
    pressU.uPressure.value = pressure.read;
    pressU.uDivergence.value = divergence;
    ctx.setTarget(pressure.write);
    pressPass.draw();
    pressure.swap();
  }
  
  // 4. Subtract pressure gradient to make velocity divergence-free
  gradU.uPressure.value = pressure.read;
  gradU.uVelocity.value = velocity.read;
  ctx.setTarget(velocity.write);
  gradPass.draw();
  velocity.swap();
  
  // 5. Advect velocity and dye along velocity field
  advVelU.uVelocity.value = velocity.read;
  advVelU.uSource.value = velocity.read;
  advVelU.uDt.value = dt;
  ctx.setTarget(velocity.write);
  advVelPass.draw();
  velocity.swap();
  
  advDyeU.uVelocity.value = velocity.read;
  advDyeU.uSource.value = dye.read;
  advDyeU.uDt.value = dt;
  ctx.setTarget(dye.write);
  advDyePass.draw();
  dye.swap();
  
  // 6. Render dye to screen
  dispU.uDye.value = dye.read;
  ctx.setTarget(null);
  ctx.autoClear = true;
  dispPass.draw();
  
  lastX = x;
  lastY = y;
  requestAnimationFrame(frame);
}
frame();
```
