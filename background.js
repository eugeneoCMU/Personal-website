// Monochrome ink diffusion: domain-warped fBm over the paper colour.
// Exports the shader sources so their structure can be asserted in Node;
// the GPU path itself is verified in a real browser.

export const VERTEX_SRC = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`

export const FRAGMENT_SRC = `
precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_pointer;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  uv.x *= u_resolution.x / u_resolution.y;
  float t = u_time * 0.012;

  // The ink leans away from the cursor. Deliberately weak — this should read as
  // the surface noticing you, not as a thing chasing the mouse.
  vec2 toPointer = uv - u_pointer;
  float pull = 0.18 / (1.0 + 6.0 * dot(toPointer, toPointer));
  vec2 warp = normalize(toPointer + 1e-5) * pull;

  vec2 q = vec2(fbm(uv * 1.6 + t + warp), fbm(uv * 1.6 + vec2(3.7, 1.3) - t + warp));
  vec2 r = vec2(fbm(uv * 2.1 + 3.0 * q + vec2(1.7, 9.2) + 0.15 * t),
                fbm(uv * 2.1 + 3.0 * q + vec2(8.3, 2.8) - 0.12 * t));
  float f = fbm(uv * 2.4 + 3.5 * r + warp * 0.5);

  // Ink sits low in the frame and fades toward the top, leaving clean paper for type.
  float fade = smoothstep(0.05, 0.95, uv.y);
  float ink = clamp(f * 0.9 - 0.18, 0.0, 1.0) * (1.0 - fade);

  vec3 paper = vec3(0.957, 0.945, 0.918);
  vec3 col = mix(paper, paper * 0.62, ink * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`

export function dprFor(raw) {
  const v = Number.isFinite(raw) ? raw : 1
  return Math.min(2, Math.max(1, v))
}

/**
 * Frame-rate-independent easing toward a target. The pointer is never fed to the
 * shader raw — following it exactly makes the ink feel twitchy and mechanical.
 */
export function approach(current, target, ease = 0.06) {
  if (!Number.isFinite(current)) return Number.isFinite(target) ? target : 0
  if (!Number.isFinite(target)) return current
  const e = Math.min(1, Math.max(0, ease))
  return current + (target - current) * e
}

function compile(gl, type, src) {
  const sh = gl.createShader(type)
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn('ink shader failed:', gl.getShaderInfoLog(sh))
    return null
  }
  return sh
}

export function initInk(canvas, { reducedMotion = false } = {}) {
  if (!canvas) return { ok: false }
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false })
  if (!gl) { canvas.classList.add('fallback'); return { ok: false } }

  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SRC)
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC)
  if (!vs || !fs) { canvas.classList.add('fallback'); return { ok: false } }

  const prog = gl.createProgram()
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    canvas.classList.add('fallback'); return { ok: false }
  }
  gl.useProgram(prog)

  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, 'a_position')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  const uTime = gl.getUniformLocation(prog, 'u_time')
  const uRes = gl.getUniformLocation(prog, 'u_resolution')
  const uPointer = gl.getUniformLocation(prog, 'u_pointer')

  // Target is where the cursor is; eased is what the shader sees. Starts centred
  // so the first frame is composed rather than pinned to a corner.
  const target = { x: 0.5, y: 0.5 }
  const eased = { x: 0.5, y: 0.5 }

  function onPointer(ev) {
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    target.x = (ev.clientX - rect.left) / rect.width
    // GL's y axis runs bottom-up; the DOM's runs top-down.
    target.y = 1 - (ev.clientY - rect.top) / rect.height
  }

  function resize() {
    const dpr = dprFor(window.devicePixelRatio)
    const w = Math.floor(canvas.clientWidth * dpr)
    const h = Math.floor(canvas.clientHeight * dpr)
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h)
    }
  }

  function draw(t) {
    resize()
    gl.uniform1f(uTime, t)
    gl.uniform2f(uRes, canvas.width, canvas.height)
    gl.uniform2f(uPointer, eased.x, eased.y)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  // Reduced motion still gets a rendered frame — never an empty canvas — and no
  // pointer listener, because the ink must not move at all.
  if (reducedMotion) {
    draw(120)
    window.addEventListener('resize', () => draw(120))
    return { ok: true, animated: false }
  }

  window.addEventListener('pointermove', onPointer, { passive: true })

  let raf = 0
  const loop = (ms) => {
    eased.x = approach(eased.x, target.x)
    eased.y = approach(eased.y, target.y)
    draw(ms / 1000)
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)
  return {
    ok: true,
    animated: true,
    stop: () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointer)
    },
  }
}
