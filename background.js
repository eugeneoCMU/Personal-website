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

  vec2 q = vec2(fbm(uv * 1.6 + t), fbm(uv * 1.6 + vec2(3.7, 1.3) - t));
  vec2 r = vec2(fbm(uv * 2.1 + 3.0 * q + vec2(1.7, 9.2) + 0.15 * t),
                fbm(uv * 2.1 + 3.0 * q + vec2(8.3, 2.8) - 0.12 * t));
  float f = fbm(uv * 2.4 + 3.5 * r);

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
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  // Reduced motion still gets a rendered frame — never an empty canvas.
  if (reducedMotion) {
    draw(120)
    window.addEventListener('resize', () => draw(120))
    return { ok: true, animated: false }
  }

  let raf = 0
  const loop = (ms) => { draw(ms / 1000); raf = requestAnimationFrame(loop) }
  raf = requestAnimationFrame(loop)
  return { ok: true, animated: true, stop: () => cancelAnimationFrame(raf) }
}
