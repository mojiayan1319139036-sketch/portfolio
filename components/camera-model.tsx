'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import gsap from 'gsap';

export type CameraModelHandle = {
  triggerShutter: () => Promise<void>;
  reset: () => void;
};

function mesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: [number, number, number],
) {
  const item = new THREE.Mesh(geometry, material);
  item.position.set(...position);
  item.castShadow = true;
  item.receiveShadow = true;
  return item;
}

export const CameraModel = forwardRef<CameraModelHandle, { className?: string }>(
  function CameraModel({ className }, ref) {
    const mountRef = useRef<HTMLDivElement>(null);
    const cameraGroupRef = useRef<THREE.Group | null>(null);
    const lensRef = useRef<THREE.Group | null>(null);
    const renderRef = useRef<() => void>(() => undefined);

    useImperativeHandle(ref, () => ({
      triggerShutter: () => new Promise((resolve) => {
        const camera = cameraGroupRef.current;
        const lens = lensRef.current;
        if (!camera || !lens) return resolve();
        gsap.timeline({
          defaults: { overwrite: 'auto' },
          onUpdate: () => renderRef.current(),
          onComplete: resolve,
        })
          .to(camera.position, { y: 0.2, duration: 0.28, ease: 'power2.out' })
          .to(camera.rotation, { z: -0.045, duration: 0.18, ease: 'power2.out' }, '<')
          .to(lens.position, { z: 0.38, duration: 0.34, ease: 'back.out(2.1)' }, '-=0.08')
          .to(camera.rotation, { z: 0.025, duration: 0.07, ease: 'power1.inOut' })
          .to(camera.rotation, { z: 0, duration: 0.24, ease: 'elastic.out(1, .45)' })
          .to(camera.position, { y: 0, duration: 0.34, ease: 'power2.out' }, '<');
      }),
      reset: () => {
        if (cameraGroupRef.current) {
          gsap.set(cameraGroupRef.current.position, { x: 0, y: 0, z: 0 });
          gsap.set(cameraGroupRef.current.rotation, { z: 0 });
        }
        if (lensRef.current) gsap.set(lensRef.current.position, { z: 0 });
        renderRef.current();
      },
    }), []);

    useEffect(() => {
      const mount = mountRef.current;
      if (!mount) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);
      camera.position.set(4.4, 3.2, 7.8);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      mount.appendChild(renderer.domElement);

      const cream = new THREE.MeshPhysicalMaterial({ color: 0xdad3bd, roughness: 0.48, metalness: 0.08, clearcoat: 0.16 });
      const black = new THREE.MeshStandardMaterial({ color: 0x171b1a, roughness: 0.72, metalness: 0.02 });
      const metal = new THREE.MeshStandardMaterial({ color: 0x9f9d91, roughness: 0.34, metalness: 0.72 });
      const darkMetal = new THREE.MeshStandardMaterial({ color: 0x343735, roughness: 0.42, metalness: 0.52 });
      const glass = new THREE.MeshPhysicalMaterial({ color: 0x07141a, roughness: 0.09, metalness: 0.18, clearcoat: 1 });
      const accent = new THREE.MeshStandardMaterial({ color: 0xc84a27, roughness: 0.4 });
      const amber = new THREE.MeshStandardMaterial({ color: 0xc86a2c, roughness: 0.38 });

      const cameraGroup = new THREE.Group();
      cameraGroup.rotation.y = -0.08;
      cameraGroupRef.current = cameraGroup;
      scene.add(cameraGroup);

      cameraGroup.add(mesh(new RoundedBoxGeometry(3.1, 1.42, 0.92, 4, 0.1), black, [0, 0, 0]));
      cameraGroup.add(mesh(new RoundedBoxGeometry(3.14, 0.48, 0.96, 4, 0.08), cream, [0, 0.52, 0]));
      cameraGroup.add(mesh(new RoundedBoxGeometry(3.16, 0.25, 0.98, 4, 0.06), cream, [0, -0.67, 0]));

      const windowGeo = new RoundedBoxGeometry(0.48, 0.27, 0.08, 3, 0.035);
      cameraGroup.add(mesh(windowGeo, glass, [0.17, 0.47, 0.5]));
      cameraGroup.add(mesh(new RoundedBoxGeometry(0.62, 0.29, 0.08, 3, 0.035), glass, [0.95, 0.47, 0.5]));
      cameraGroup.add(mesh(new RoundedBoxGeometry(0.55, 0.12, 0.32, 3, 0.025), darkMetal, [-0.2, 0.86, 0]));

      const dialGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.1, 32);
      cameraGroup.add(mesh(dialGeo, metal, [-1.06, 0.83, 0]));
      cameraGroup.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.11, 32), metal, [1.08, 0.84, 0]));

      cameraGroup.add(mesh(new RoundedBoxGeometry(0.34, 0.1, 0.06, 2, 0.025), accent, [-0.95, 0.28, 0.5]));
      cameraGroup.add(mesh(new THREE.SphereGeometry(0.095, 20, 14), amber, [-0.55, -0.03, 0.54]));

      const lens = new THREE.Group();
      lens.position.set(0.3, -0.14, 0.5);
      lensRef.current = lens;
      cameraGroup.add(lens);
      const barrelA = mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.34, 48), metal, [0, 0, 0.13]);
      barrelA.rotation.x = Math.PI / 2;
      lens.add(barrelA);
      const barrelB = mesh(new THREE.CylinderGeometry(0.43, 0.46, 0.28, 48), darkMetal, [0, 0, 0.32]);
      barrelB.rotation.x = Math.PI / 2;
      lens.add(barrelB);
      const ring = mesh(new THREE.TorusGeometry(0.43, 0.055, 12, 48), metal, [0, 0, 0.48]);
      lens.add(ring);
      const lensGlass = mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.08, 48), glass, [0, 0, 0.48]);
      lensGlass.rotation.x = Math.PI / 2;
      lens.add(lensGlass);

      scene.add(new THREE.HemisphereLight(0xd8e7ed, 0x173025, 2.1));
      const key = new THREE.DirectionalLight(0xffd49a, 4.2);
      key.position.set(-3.5, 5, 5);
      key.castShadow = true;
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x75a8bf, 1.5);
      rim.position.set(4, 2, -4);
      scene.add(rim);

      const render = () => renderer.render(scene, camera);
      renderRef.current = render;

      const resize = () => {
        const width = Math.max(mount.clientWidth, 1);
        const height = Math.max(mount.clientHeight, 1);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        render();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(mount);
      resize();

      return () => {
        renderRef.current = () => undefined;
        observer.disconnect();
        gsap.killTweensOf(cameraGroup.position);
        gsap.killTweensOf(cameraGroup.rotation);
        gsap.killTweensOf(lens.position);
        renderer.dispose();
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh) object.geometry.dispose();
        });
        [cream, black, metal, darkMetal, glass, accent, amber].forEach((material) => material.dispose());
        renderer.domElement.remove();
      };
    }, []);

    return <div ref={mountRef} className={className} aria-hidden="true" />;
  },
);
