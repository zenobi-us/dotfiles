# GLSL Types Reference

Complete reference for GLSL data types and operations.

## Scalar Types

| Type | Description | Range/Notes |
|------|-------------|-------------|
| `bool` | Boolean | `true` or `false` |
| `int` | Signed integer | At least 16-bit |
| `uint` | Unsigned integer | GLSL 1.3+ |
| `float` | Floating point | IEEE 754 single precision |

```glsl
bool b = true;
int i = 42;
uint u = 42u;
float f = 3.14;
float f2 = 3.;   // Shorthand
float f3 = .5;   // Shorthand
```

## Vector Types

| Type | Components | Description |
|------|------------|-------------|
| `vec2`, `vec3`, `vec4` | 2, 3, 4 | Float vectors |
| `ivec2`, `ivec3`, `ivec4` | 2, 3, 4 | Integer vectors |
| `uvec2`, `uvec3`, `uvec4` | 2, 3, 4 | Unsigned integer vectors |
| `bvec2`, `bvec3`, `bvec4` | 2, 3, 4 | Boolean vectors |

### Construction

```glsl
// Direct
vec2 v2 = vec2(1.0, 2.0);
vec3 v3 = vec3(1.0, 2.0, 3.0);
vec4 v4 = vec4(1.0, 2.0, 3.0, 4.0);

// Scalar broadcast
vec3 gray = vec3(0.5);  // (0.5, 0.5, 0.5)

// From smaller vectors
vec4 v = vec4(v2, 0.0, 1.0);      // (v2.x, v2.y, 0.0, 1.0)
vec4 v = vec4(v3, 1.0);           // (v3.x, v3.y, v3.z, 1.0)
vec4 v = vec4(v2.x, v3);          // Error! Can't mix like this

// From larger vectors
vec2 v2 = v4.xy;
vec3 v3 = v4.xyz;
```

### Swizzling

Access components with `.xyzw`, `.rgba`, or `.stpq`:

```glsl
vec4 v = vec4(1.0, 2.0, 3.0, 4.0);

// Single component
float x = v.x;    // 1.0
float r = v.r;    // 1.0 (same as .x)
float s = v.s;    // 1.0 (same as .x)

// Multiple components
vec2 xy = v.xy;   // (1.0, 2.0)
vec3 rgb = v.rgb; // (1.0, 2.0, 3.0)

// Reorder
vec2 yx = v.yx;   // (2.0, 1.0)
vec4 wzyx = v.wzyx; // (4.0, 3.0, 2.0, 1.0)

// Repeat
vec3 xxx = v.xxx; // (1.0, 1.0, 1.0)
vec4 rrrr = v.rrrr; // (1.0, 1.0, 1.0, 1.0)

// Write swizzle
v.xy = vec2(5.0, 6.0);
v.zw = v.xy;
```

**Rules:**
- Cannot mix swizzle sets: `v.xg` is invalid
- Cannot repeat in write: `v.xx = ...` is invalid

## Matrix Types

| Type | Size | Description |
|------|------|-------------|
| `mat2`, `mat2x2` | 2×2 | 2 columns, 2 rows |
| `mat3`, `mat3x3` | 3×3 | 3 columns, 3 rows |
| `mat4`, `mat4x4` | 4×4 | 4 columns, 4 rows |
| `mat2x3` | 2×3 | 2 columns, 3 rows |
| `mat2x4` | 2×4 | 2 columns, 4 rows |
| `mat3x2` | 3×2 | 3 columns, 2 rows |
| `mat3x4` | 3×4 | 3 columns, 4 rows |
| `mat4x2` | 4×2 | 4 columns, 2 rows |
| `mat4x3` | 4×3 | 4 columns, 3 rows |

### Construction

```glsl
// From scalars (column-major order!)
mat2 m = mat2(
  1.0, 2.0,   // Column 0
  3.0, 4.0    // Column 1
);
// Results in:
// | 1  3 |
// | 2  4 |

// Identity
mat3 identity = mat3(1.0);

// From vectors (columns)
vec2 col0 = vec2(1.0, 2.0);
vec2 col1 = vec2(3.0, 4.0);
mat2 m = mat2(col0, col1);

// From larger matrix (truncate)
mat3 m3 = mat3(m4);
```

### Access

```glsl
mat4 m;

// Column access (returns vector)
vec4 col0 = m[0];
vec4 col2 = m[2];

// Element access
float val = m[1][2];  // Column 1, Row 2
float val = m[1].z;   // Same thing
```

## Sampler Types

| Type | Description |
|------|-------------|
| `sampler2D` | 2D texture |
| `sampler3D` | 3D texture |
| `samplerCube` | Cube map |
| `sampler2DShadow` | 2D depth texture |
| `samplerCubeShadow` | Cube depth texture |
| `sampler2DArray` | 2D texture array |

```glsl
uniform sampler2D uTexture;

// Sampling
vec4 color = texture2D(uTexture, uv);
vec4 color = texture(uTexture, uv);  // GLSL 1.3+
```

## Type Conversion

### Implicit Conversion

Limited in GLSL:
- `int` → `float` (sometimes)
- `int` → `uint`

### Explicit Conversion (Constructors)

```glsl
float f = float(i);
int i = int(f);  // Truncates
vec3 v = vec3(ivec3(1, 2, 3));
```

## Operators

### Arithmetic

```glsl
// Scalar
float a = 1.0 + 2.0;
float b = 3.0 - 1.0;
float c = 2.0 * 3.0;
float d = 6.0 / 2.0;

// Vector (component-wise)
vec3 v = vec3(1.0) + vec3(2.0);  // (3.0, 3.0, 3.0)
vec3 v = vec3(1.0, 2.0, 3.0) * vec3(2.0, 2.0, 2.0);  // (2.0, 4.0, 6.0)

// Scalar * Vector
vec3 v = 2.0 * vec3(1.0, 2.0, 3.0);  // (2.0, 4.0, 6.0)

// Matrix * Vector
vec4 v = mat4(...) * vec4(...);  // Transform

// Matrix * Matrix
mat4 m = mat4(...) * mat4(...);  // Combine transforms
```

### Comparison

```glsl
// Scalar (returns bool)
bool b = a < b;
bool b = a <= b;
bool b = a > b;
bool b = a >= b;
bool b = a == b;
bool b = a != b;

// Vector (returns bvec, component-wise)
bvec3 b = lessThan(v1, v2);
bvec3 b = lessThanEqual(v1, v2);
bvec3 b = greaterThan(v1, v2);
bvec3 b = greaterThanEqual(v1, v2);
bvec3 b = equal(v1, v2);
bvec3 b = notEqual(v1, v2);

// Aggregate
bool anyTrue = any(bvec);
bool allTrue = all(bvec);
bvec not = not(bvec);
```

### Logical

```glsl
bool b = a && b;  // AND
bool b = a || b;  // OR
bool b = !a;      // NOT
bool b = a ^^ b;  // XOR
```

### Bitwise (GLSL 1.3+)

```glsl
int a = i & j;   // AND
int a = i | j;   // OR
int a = i ^ j;   // XOR
int a = ~i;      // NOT
int a = i << 2;  // Left shift
int a = i >> 2;  // Right shift
```

## Precision Qualifiers

```glsl
// Fragment shader (required in ES)
precision highp float;
precision mediump float;
precision lowp float;

// Per-variable
highp float f;
mediump vec3 v;
lowp int i;
```

| Qualifier | Float Range | Float Precision | Int Range |
|-----------|-------------|-----------------|-----------|
| `highp` | ±2^62 | 2^-16 relative | ±2^16 |
| `mediump` | ±2^14 | 2^-10 relative | ±2^10 |
| `lowp` | ±2 | 2^-8 absolute | ±2^8 |

## Arrays

```glsl
// Fixed size
float arr[4];
vec3 positions[10];

// Access
float val = arr[0];
arr[2] = 3.14;

// Initialize
float arr[3] = float[3](1.0, 2.0, 3.0);
float arr[] = float[](1.0, 2.0, 3.0);  // Size inferred

// Length
int len = arr.length();  // GLSL 1.2+
```

## Structs

```glsl
struct Light {
  vec3 position;
  vec3 color;
  float intensity;
};

Light light;
light.position = vec3(1.0, 2.0, 3.0);
light.color = vec3(1.0);
light.intensity = 1.0;

// Initialize
Light light = Light(vec3(0.0), vec3(1.0), 1.0);

// Arrays of structs
Light lights[4];
```
