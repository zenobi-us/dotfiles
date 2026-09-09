# WebGL Advanced Patterns

## Compute Shaders (WebGL 2.0)

### Transform Feedback

```typescript
// Use transform feedback for GPU-side computation
function setupTransformFeedback(gl: WebGL2RenderingContext) {
  const program = createTransformFeedbackProgram(gl)

  gl.transformFeedbackVaryings(
    program,
    ['vPosition', 'vVelocity'],
    gl.SEPARATE_ATTRIBS
  )
  gl.linkProgram(program)

  const transformFeedback = gl.createTransformFeedback()
  gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback)

  return { program, transformFeedback }
}
```

## Multi-Pass Rendering

### Deferred Shading

```typescript
// G-Buffer setup for deferred rendering
function createGBuffer(gl: WebGL2RenderingContext, width: number, height: number) {
  const framebuffer = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)

  // Position buffer
  const positionTexture = createTexture(gl, width, height, gl.RGBA16F)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, positionTexture, 0)

  // Normal buffer
  const normalTexture = createTexture(gl, width, height, gl.RGBA16F)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, normalTexture, 0)

  // Albedo buffer
  const albedoTexture = createTexture(gl, width, height, gl.RGBA8)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, gl.TEXTURE_2D, albedoTexture, 0)

  gl.drawBuffers([
    gl.COLOR_ATTACHMENT0,
    gl.COLOR_ATTACHMENT1,
    gl.COLOR_ATTACHMENT2
  ])

  return { framebuffer, positionTexture, normalTexture, albedoTexture }
}
```

## Instanced Rendering

### Dynamic Instance Updates

```typescript
function updateInstances(
  gl: WebGL2RenderingContext,
  instanceBuffer: WebGLBuffer,
  data: Float32Array
) {
  gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer)

  // Use bufferSubData for partial updates
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, data)

  // Set up instanced attributes
  gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 64, 0)   // matrix col 0
  gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 64, 16)  // matrix col 1
  gl.vertexAttribPointer(5, 4, gl.FLOAT, false, 64, 32)  // matrix col 2
  gl.vertexAttribPointer(6, 4, gl.FLOAT, false, 64, 48)  // matrix col 3

  gl.vertexAttribDivisor(3, 1)
  gl.vertexAttribDivisor(4, 1)
  gl.vertexAttribDivisor(5, 1)
  gl.vertexAttribDivisor(6, 1)
}
```
