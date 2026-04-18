# Triangle Particles

GPU-driven particle system with SDF-based physics. 30,000 particles spawn on triangle edges and flow along a signed distance field with chromatic aberration postprocessing.

```typescript
import { gpu } from "ralph-gpu";

const canvas = document.getElementById('canvas');
const ctx = await gpu.init(canvas, { autoResize: true, dpr: 2 });

// ============================================================================
// Constants
// ============================================================================

const NUM_PARTICLES = 30000;
const MAX_LIFETIME = 8;
const TRIANGLE_RADIUS = 2;
const VELOCITY_SCALE = 0.04;
const POSITION_JITTER = 0.03;
const INITIAL_VELOCITY_JITTER = 0.4;
const SDF_EPSILON = 0.01;
const FORCE_STRENGTH = 0.13;
const VELOCITY_DAMPING = 0.995;
const RESPAWN_VELOCITY_JITTER = INITIAL_VELOCITY_JITTER;
const SDF_UPDATE_INTERVAL = 0.6;
const SHOOT_LINE_WIDTH = 0.3;
const POINT_SIZE = 0.3;
const FADE_IN_DURATION = MAX_LIFETIME * 0.1;
const FADE_DURATION = MAX_LIFETIME * 1.4;
const PARTICLE_OFFSET_Y = -0.95;
const CHROMATIC_MAX_OFFSET = 0.02;
const CHROMATIC_ANGLE = -23;

// ============================================================================
// Shared WGSL Code
// ============================================================================

const SDF_FUNCTIONS_WGSL = /* wgsl */ `
  fn hash(seed: f32) -> f32 {
    let s = fract(seed * 0.1031);
    let s2 = s * (s + 33.33);
    return fract(s2 * (s2 + s2));
  }

  fn noise3d(p: vec3f) -> f32 {
    let i = floor(p);
    let f = fract(p);
    let u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i.x + i.y * 57.0 + i.z * 113.0),
          hash(i.x + 1.0 + i.y * 57.0 + i.z * 113.0), u.x),
      mix(hash(i.x + (i.y + 1.0) * 57.0 + i.z * 113.0),
          hash(i.x + 1.0 + (i.y + 1.0) * 57.0 + i.z * 113.0), u.x),
      u.y
    );
  }

  fn triangleSdf(p: vec2f, r: f32) -> f32 {
    let k = sqrt(3.0);
    var px = abs(p.x) - r;
    var py = p.y + r / k;
    if (px + k * py > 0.0) {
      let newPx = (px - k * py) / 2.0;
      let newPy = (-k * px - py) / 2.0;
      px = newPx;
      py = newPy;
    }
    px -= clamp(px, -2.0 * r, 0.0);
    let len = sqrt(px * px + py * py);
    return -len * sign(py);
  }

  fn animatedSdf(p: vec2f, r: f32, time: f32) -> f32 {
    let sdf = triangleSdf(p, r + 0.7) - 0.1;
    let noiseSampleScale = 1.;
    let noisePos = vec3f(p.x * noiseSampleScale, p.y * noiseSampleScale - time * 0.1, sin(time * 1.) * 0.5 + .5);
    let noiseSample = noise3d(noisePos) * 2.;
    var noiseScale = step(sdf, 0.) * (1. - u.focused);
    noiseScale = noiseScale * pow(clamp(1. - sdf * 0.1 - 0.2, 0., 1.), 0.5);
    return sdf;
  }
`;

const BLUR_CALCULATION_WGSL = /* wgsl */ `
  fn calculateBlurSize(uv: vec2f, maxBlurSize: f32, angleRadians: f32) -> f32 {
    let centered = uv - 0.5;
    let cosA = cos(angleRadians);
    let sinA = sin(angleRadians);
    let rotatedX = centered.x * cosA - centered.y * sinA;
    let blurFactor = clamp(abs(rotatedX) * 2.0, 0.0, 1.0);
    return blurFactor * maxBlurSize;
  }
  
  fn getBlurNormalized(uv: vec2f, maxBlurSize: f32, angleRadians: f32) -> f32 {
    let blurSize = calculateBlurSize(uv, maxBlurSize, angleRadians);
    return blurSize / maxBlurSize;
  }
`;

// ============================================================================
// Helper: Random point on triangle edge
// ============================================================================

function randomPointOnTriangleEdge(radius) {
  const edge = Math.floor(Math.random() * 3);
  const t = Math.random();
  const k = Math.sqrt(3.0);
  const vertices = [
    [0, (2 * radius) / k],
    [-radius, -radius / k],
    [radius, -radius / k],
  ];
  const v1 = vertices[edge];
  const v2 = vertices[(edge + 1) % 3];
  return [v1[0] + (v2[0] - v1[0]) * t, v1[1] + (v2[1] - v1[1]) * t];
}

// ============================================================================
// Mouse tracking
// ============================================================================

let mousePosition = { x: 0, y: 0 };
let mouseForce = 0.5;
let mouseRadius = 1.0;

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const normalizedX = (e.clientX - rect.left) / rect.width;
  const normalizedY = (e.clientY - rect.top) / rect.height;
  const clipX = normalizedX * 2 - 1;
  const clipY = -(normalizedY * 2 - 1);
  const aspect = rect.width / rect.height;
  mousePosition.x = clipX * aspect * 5;
  mousePosition.y = clipY * 5 - PARTICLE_OFFSET_Y;
});

// ============================================================================
// Initialize particle data
// ============================================================================

const positionArray = new Float32Array(NUM_PARTICLES * 2);
const originalPositionArray = new Float32Array(NUM_PARTICLES * 2);
const velocityArrayA = new Float32Array(NUM_PARTICLES * 2);
const velocityArrayB = new Float32Array(NUM_PARTICLES * 2);
const lifetimeArray = new Float32Array(NUM_PARTICLES);

for (let i = 0; i < NUM_PARTICLES; i++) {
  const [x, y] = randomPointOnTriangleEdge(TRIANGLE_RADIUS * 1.2);
  const offsetX = (Math.random() - 0.5) * POSITION_JITTER;
  const offsetY = (Math.random() - 0.5) * POSITION_JITTER;
  
  positionArray[i * 2] = x + offsetX;
  positionArray[i * 2 + 1] = y + offsetY;
  originalPositionArray[i * 2] = x + offsetX;
  originalPositionArray[i * 2 + 1] = y + offsetY;
  lifetimeArray[i] = Math.random() * MAX_LIFETIME;
  velocityArrayA[i * 2] = (Math.random() - 0.5) * INITIAL_VELOCITY_JITTER;
  velocityArrayA[i * 2 + 1] = (Math.random() - 0.5) * INITIAL_VELOCITY_JITTER;
  velocityArrayB[i * 2] = velocityArrayA[i * 2];
  velocityArrayB[i * 2 + 1] = velocityArrayA[i * 2 + 1];
}

// Create storage buffers
const positionBuffer = ctx.storage(NUM_PARTICLES * 2 * 4);
const originalPositionBuffer = ctx.storage(NUM_PARTICLES * 2 * 4);
const velocityBufferA = ctx.storage(NUM_PARTICLES * 2 * 4);
const velocityBufferB = ctx.storage(NUM_PARTICLES * 2 * 4);
const lifetimeBuffer = ctx.storage(NUM_PARTICLES * 4);

positionBuffer.write(positionArray);
originalPositionBuffer.write(originalPositionArray);
velocityBufferA.write(velocityArrayA);
velocityBufferB.write(velocityArrayB);
lifetimeBuffer.write(lifetimeArray);

// ============================================================================
// Create SDF and gradient targets
// ============================================================================

const sdfTarget = ctx.target(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), { format: "r16float" });
const gradientTarget = ctx.target(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), { format: "rg16float" });

// Create samplers
const sdfNearestSampler = ctx.createSampler({ magFilter: "nearest", minFilter: "nearest", addressModeU: "clamp-to-edge", addressModeV: "clamp-to-edge" });
const gradientSampler = ctx.createSampler({ magFilter: "nearest", minFilter: "nearest", addressModeU: "clamp-to-edge", addressModeV: "clamp-to-edge" });
const blurSampler = ctx.createSampler({ magFilter: "nearest", minFilter: "nearest", addressModeU: "clamp-to-edge", addressModeV: "clamp-to-edge" });

// ============================================================================
// Compute shader
// ============================================================================

const computeShaderCode = /* wgsl */ `
  struct ComputeUniforms {
    deltaTime: f32,
    time: f32,
    focused: f32,
    triangleRadius: f32,
    forceStrength: f32,
    velocityDamping: f32,
    velocityScale: f32,
    maxLifetime: f32,
    offsetY: f32,
    mouseX: f32,
    mouseY: f32,
    mouseDirX: f32,
    mouseDirY: f32,
    mouseForce: f32,
    mouseRadius: f32,
  }
  @group(1) @binding(0) var<uniform> u: ComputeUniforms;
  @group(1) @binding(1) var gradientTexture: texture_2d<f32>;
  @group(1) @binding(2) var gradientSampler: sampler;
  @group(1) @binding(3) var<storage, read_write> positions: array<vec2f>;
  @group(1) @binding(4) var<storage, read> originalPositions: array<vec2f>;
  @group(1) @binding(5) var<storage, read> velocityRead: array<vec2f>;
  @group(1) @binding(6) var<storage, read_write> velocityWrite: array<vec2f>;
  @group(1) @binding(7) var<storage, read_write> lifetimes: array<f32>;

  fn hash(seed: f32) -> f32 {
    let s = fract(seed * 0.1031);
    let s2 = s * (s + 33.33);
    return fract(s2 * (s2 + s2));
  }

  fn randomSigned(seed: f32) -> f32 {
    return hash(seed) * 2.0 - 1.0;
  }

  fn worldToUV(worldPos: vec2f) -> vec2f {
    let ndc = worldPos / vec2f(globals.aspect * 5.0, 5.0);
    let uv = ndc * vec2f(0.5, -0.5) + 0.5;
    return uv;
  }

  fn sampleGradient(worldPos: vec2f) -> vec3f {
    let adjustedPos = worldPos + vec2f(0.0, u.offsetY);
    let uv = worldToUV(adjustedPos);
    let sample = textureSampleLevel(gradientTexture, gradientSampler, uv, 0.0);
    let sdfSign = sign(sample.b - 0.5);
    return vec3f(sample.r, sample.g, sdfSign);
  }

  @compute @workgroup_size(64, 1, 1)
  fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let index = id.x;
    if (index >= arrayLength(&positions)) { return; }
    
    var pos = positions[index];
    var vel = velocityRead[index];
    var life = lifetimes[index];

    let gradientData = sampleGradient(pos);
    let gradient = vec2f(gradientData.x, gradientData.y);
    let sdfSign = gradientData.z;

    let force = gradient * u.forceStrength * sdfSign;
    vel *= u.velocityDamping;
    vel += force;

    let mousePos = vec2f(u.mouseX, u.mouseY);
    let mouseDir = vec2f(u.mouseDirX, u.mouseDirY);
    let toMouse = mousePos - pos;
    let distToMouse = length(toMouse);
    
    if (distToMouse < u.mouseRadius && distToMouse > 0.01) {
      let falloff = 1.0 - (distToMouse / u.mouseRadius);
      let pushForce = mouseDir * u.mouseForce * falloff * falloff;
      vel += pushForce;
    }

    pos += vel * u.deltaTime * u.velocityScale;
    life += u.deltaTime;

    if (life > u.maxLifetime) {
      pos = originalPositions[index];
      let seedX = f32(index) + u.time * 1000.0;
      let seedY = f32(index) + u.time * 1000.0 + 12345.0;
      vel = vec2f(
        randomSigned(seedX) * ${RESPAWN_VELOCITY_JITTER},
        randomSigned(seedY) * ${RESPAWN_VELOCITY_JITTER}
      );
      life = 0.0;
    }

    positions[index] = pos;
    velocityWrite[index] = vel;
    lifetimes[index] = life;
  }
`;

const computeUniforms = {
  deltaTime: { value: 0.016 },
  time: { value: 0.0 },
  focused: { value: 0.0 },
  triangleRadius: { value: TRIANGLE_RADIUS },
  forceStrength: { value: FORCE_STRENGTH },
  velocityDamping: { value: VELOCITY_DAMPING },
  velocityScale: { value: VELOCITY_SCALE },
  maxLifetime: { value: MAX_LIFETIME },
  offsetY: { value: PARTICLE_OFFSET_Y },
  mouseX: { value: 0.0 },
  mouseY: { value: 0.0 },
  mouseDirX: { value: 0.0 },
  mouseDirY: { value: 0.0 },
  mouseForce: { value: 0.5 },
  mouseRadius: { value: 1.0 },
  gradientTexture: { value: gradientTarget.texture },
  gradientSampler: { value: gradientSampler },
};

const computeAtoB = ctx.compute(computeShaderCode, { uniforms: { ...computeUniforms } });
computeAtoB.storage("positions", positionBuffer);
computeAtoB.storage("originalPositions", originalPositionBuffer);
computeAtoB.storage("velocityRead", velocityBufferA);
computeAtoB.storage("velocityWrite", velocityBufferB);
computeAtoB.storage("lifetimes", lifetimeBuffer);

const computeBtoA = ctx.compute(computeShaderCode, { uniforms: { ...computeUniforms } });
computeBtoA.storage("positions", positionBuffer);
computeBtoA.storage("originalPositions", originalPositionBuffer);
computeBtoA.storage("velocityRead", velocityBufferB);
computeBtoA.storage("velocityWrite", velocityBufferA);
computeBtoA.storage("lifetimes", lifetimeBuffer);

// ============================================================================
// Particle rendering material
// ============================================================================

const particleShaderCode = /* wgsl */ `
  struct RenderUniforms {
    offsetY: f32,
    pointSize: f32,
    fadeInEnd: f32,
    fadeStart: f32,
    fadeEnd: f32,
    triangleRadius: f32,
    bumpIntensity: f32,
    bumpProgress: f32,
    maxBlurSize: f32,
    blurAngle: f32,
    postprocessingEnabled: f32,
    particleColor: vec3f,
  }
  @group(1) @binding(0) var<uniform> u: RenderUniforms;
  @group(1) @binding(1) var<storage, read> positions: array<vec2f>;
  @group(1) @binding(2) var<storage, read> lifetimes: array<f32>;

  struct VertexOutput {
    @builtin(position) pos: vec4f,
    @location(0) uv: vec2f,
    @location(1) @interpolate(flat) life: f32,
    @location(2) @interpolate(flat) sdfDist: f32,
  }

  ${BLUR_CALCULATION_WGSL}

  fn triangleSdf(p: vec2f, r: f32) -> f32 {
    let k = sqrt(3.0);
    var px = abs(p.x) - r;
    var py = p.y + r / k;
    if (px + k * py > 0.0) {
      let newPx = (px - k * py) / 2.0;
      let newPy = (-k * px - py) / 2.0;
      px = newPx;
      py = newPy;
    }
    px -= clamp(px, -2.0 * r, 0.0);
    let len = sqrt(px * px + py * py);
    return -len * sign(py) - 0.7;
  }

  @vertex
  fn vs_main(
    @builtin(vertex_index) vid: u32,
    @builtin(instance_index) iid: u32
  ) -> VertexOutput {
    let pos2d = positions[iid];
    let life = lifetimes[iid];
    let sdf = triangleSdf(pos2d, u.triangleRadius);

    var quad = array<vec2f, 6>(
      vec2f(-1, -1), vec2f(1, -1), vec2f(-1, 1),
      vec2f(-1, 1), vec2f(1, -1), vec2f(1, 1),
    );

    let quadPos = quad[vid];
    let aspect = globals.aspect;
    let worldPos = pos2d + vec2f(0.0, u.offsetY);
    let clipPos = worldPos / vec2f(aspect * 5.0, 5.0);
    let screenUV = clipPos * vec2f(0.5, -0.5) + 0.5;
    let blurFactor = getBlurNormalized(screenUV, u.maxBlurSize, u.blurAngle);
    let sizeMultiplier = select(1.0, 1.0 + blurFactor, u.postprocessingEnabled > 0.5);
    let particleSize = u.pointSize * 0.01 * sizeMultiplier;
    let localPos = quadPos * vec2f(particleSize / aspect, particleSize);
    let finalClipPos = clipPos + localPos;

    var out: VertexOutput;
    out.pos = vec4f(finalClipPos, 0.0, 1.0);
    out.uv = quadPos * 0.5 + 0.5;
    out.life = life;
    out.sdfDist = abs(sdf);
    return out;
  }

  @fragment
  fn fs_main(in: VertexOutput) -> @location(0) vec4f {
    let d = length(in.uv - 0.5);
    if (d > 0.5) { discard; }
    
    let edgeSoftness = smoothstep(0.5, 0.3, d);
    let fadeIn = smoothstep(0.0, u.fadeInEnd, in.life);
    let fadeOut = 1.0 - smoothstep(u.fadeStart, u.fadeEnd, in.life);
    let lifetimeOpacity = fadeIn * fadeOut;
    let bumpDist = abs(in.sdfDist - u.bumpProgress);
    let bumpEffect = smoothstep(0.7, 0.0, bumpDist) * u.bumpIntensity;
    let baseOpacity = 0.4;
    let finalOpacity = mix(baseOpacity, 1.0, bumpEffect);
    let alpha = lifetimeOpacity * finalOpacity * edgeSoftness;
    return vec4f(u.particleColor, alpha);
  }
`;

const renderUniforms = {
  offsetY: { value: PARTICLE_OFFSET_Y },
  pointSize: { value: POINT_SIZE },
  fadeInEnd: { value: FADE_IN_DURATION },
  fadeStart: { value: MAX_LIFETIME - FADE_DURATION },
  fadeEnd: { value: MAX_LIFETIME },
  triangleRadius: { value: TRIANGLE_RADIUS },
  bumpIntensity: { value: 0.0 },
  bumpProgress: { value: 0.0 },
  maxBlurSize: { value: CHROMATIC_MAX_OFFSET },
  blurAngle: { value: (CHROMATIC_ANGLE * Math.PI) / 180 },
  postprocessingEnabled: { value: 1.0 },
  particleColor: { value: [1.0, 1.0, 1.0] },
};

const particleMaterial = ctx.material(particleShaderCode, {
  vertexCount: 6,
  instances: NUM_PARTICLES,
  blend: "additive",
  uniforms: renderUniforms,
});
particleMaterial.storage("positions", positionBuffer);
particleMaterial.storage("lifetimes", lifetimeBuffer);

// ============================================================================
// SDF pass
// ============================================================================

const sdfUniforms = {
  time: { value: 0.0 },
  triangleRadius: { value: TRIANGLE_RADIUS },
  focused: { value: 0.0 },
  offsetY: { value: PARTICLE_OFFSET_Y },
};

const sdfPass = ctx.pass(`
  struct SdfUniforms { time: f32, triangleRadius: f32, focused: f32, offsetY: f32 }
  @group(1) @binding(0) var<uniform> u: SdfUniforms;

  ${SDF_FUNCTIONS_WGSL}

  @fragment
  fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let uv = pos.xy / globals.resolution;
    let centered = uv * vec2f(2.0, -2.0) + vec2f(-1.0, 1.0);
    let worldPos = centered * vec2f(globals.aspect * 5.0, 5.0) - vec2f(0.0, u.offsetY);
    let sdf = animatedSdf(worldPos, u.triangleRadius, u.time);
    return vec4f(sdf, 0.0, 0.0, 1.0);
  }
`, { uniforms: sdfUniforms });

// ============================================================================
// Gradient pass
// ============================================================================

const gradientUniforms = {
  sdfEpsilon: { value: SDF_EPSILON },
  triangleRadius: { value: TRIANGLE_RADIUS },
  shootLineStrength: { value: 1.0 },
  shootLineWidth: { value: SHOOT_LINE_WIDTH },
  offsetY: { value: PARTICLE_OFFSET_Y },
  sdfTexture: { value: sdfTarget.texture },
  sdfSampler: { value: sdfNearestSampler },
};

const gradientPass = ctx.pass(`
  struct GradientUniforms {
    sdfEpsilon: f32,
    triangleRadius: f32,
    shootLineStrength: f32,
    shootLineWidth: f32,
    offsetY: f32,
  }
  @group(1) @binding(0) var<uniform> u: GradientUniforms;
  @group(1) @binding(1) var sdfTexture: texture_2d<f32>;
  @group(1) @binding(2) var sdfSampler: sampler;

  fn distToLineSegment(p: vec2f, a: vec2f, b: vec2f) -> f32 {
    let pa = p - a;
    let ba = b - a;
    let t = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * t);
  }

  fn projectOnLine(p: vec2f, a: vec2f, b: vec2f) -> f32 {
    let pa = p - a;
    let ba = b - a;
    return dot(pa, ba) / dot(ba, ba);
  }

  @fragment
  fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let texSize = vec2f(textureDimensions(sdfTexture));
    let pixelSize = 1.0 / texSize;
    let uv = pos.xy / globals.resolution;
    let centered = uv * vec2f(2.0, -2.0) + vec2f(-1.0, 1.0);
    let worldPos = centered * vec2f(globals.aspect * 5.0, 5.0) - vec2f(0.0, u.offsetY);
    
    let sdfCenter = textureSample(sdfTexture, sdfSampler, uv).r;
    let worldToUvScaleX = 0.5 / (globals.aspect * 5.0);
    let worldToUvScaleY = 0.5 / 5.0;
    let uvEpsilonX = u.sdfEpsilon * worldToUvScaleX;
    let uvEpsilonY = u.sdfEpsilon * worldToUvScaleY;
    
    let sdfRight = textureSample(sdfTexture, sdfSampler, uv + vec2f(uvEpsilonX, 0.0)).r;
    let sdfTop = textureSample(sdfTexture, sdfSampler, uv + vec2f(0.0, -uvEpsilonY)).r;
    
    let sdfSign = sign(sdfCenter);
    var gradX = (sdfRight - sdfCenter) / u.sdfEpsilon;
    gradX *= -sdfSign;
    var gradY = (sdfTop - sdfCenter) / u.sdfEpsilon;
    gradY *= -sdfSign;
    
    let k = sqrt(3.0);
    let r = u.triangleRadius + 0.7;
    let triangleCenter = vec2f(0.0, 0.0);
    let bottomRightVertex = vec2f(r, -r / k);
    let toVertex = normalize(bottomRightVertex - triangleCenter);
    let lineStart = triangleCenter - toVertex * 20.0;
    let lineEnd = triangleCenter + toVertex * 20.0;
    let distToLine = distToLineSegment(worldPos, lineStart, lineEnd);
    let t = projectOnLine(worldPos, triangleCenter, lineEnd);
    let shootDir = -select(-toVertex, toVertex, t > 0.12);
    let lineInfluence = smoothstep(u.shootLineWidth, 0.0, distToLine) * u.shootLineStrength;
    
    gradX = mix(gradX, shootDir.x * 3.0, lineInfluence);
    gradY = mix(gradY, shootDir.y * 3.0, lineInfluence);
    
    var sdfSignEncoded = 0.5 + 0.5 * sign(sdfCenter);
    sdfSignEncoded = mix(sdfSignEncoded, 1.0, lineInfluence);
    
    return vec4f(gradX, gradY, sdfSignEncoded, 1.0);
  }
`, { uniforms: gradientUniforms });

// ============================================================================
// Postprocessing (chromatic aberration)
// ============================================================================

const renderTarget = ctx.target();

const chromaticUniforms = {
  inputTex: { value: renderTarget.texture },
  inputSampler: { value: blurSampler },
  maxOffset: { value: CHROMATIC_MAX_OFFSET },
  angle: { value: (CHROMATIC_ANGLE * Math.PI) / 180 },
  samples: { value: 8 },
  useZoom: { value: 0.0 },
};

const blurPass = ctx.pass(`
  struct ChromaticUniforms { maxOffset: f32, angle: f32, samples: f32, useZoom: f32 }
  @group(1) @binding(0) var<uniform> u: ChromaticUniforms;
  @group(1) @binding(1) var inputTex: texture_2d<f32>;
  @group(1) @binding(2) var inputSampler: sampler;

  ${BLUR_CALCULATION_WGSL}

  @fragment
  fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let uv = pos.xy / globals.resolution;
    let chromaticOffset = calculateBlurSize(uv, u.maxOffset, u.angle);
    let center = vec2f(0.5, 0.5);
    let fromCenter = uv - center;
    let fromCenterCorrected = vec2f(fromCenter.x * globals.aspect, fromCenter.y);
    let distFromCenter = length(fromCenterCorrected);
    let radialCorrected = select(vec2f(0.0, 1.0), fromCenterCorrected / distFromCenter, distFromCenter > 0.001);
    let tangentCorrected = vec2f(-radialCorrected.y, radialCorrected.x);
    let dirCorrected = select(tangentCorrected, radialCorrected, u.useZoom > 0.5);
    let sampleDir = vec2f(dirCorrected.x / globals.aspect, dirCorrected.y);
    
    let sampleCount = i32(u.samples);
    var r = 0.0;
    var g = 0.0;
    var b = 0.0;
    
    for (var i = 0; i < sampleCount; i++) {
      let t = (f32(i) + 0.5) / u.samples * 2.0 - 1.0;
      let sampleOffset = sampleDir * chromaticOffset * t;
      let sampleUV = uv + sampleOffset;
      let sampledColor = textureSample(inputTex, inputSampler, sampleUV).rgb;
      let redWeight = smoothstep(-1.0, 1.0, t);
      let blueWeight = smoothstep(1.0, -1.0, t);
      let greenWeight = 1.0 - abs(t);
      r += sampledColor.r * redWeight;
      g += sampledColor.g * greenWeight;
      b += sampledColor.b * blueWeight;
    }
    
    let totalWeight = u.samples * 0.5;
    r /= totalWeight;
    g /= totalWeight;
    b /= totalWeight;
    
    return vec4f(r, g, b, 1.0);
  }
`, { uniforms: chromaticUniforms });

// ============================================================================
// Animation loop
// ============================================================================

let pingPong = 0;
let lastTime = performance.now();
let totalTime = 0;
let lastSdfUpdateTime = 0;
let needsSdfUpdate = true;

let prevMouseX = 0;
let prevMouseY = 0;
let mouseVelocity = 0;
let mouseDirX = 0;
let mouseDirY = 0;

function frame() {
  const now = performance.now();
  const deltaTime = Math.min((now - lastTime) / 1000, 0.07);
  lastTime = now;
  totalTime += deltaTime;

  // Mouse velocity tracking
  const currentMouseX = mousePosition.x;
  const currentMouseY = mousePosition.y;
  const dx = currentMouseX - prevMouseX;
  const dy = currentMouseY - prevMouseY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (deltaTime > 0) {
    const speed = dist / deltaTime;
    mouseVelocity = mouseVelocity * 0.8 + speed * 0.2;
    if (dist > 0.001) {
      mouseDirX = mouseDirX * 0.8 + (dx / dist) * 0.2;
      mouseDirY = mouseDirY * 0.8 + (dy / dist) * 0.2;
    } else {
      mouseDirX *= 0.95;
      mouseDirY *= 0.95;
    }
  }
  prevMouseX = currentMouseX;
  prevMouseY = currentMouseY;

  // Update SDF texture periodically
  const timeSinceLastSdfUpdate = totalTime - lastSdfUpdateTime;
  if (needsSdfUpdate || timeSinceLastSdfUpdate >= SDF_UPDATE_INTERVAL) {
    sdfUniforms.time.value = totalTime;
    ctx.setTarget(sdfTarget);
    sdfPass.draw();
    ctx.setTarget(gradientTarget);
    gradientPass.draw();
    lastSdfUpdateTime = totalTime;
    needsSdfUpdate = false;
  }

  // Update compute uniforms
  computeUniforms.deltaTime.value = deltaTime;
  computeUniforms.time.value = totalTime;
  computeUniforms.mouseX.value = currentMouseX;
  computeUniforms.mouseY.value = currentMouseY;
  computeUniforms.mouseDirX.value = mouseDirX;
  computeUniforms.mouseDirY.value = mouseDirY;
  computeUniforms.mouseRadius.value = mouseRadius;
  
  const velocityFactor = Math.min(mouseVelocity / 50, 1);
  computeUniforms.mouseForce.value = mouseForce + velocityFactor * (50.0 - mouseForce);

  // Dispatch compute shader (ping-pong)
  if (pingPong === 0) {
    computeAtoB.dispatch(Math.ceil(NUM_PARTICLES / 64));
  } else {
    computeBtoA.dispatch(Math.ceil(NUM_PARTICLES / 64));
  }
  pingPong = 1 - pingPong;

  // Render particles to target, then apply postprocessing
  ctx.setTarget(renderTarget);
  ctx.autoClear = false;
  ctx.clear(renderTarget, [0, 0, 0, 1]);
  particleMaterial.draw();
  ctx.setTarget(null);
  blurPass.draw();
  ctx.autoClear = true;

  requestAnimationFrame(frame);
}
frame();
```
