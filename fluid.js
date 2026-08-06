// GPU fluid solver — incompressible Navier–Stokes, the Jos Stam "Stable Fluids"
// scheme, run entirely in fragment shaders.
//
// Per frame:
//   curl -> vorticity confinement -> advect velocity -> divergence
//   -> pressure (Jacobi, N iterations) -> subtract gradient -> advect dye
//
// This is not noise pretending to be fog. The cursor injects momentum into a
// velocity field; the ink is a dye carried by that field, so it keeps swirling
// after you stop moving, which is the thing a displaced noise texture can never
// do. Falls back to the fBm shader in background.js if the GPU cannot do
// float render targets.

const SIM_RES = 128        // velocity, pressure, divergence, curl
const DYE_RES = 1024       // the ink itself, kept sharper than the physics
const PRESSURE_ITERS = 20
const VELOCITY_DISSIPATION = 0.2
const DENSITY_DISSIPATION = 0.32
const CURL_STRENGTH = 26
const SPLAT_RADIUS = 0.0022

const BASE_VERT = `#version 300 es
precision highp float;
in vec2 aPosition;
out vec2 vUv;
out vec2 vL, vR, vT, vB;
uniform vec2 texelSize;
void main () {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`

const FRAG = {
  // Gaussian blob of colour and momentum at the pointer.
  splat: `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTarget;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
void main () {
  vec2 p = vUv - point;
  p.x *= aspectRatio;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  vec3 base = texture(uTarget, vUv).xyz;
  fragColor = vec4(base + splat, 1.0);
}`,

  // Semi-Lagrangian advection: trace backwards along the velocity field.
  advection: `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform float dt;
uniform float dissipation;
void main () {
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
  vec4 result = texture(uSource, coord);
  float decay = 1.0 + dissipation * dt;
  fragColor = result / decay;
}`,

  divergence: `#version 300 es
precision highp float;
in vec2 vUv; in vec2 vL, vR, vT, vB;
out vec4 fragColor;
uniform sampler2D uVelocity;
void main () {
  float L = texture(uVelocity, vL).x;
  float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y;
  float B = texture(uVelocity, vB).y;
  // Reflect at the walls so the fluid does not leak off-canvas.
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0)  { L = -C.x; }
  if (vR.x > 1.0)  { R = -C.x; }
  if (vT.y > 1.0)  { T = -C.y; }
  if (vB.y < 0.0)  { B = -C.y; }
  fragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`,

  curl: `#version 300 es
precision highp float;
in vec2 vUv; in vec2 vL, vR, vT, vB;
out vec4 fragColor;
uniform sampler2D uVelocity;
void main () {
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  fragColor = vec4(R - L - T + B, 0.0, 0.0, 1.0);
}`,

  // Vorticity confinement: feed energy back into the small eddies the grid
  // would otherwise smear away. This is what keeps the ink curling.
  vorticity: `#version 300 es
precision highp float;
in vec2 vUv; in vec2 vL, vR, vT, vB;
out vec4 fragColor;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curl;
uniform float dt;
void main () {
  float L = texture(uCurl, vL).x;
  float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x;
  float B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 vel = texture(uVelocity, vUv).xy;
  fragColor = vec4(clamp(vel + force * dt, -1000.0, 1000.0), 0.0, 1.0);
}`,

  pressure: `#version 300 es
precision highp float;
in vec2 vUv; in vec2 vL, vR, vT, vB;
out vec4 fragColor;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main () {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  float divergence = texture(uDivergence, vUv).x;
  fragColor = vec4((L + R + B + T - divergence) * 0.25, 0.0, 0.0, 1.0);
}`,

  gradientSubtract: `#version 300 es
precision highp float;
in vec2 vUv; in vec2 vL, vR, vT, vB;
out vec4 fragColor;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main () {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  vec2 velocity = texture(uVelocity, vUv).xy;
  velocity -= vec2(R - L, T - B);
  fragColor = vec4(velocity, 0.0, 1.0);
}`,

  clear: `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTexture;
uniform float value;
void main () { fragColor = value * texture(uTexture, vUv); }`,

  // Dye density -> paper/ink. The vertical ramp keeps the top of the frame
  // clean so the wordmark always has quiet paper behind it.
  display: `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTexture;
uniform float uTopFade;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main () {
  float d = texture(uTexture, vUv).r;
  float clean = smoothstep(uTopFade - 0.28, uTopFade + 0.42, vUv.y);
  d *= (1.0 - clean);
  d = clamp(d, 0.0, 1.0);
  d = pow(d, 0.85);
  vec3 paper = vec3(0.957, 0.945, 0.918);
  vec3 ink   = vec3(0.36, 0.35, 0.335);
  // 0.65, not higher. At 0.9 the densest ink drove the tagline to 1.4:1 — the
  // hero looked wonderful and could not be read. See INK_MIX in the tests.
  vec3 col = mix(paper, ink, d * 0.65);
  // A little grain so the gradients never band on a wide flat area.
  col += (hash(gl_FragCoord.xy) - 0.5) * 0.008;
  fragColor = vec4(col, 1.0);
}`,
}

function compile(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn('fluid shader:', gl.getShaderInfoLog(s))
    return null
  }
  return s
}

function program(gl, vertSrc, fragSrc) {
  const v = compile(gl, gl.VERTEX_SHADER, vertSrc)
  const f = compile(gl, gl.FRAGMENT_SHADER, fragSrc)
  if (!v || !f) return null
  const p = gl.createProgram()
  gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.warn('fluid link:', gl.getProgramInfoLog(p))
    return null
  }
  const uniforms = {}
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS)
  for (let i = 0; i < n; i++) {
    const name = gl.getActiveUniform(p, i).name
    uniforms[name] = gl.getUniformLocation(p, name)
  }
  return { program: p, uniforms }
}

function createFBO(gl, w, h, internal, format, type, filter) {
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, null)

  const fbo = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
  const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE
  gl.viewport(0, 0, w, h)
  gl.clear(gl.COLOR_BUFFER_BIT)
  if (!complete) return null

  return {
    texture, fbo, width: w, height: h,
    texelSizeX: 1 / w, texelSizeY: 1 / h,
    attach(id) {
      gl.activeTexture(gl.TEXTURE0 + id)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      return id
    },
  }
}

function createDoubleFBO(gl, w, h, internal, format, type, filter) {
  const a = createFBO(gl, w, h, internal, format, type, filter)
  const b = createFBO(gl, w, h, internal, format, type, filter)
  if (!a || !b) return null
  return {
    width: w, height: h, texelSizeX: a.texelSizeX, texelSizeY: a.texelSizeY,
    read: a, write: b,
    swap() { const t = this.read; this.read = this.write; this.write = t },
  }
}

export function initFluid(canvas, { reducedMotion = false } = {}) {
  if (!canvas) return { ok: false, reason: 'no canvas' }

  const gl = canvas.getContext('webgl2', {
    alpha: false, antialias: false, depth: false, stencil: false,
    preserveDrawingBuffer: false, powerPreference: 'high-performance',
  })
  if (!gl) return { ok: false, reason: 'no webgl2' }
  if (!gl.getExtension('EXT_color_buffer_float')) {
    return { ok: false, reason: 'no float render targets' }
  }
  const linearOk = !!gl.getExtension('OES_texture_float_linear')
  const filter = linearOk ? gl.LINEAR : gl.NEAREST

  // Full-screen quad.
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW)
  const elems = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elems)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(0)

  const progs = {}
  for (const [name, src] of Object.entries(FRAG)) {
    const p = program(gl, BASE_VERT, src)
    if (!p) return { ok: false, reason: `shader ${name} failed` }
    progs[name] = p
  }

  const blit = (target) => {
    if (target) {
      gl.viewport(0, 0, target.width, target.height)
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo)
    } else {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)
  }

  const RGBA16F = gl.RGBA16F, RG16F = gl.RG16F, R16F = gl.R16F
  const HALF = gl.HALF_FLOAT

  const dye = createDoubleFBO(gl, DYE_RES, DYE_RES, RGBA16F, gl.RGBA, HALF, filter)
  const velocity = createDoubleFBO(gl, SIM_RES, SIM_RES, RG16F, gl.RG, HALF, filter)
  const divergence = createFBO(gl, SIM_RES, SIM_RES, R16F, gl.RED, HALF, gl.NEAREST)
  const curlFbo = createFBO(gl, SIM_RES, SIM_RES, R16F, gl.RED, HALF, gl.NEAREST)
  const pressure = createDoubleFBO(gl, SIM_RES, SIM_RES, R16F, gl.RED, HALF, gl.NEAREST)
  if (!dye || !velocity || !divergence || !curlFbo || !pressure) {
    return { ok: false, reason: 'framebuffer incomplete' }
  }

  const use = (p) => gl.useProgram(p.program)

  function splat(x, y, dx, dy, amount) {
    const aspect = canvas.width / canvas.height
    use(progs.splat)
    gl.uniform1i(progs.splat.uniforms.uTarget, velocity.read.attach(0))
    gl.uniform1f(progs.splat.uniforms.aspectRatio, aspect)
    gl.uniform2f(progs.splat.uniforms.point, x, y)
    gl.uniform3f(progs.splat.uniforms.color, dx, dy, 0)
    gl.uniform1f(progs.splat.uniforms.radius, SPLAT_RADIUS)
    blit(velocity.write); velocity.swap()

    gl.uniform1i(progs.splat.uniforms.uTarget, dye.read.attach(0))
    gl.uniform3f(progs.splat.uniforms.color, amount, amount, amount)
    blit(dye.write); dye.swap()
  }

  function step(dt) {
    gl.disable(gl.BLEND)

    use(progs.curl)
    gl.uniform2f(progs.curl.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
    gl.uniform1i(progs.curl.uniforms.uVelocity, velocity.read.attach(0))
    blit(curlFbo)

    use(progs.vorticity)
    gl.uniform2f(progs.vorticity.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
    gl.uniform1i(progs.vorticity.uniforms.uVelocity, velocity.read.attach(0))
    gl.uniform1i(progs.vorticity.uniforms.uCurl, curlFbo.attach(1))
    gl.uniform1f(progs.vorticity.uniforms.curl, CURL_STRENGTH)
    gl.uniform1f(progs.vorticity.uniforms.dt, dt)
    blit(velocity.write); velocity.swap()

    use(progs.divergence)
    gl.uniform2f(progs.divergence.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
    gl.uniform1i(progs.divergence.uniforms.uVelocity, velocity.read.attach(0))
    blit(divergence)

    use(progs.clear)
    gl.uniform1i(progs.clear.uniforms.uTexture, pressure.read.attach(0))
    gl.uniform1f(progs.clear.uniforms.value, 0.8)
    blit(pressure.write); pressure.swap()

    use(progs.pressure)
    gl.uniform2f(progs.pressure.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
    gl.uniform1i(progs.pressure.uniforms.uDivergence, divergence.attach(0))
    for (let i = 0; i < PRESSURE_ITERS; i++) {
      gl.uniform1i(progs.pressure.uniforms.uPressure, pressure.read.attach(1))
      blit(pressure.write); pressure.swap()
    }

    use(progs.gradientSubtract)
    gl.uniform2f(progs.gradientSubtract.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
    gl.uniform1i(progs.gradientSubtract.uniforms.uPressure, pressure.read.attach(0))
    gl.uniform1i(progs.gradientSubtract.uniforms.uVelocity, velocity.read.attach(1))
    blit(velocity.write); velocity.swap()

    use(progs.advection)
    gl.uniform2f(progs.advection.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
    gl.uniform1i(progs.advection.uniforms.uVelocity, velocity.read.attach(0))
    gl.uniform1i(progs.advection.uniforms.uSource, velocity.read.attach(0))
    gl.uniform1f(progs.advection.uniforms.dt, dt)
    gl.uniform1f(progs.advection.uniforms.dissipation, VELOCITY_DISSIPATION)
    blit(velocity.write); velocity.swap()

    gl.uniform1i(progs.advection.uniforms.uVelocity, velocity.read.attach(0))
    gl.uniform1i(progs.advection.uniforms.uSource, dye.read.attach(1))
    gl.uniform1f(progs.advection.uniforms.dissipation, DENSITY_DISSIPATION)
    blit(dye.write); dye.swap()
  }

  function render() {
    use(progs.display)
    gl.uniform1i(progs.display.uniforms.uTexture, dye.read.attach(0))
    gl.uniform1f(progs.display.uniforms.uTopFade, 0.62)
    blit(null)
  }

  function resize() {
    const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1))
    const w = Math.floor(canvas.clientWidth * dpr)
    const h = Math.floor(canvas.clientHeight * dpr)
    if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
      canvas.width = w; canvas.height = h
    }
  }

  // Seed the frame so the hero is never empty on arrival.
  function seed(seedTime) {
    for (let i = 0; i < 14; i++) {
      const a = (i * 2.399963) + seedTime
      const x = 0.5 + Math.cos(a) * 0.42
      const y = 0.12 + (i % 5) * 0.055
      splat(x, y, Math.cos(a * 1.7) * 900, 350 + Math.sin(a) * 500, 0.28)
    }
  }

  resize()
  seed(0.7)
  for (let i = 0; i < 26; i++) step(0.016)
  // Paint immediately. requestAnimationFrame does not fire while the page is in
  // a background tab, so without this a visitor who opens the site in one and
  // comes back later would find blank paper behind the wordmark.
  render()

  if (reducedMotion) {
    window.addEventListener('resize', () => { resize(); render() })
    return { ok: true, animated: false, backend: 'fluid' }
  }

  const pointer = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, moved: false, inside: false }
  function onMove(ev) {
    const r = canvas.getBoundingClientRect()
    if (!r.width || !r.height) return
    pointer.px = pointer.x; pointer.py = pointer.y
    pointer.x = (ev.clientX - r.left) / r.width
    pointer.y = 1 - (ev.clientY - r.top) / r.height
    pointer.moved = true
    pointer.inside = pointer.x >= 0 && pointer.x <= 1 && pointer.y >= 0 && pointer.y <= 1
  }
  window.addEventListener('pointermove', onMove, { passive: true })

  let raf = 0
  let last = 0
  let ambient = 0
  function frame(ms) {
    const t = ms / 1000
    let dt = last ? Math.min(t - last, 0.0166) : 0.0166
    last = t
    resize()

    if (pointer.moved && pointer.inside) {
      pointer.moved = false
      const dx = (pointer.x - pointer.px) * 5200
      const dy = (pointer.y - pointer.py) * 5200
      if (Math.abs(dx) + Math.abs(dy) > 0.6) {
        splat(pointer.x, pointer.y, dx, dy, 0.16)
      }
    }

    // A slow drip keeps the field alive when nobody is touching it, rather than
    // dissipating to blank paper.
    ambient += dt
    if (ambient > 1.9) {
      ambient = 0
      const a = t * 0.7
      splat(0.5 + Math.cos(a) * 0.44, 0.06, Math.cos(a * 2.1) * 700, 900, 0.2)
    }

    step(dt)
    render()
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)

  return {
    ok: true,
    animated: true,
    backend: 'fluid',
    linearFiltering: linearOk,
    stop() {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
    },
  }
}
