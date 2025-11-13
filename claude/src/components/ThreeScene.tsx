import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeSceneProps {
  seed?: number;
  colorA?: string;
  colorB?: string;
}

export default function ThreeScene({ seed = 0, colorA = '#00ffff', colorB = '#ff00ff' }: ThreeSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Shader Material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0 },
        u_seed: { value: seed },
        u_colorA: { value: new THREE.Color(colorA) },
        u_colorB: { value: new THREE.Color(colorB) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float u_time;
        uniform float u_seed;
        uniform vec3 u_colorA;
        uniform vec3 u_colorB;
        varying vec2 vUv;
        
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
        
        void main() {
          vec2 p = vUv * 2.0 - 1.0;
          float d = length(p);
          float a = atan(p.y, p.x);
          
          float noise = random(vec2(u_seed + u_time * 0.1));
          float pattern = sin(d * 10.0 + u_time * 2.0 + noise) * cos(a * 5.0 + u_seed * 0.01);
          
          vec3 color = mix(u_colorA, u_colorB, pattern * 0.5 + 0.5);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });
    materialRef.current = material;

    // Geometry & Mesh
    const geometry = new THREE.PlaneGeometry(4, 4, 64, 64);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      material.uniforms.u_time.value = performance.now() * 0.001;
      material.uniforms.u_seed.value = seed;
      material.uniforms.u_colorA.value.set(colorA);
      material.uniforms.u_colorB.value.set(colorB);
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, [seed, colorA, colorB]);

  return <div ref={mountRef} className="w-full h-screen" />;
}