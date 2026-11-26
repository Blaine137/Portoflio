import {
  BufferAttribute,
  BufferGeometry,
  Color,
  OrthographicCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from 'three';
import type { ParticleArt, ParticleVariant } from './particle-art';

export function createParticleRenderer(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  colors: { tint: string; highlight: string },
  variant: ParticleVariant,
  { positions, intensities }: ParticleArt,
) {
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  });
  renderer.setClearColor(0, 0);
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 3;
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('intensity', new BufferAttribute(intensities, 1));
  const uniforms = {
    tint: { value: new Color(colors.tint) },
    highlight: {
      value: new Color(colors.highlight),
    },
    cursor: { value: new Vector2(0, 0) },
    motion: { value: { ribbon: 0, orbit: 1, lattice: 2, wave: 3, helix: 4 }[variant] },
    strength: { value: 0 },
    elapsed: { value: 0 },
    pointScale: { value: 1 },
  };
  const material = new ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: `
      attribute float intensity;
      uniform vec2 cursor;
      uniform float strength, elapsed, pointScale, motion;
      varying float lightLevel;
      void main() {
        vec3 p = position;
        float angle = 0.065 * sin(elapsed * 0.25);
        p.xz = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * p.xz;
        p.y += 0.009 * sin(p.x * 3.5 + elapsed * 0.42);

        // Each route has its own movement as well as its own point geometry.
        if (motion == 1.0) {
          float orbit = elapsed * 0.12;
          p.xy = mat2(cos(orbit), -sin(orbit), sin(orbit), cos(orbit)) * p.xy;
        } else if (motion == 2.0) {
          p.z += 0.12 * sin(p.x * 5.0 + elapsed * 0.6);
          p.y += 0.035 * cos(p.x * 6.0 + elapsed * 0.5);
        } else if (motion == 3.0) {
          p.y += 0.07 * sin(p.x * 4.5 + p.z * 3.0 + elapsed * 0.7);
        } else if (motion == 4.0) {
          float spin = elapsed * 0.18;
          p.xz = mat2(cos(spin), -sin(spin), sin(spin), cos(spin)) * p.xz;
        }
        vec2 delta = cursor - p.xy;
        p.xy += delta * exp(-6.5 * dot(delta, delta)) * strength * 0.72;
        lightLevel = intensity;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = pointScale * (0.68 + 1.4 * intensity);
      }`,
    fragmentShader: `
      uniform vec3 tint, highlight;
      varying float lightLevel;
      void main() {
        float radius = length(gl_PointCoord - 0.5) * 2.0;
        float alpha = (1.0 - smoothstep(0.34, 1.0, radius)) * (0.22 + lightLevel * 0.77);
        gl_FragColor = vec4(mix(tint, highlight, lightLevel), alpha);
        #include <colorspace_fragment>
      }`,
  });
  scene.add(new Points(geometry, material));
  const target = new Vector2();
  let attraction = 0;
  let frame = 0;
  let lastTime = 0;

  function draw(time: number) {
    const delta = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    uniforms.elapsed.value += delta;
    const easing = 1 - Math.exp(-8 * delta);
    uniforms.cursor.value.lerp(target, easing);
    uniforms.strength.value += (attraction - uniforms.strength.value) * easing;
    renderer.render(scene, camera);
    frame = requestAnimationFrame(draw);
  }

  function playback(running: boolean) {
    cancelAnimationFrame(frame);
    if (running) {
      lastTime = performance.now();
      frame = requestAnimationFrame(draw);
    }
  }

  let previousWidth = -1;
  let previousHeight = -1;
  let previousRatio = -1;
  function resize(width: number, height: number, ratio: number) {
    if (width === previousWidth && height === previousHeight && ratio === previousRatio) return;
    previousWidth = width;
    previousHeight = height;
    previousRatio = ratio;
    renderer.setDrawingBufferSize(width, height, ratio);
    uniforms.pointScale.value = Math.max(width / 470, 0.78) * ratio;
    renderer.render(scene, camera);
  }

  return {
    resize,
    playback,
    move(x: number, y: number) {
      target.set(x, y);
      attraction = 1;
    },
    leave() {
      attraction = 0;
    },
    dispose() {
      cancelAnimationFrame(frame);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
