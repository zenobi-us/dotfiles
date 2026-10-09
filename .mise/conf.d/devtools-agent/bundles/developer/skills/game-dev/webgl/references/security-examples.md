# WebGL Security Examples

## Context Loss Recovery

### Full Recovery Pattern

```typescript
class WebGLRenderer {
  private gl: WebGL2RenderingContext | null = null
  private resources: Map<string, WebGLObject> = new Map()

  constructor(private canvas: HTMLCanvasElement) {
    this.setupContextHandlers()
    this.initialize()
  }

  private setupContextHandlers() {
    this.canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault()
      this.gl = null
      this.resources.clear()
      this.onContextLost()
    })

    this.canvas.addEventListener('webglcontextrestored', () => {
      this.initialize()
      this.onContextRestored()
    })
  }

  private initialize() {
    this.gl = this.canvas.getContext('webgl2')
    if (this.gl) {
      this.createResources()
    }
  }

  protected onContextLost() {
    console.warn('WebGL context lost - rendering paused')
  }

  protected onContextRestored() {
    console.info('WebGL context restored - resuming')
  }
}
```

## Resource Exhaustion Protection

### Memory Tracking

```typescript
class GPUMemoryTracker {
  private usage = {
    textures: 0,
    buffers: 0,
    total: 0
  }

  private readonly limits = {
    textures: 128 * 1024 * 1024,  // 128MB
    buffers: 64 * 1024 * 1024,    // 64MB
    total: 256 * 1024 * 1024      // 256MB
  }

  allocateTexture(width: number, height: number, format: string): boolean {
    const size = this.calculateTextureSize(width, height, format)

    if (this.usage.textures + size > this.limits.textures) {
      console.error('Texture memory limit exceeded')
      return false
    }

    if (this.usage.total + size > this.limits.total) {
      console.error('Total GPU memory limit exceeded')
      return false
    }

    this.usage.textures += size
    this.usage.total += size
    return true
  }

  private calculateTextureSize(width: number, height: number, format: string): number {
    const bytesPerPixel = format === 'RGBA16F' ? 8 : 4
    return width * height * bytesPerPixel
  }
}
```

## Shader Security

### Input Sanitization for Shaders

```typescript
// Prevent shader injection
function validateShaderSource(source: string): boolean {
  // Check for suspicious patterns
  const suspicious = [
    /discard\s*;/i,  // May cause GPU hangs
    /while\s*\(\s*true\s*\)/i,  // Infinite loops
    /for\s*\([^;]*;\s*;\s*[^)]*\)/i  // Infinite loops
  ]

  for (const pattern of suspicious) {
    if (pattern.test(source)) {
      console.warn('Suspicious shader pattern detected')
      return false
    }
  }

  return true
}
```
