# Alien Planet

A procedurally generated alien world with atmospheric scattering and an orbiting moon. Uses raymarching with fBm noise for terrain detail.

```typescript
import { gpu } from 'ralph-gpu';

const canvas = document.getElementById('canvas');
const ctx = await gpu.init(canvas, { autoResize: true });

const alienPlanet = ctx.pass(`
const MAX_STEPS: i32 = 100;
const MAX_DIST: f32 = 200.0;
const SURF_DIST: f32 = 0.001;
const PLANET_RADIUS: f32 = 8.0;
const PLANET_POS: vec3f = vec3f(0.0, 0.0, 30.0);
const ATMOSPHERE_RADIUS: f32 = 9.5;
const MOON_RADIUS: f32 = 1.5;

fn hash31(p: vec3f) -> f32 {
  var p3 = fract(p * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}

fn noise3D(p: vec3f) -> f32 {
  let i = floor(p); let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash31(i), hash31(i + vec3f(1.0, 0.0, 0.0)), u.x),
    mix(hash31(i + vec3f(0.0, 1.0, 0.0)), hash31(i + vec3f(1.0, 1.0, 0.0)), u.x), u.y),
    mix(mix(hash31(i + vec3f(0.0, 0.0, 1.0)), hash31(i + vec3f(1.0, 0.0, 1.0)), u.x),
    mix(hash31(i + vec3f(0.0, 1.0, 1.0)), hash31(i + vec3f(1.0, 1.0, 1.0)), u.x), u.y), u.z);
}

fn fbm(p: vec3f) -> f32 {
  var v: f32 = 0.0; var a: f32 = 0.5; var pos = p;
  for (var i = 0; i < 5; i++) { v += a * noise3D(pos); a *= 0.5; pos *= 2.0; }
  return v;
}

fn sdPlanet(p: vec3f) -> f32 {
  let lp = p - PLANET_POS;
  let base = length(lp) - PLANET_RADIUS;
  let noise = fbm(normalize(lp) * 8.0) * 0.3;
  let crater = pow(fbm(normalize(lp) * 4.0 + 10.0), 2.0) * 0.2;
  return base - noise + crater;
}

fn getMoonPos(time: f32) -> vec3f {
  return PLANET_POS + vec3f(cos(time * 0.15) * 16.0, sin(time * 0.1) * 5.0, sin(time * 0.15) * 14.0);
}

fn sdMoon(p: vec3f, time: f32) -> f32 {
  let lp = p - getMoonPos(time);
  return length(lp) - MOON_RADIUS - fbm(normalize(lp) * 6.0) * 0.08;
}

struct Hit { dist: f32, mat: i32 }

fn map(p: vec3f, time: f32) -> Hit {
  var h: Hit; h.dist = MAX_DIST; h.mat = 0;
  let pd = sdPlanet(p); if (pd < h.dist) { h.dist = pd; h.mat = 1; }
  let md = sdMoon(p, time); if (md < h.dist) { h.dist = md; h.mat = 2; }
  return h;
}

fn calcNormal(p: vec3f, time: f32) -> vec3f {
  let e = vec2f(0.001, 0.0);
  return normalize(vec3f(map(p + e.xyy, time).dist - map(p - e.xyy, time).dist,
    map(p + e.yxy, time).dist - map(p - e.yxy, time).dist,
    map(p + e.yyx, time).dist - map(p - e.yyx, time).dist));
}

fn atmosphere(ro: vec3f, rd: vec3f) -> vec3f {
  let oc = ro - PLANET_POS; let b = dot(oc, rd); let c = dot(oc, oc) - ATMOSPHERE_RADIUS * ATMOSPHERE_RADIUS;
  let h = b * b - c; if (h < 0.0) { return vec3f(0.0); }
  let t1 = max(-b - sqrt(h), 0.0); let t2 = -b + sqrt(h); if (t2 < 0.0) { return vec3f(0.0); }
  var scatter = vec3f(0.0); let astep = (t2 - t1) / 8.0;
  for (var i = 0; i < 8; i++) {
    let at = t1 + (f32(i) + 0.5) * astep;
    let sp = ro + rd * at;
    let alt = (length(sp - PLANET_POS) - PLANET_RADIUS) / (ATMOSPHERE_RADIUS - PLANET_RADIUS);
    let den = exp(-alt * 4.0);
    scatter += (vec3f(0.2, 0.5, 1.0) + vec3f(1.0, 0.4, 0.2) * 0.3) * den * astep * 0.15;
  }
  return scatter;
}

fn getPlanetColor(p: vec3f, time: f32) -> vec3f {
  let lp = p - PLANET_POS; let sc = normalize(lp);
  let n1 = fbm(sc * 4.0); let n2 = fbm(sc * 8.0 + 10.0);
  var col = mix(vec3f(0.6, 0.2, 0.4), vec3f(0.2, 0.5, 0.4), n1);
  col = mix(col, vec3f(0.8, 0.6, 0.3), n2 * 0.5);
  let polar = abs(sc.y);
  if (polar > 0.7) { col = mix(col, vec3f(0.7, 0.8, 0.9), smoothstep(0.7, 0.9, polar)); }
  let bio = fbm(sc * 12.0 + time * 0.05);
  if (bio > 0.65) { col += vec3f(0.2, 1.0, 0.6) * (bio - 0.65) * 0.5; }
  return col;
}

@fragment
fn main(@builtin(position) fc: vec4f) -> @location(0) vec4f {
  var uv = (fc.xy - 0.5 * globals.resolution) / globals.resolution.y;
  uv.y = -uv.y;
  let time = globals.time;
  let camDist = 75.0 - time * 0.3; let camAngle = time * 0.05;
  let ro = vec3f(sin(camAngle) * 20.0, sin(time * 0.1) * 4.0 + 8.0, camDist);
  let fwd = normalize(PLANET_POS - ro);
  let rgt = normalize(cross(vec3f(0.0, 1.0, 0.0), fwd));
  let up = cross(fwd, rgt);
  let rd = normalize(fwd + uv.x * rgt + uv.y * up);
  let sunDir = normalize(vec3f(0.5, 0.3, -1.0));
  
  var col = vec3f(0.0);
  col += pow(max(dot(rd, sunDir), 0.0), 256.0) * 2.0 * vec3f(1.0, 0.9, 0.7);
  col += pow(max(dot(rd, sunDir), 0.0), 8.0) * 0.3 * vec3f(1.0, 0.9, 0.7);
  
  let nc = rd * 2.0;
  let neb1 = fbm(nc + vec3f(0.0, 0.0, time * 0.01));
  let neb2 = fbm(nc * 2.0 + vec3f(100.0, 0.0, time * 0.02));
  col += mix(vec3f(0.1, 0.0, 0.15), vec3f(0.0, 0.1, 0.2), neb1) * neb2 * 0.15;
  
  var t: f32 = 0.0; var hit: Hit; hit.mat = 0;
  for (var i = 0; i < MAX_STEPS; i++) {
    let p = ro + rd * t; let h = map(p, time);
    if (h.dist < SURF_DIST) { hit = h; break; }
    if (t > MAX_DIST) { break; }
    t += h.dist * 0.8;
  }
  
  if (hit.mat > 0) {
    let p = ro + rd * t; let n = calcNormal(p, time);
    var mc = vec3f(0.5);
    if (hit.mat == 1) { mc = getPlanetColor(p, time); }
    else if (hit.mat == 2) { mc = vec3f(0.5, 0.5, 0.55) * fbm(n * 8.0); }
    
    let diff = max(dot(n, sunDir), 0.0);
    let vd = normalize(ro - p);
    let hd = normalize(sunDir + vd);
    let spec = pow(max(dot(n, hd), 0.0), 32.0);
    let fres = pow(1.0 - max(dot(vd, n), 0.0), 4.0);
    
    var sc = vec3f(0.02, 0.03, 0.05) * mc + mc * vec3f(1.0, 0.95, 0.9) * diff + vec3f(1.0, 0.9, 0.8) * spec * 0.3;
    if (hit.mat == 1) { sc += vec3f(0.3, 0.5, 1.0) * fres * 0.5; }
    col = sc;
  } else {
    col += atmosphere(ro, rd);
  }
  
  col = col / (col + vec3f(1.0));
  col = pow(col, vec3f(0.95, 1.0, 1.05));
  col = pow(col, vec3f(1.0 / 2.2));
  col *= 1.0 - 0.3 * length(uv);
  return vec4f(col, 1.0);
}
`);

function frame() {
  alienPlanet.draw();
  requestAnimationFrame(frame);
}
frame();
```
