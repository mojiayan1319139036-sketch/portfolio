'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';

export type DeskPanel = 'photo' | 'video' | 'design' | 'planning' | 'polaroid' | 'badge';
export type PersonalStuffId = 'movie-ticket' | 'earpods' | 'guitar-pick' | 'macau-bungee' | 'medal' | 'photo';

export type PersonalStuffOrigin = { x: number; y: number; width: number; height: number };

type Props = {
  entered: boolean;
  drawerOpen: boolean;
  onEnter: () => void;
  onSelect: (panel: DeskPanel) => void;
  onDrawerToggle: () => void;
  onStuffSelect: (item: PersonalStuffId, origin: PersonalStuffOrigin) => void;
};

type Interactive = {
  id: DeskPanel | 'drawer' | 'lamp';
  label: string;
  group: THREE.Group;
  hoverEnabled: boolean;
  outlines: THREE.LineSegments[];
};

const FAR = { position: new THREE.Vector3(15.2, 13.0, 48.5), target: new THREE.Vector3(0, 0.45, 0) };
const NEAR = { position: new THREE.Vector3(5.85, 11.72, 18.13), target: new THREE.Vector3(0, 0.72, 0) };
const DRAWER = { position: new THREE.Vector3(4.5, 11.85, 15.15), target: new THREE.Vector3(0, 2.07, 1.25) };

function addMesh(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
) {
  const item = new THREE.Mesh(geometry, material);
  item.position.set(...position);
  item.rotation.set(...rotation);
  item.castShadow = true;
  item.receiveShadow = true;
  parent.add(item);
  return item;
}

function rounded(width: number, height: number, depth: number, radius = 0.08) {
  return new RoundedBoxGeometry(width, height, depth, 4, Math.min(radius, width / 3, height / 3, depth / 3));
}

function cylinderBetween(
  parent: THREE.Object3D,
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  material: THREE.Material,
) {
  const direction = end.clone().sub(start);
  const item = addMesh(parent, new THREE.CylinderGeometry(radius, radius, direction.length(), 24), material, [0, 0, 0]);
  item.position.copy(start.clone().add(end).multiplyScalar(0.5));
  item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return item;
}

function taperedLegGeometry(height: number) {
  const geometry = new THREE.BufferGeometry();
  const topX = 0.31, topZ = 0.27, bottomX = 0.21, bottomZ = 0.19;
  const y0 = -height / 2, y1 = height / 2;
  const positions = new Float32Array([
    -bottomX,y0,-bottomZ, bottomX,y0,-bottomZ, bottomX,y0,bottomZ, -bottomX,y0,bottomZ,
    -topX,y1,-topZ, topX,y1,-topZ, topX,y1,topZ, -topX,y1,topZ,
  ]);
  const indices = [0,2,1,0,3,2, 4,5,6,4,6,7, 0,1,5,0,5,4, 1,2,6,1,6,5, 2,3,7,2,7,6, 3,0,4,3,4,7];
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function ribbonGeometry(curve: THREE.Curve<THREE.Vector3>, width: number, segments = 48) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const up = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const point = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();
    const side = new THREE.Vector3().crossVectors(tangent, up).normalize().multiplyScalar(width / 2);
    positions.push(
      point.x + side.x, point.y, point.z + side.z,
      point.x - side.x, point.y, point.z - side.z,
    );
    uvs.push(t, 0, t, 1);
    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function paperTexture(kind: 'zine' | 'folder' | 'badge' | 'polaroid') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;
  if (kind === 'zine') {
    ctx.fillStyle = '#e8dfd1'; ctx.fillRect(0, 0, 512, 320);
    ctx.strokeStyle = '#9f978b'; ctx.lineWidth = 1;
    for (let x = 24; x < 512; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 320); ctx.stroke(); }
    for (let y = 24; y < 320; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke(); }
    ctx.fillStyle = '#203a31'; ctx.font = '700 54px monospace'; ctx.fillText('DESIGN', 32, 78);
    ctx.font = '700 54px monospace'; ctx.fillText('INDEX', 32, 134);
    [['#22a9df', 42], ['#e4478a', 94], ['#ead04f', 146], ['#171b1a', 198]].forEach(([color, x]) => {
      ctx.fillStyle = color as string; ctx.fillRect(Number(x), 212, 38, 56);
    });
    ctx.fillStyle = '#203a31'; ctx.font = '18px monospace'; ctx.fillText('SELECTED WORKS / 2026', 270, 258);
    ctx.strokeStyle = '#e4512c'; ctx.lineWidth = 5; ctx.strokeRect(14, 14, 484, 292);
  } else if (kind === 'folder') {
    ctx.fillStyle = '#b5904c'; ctx.fillRect(0, 0, 512, 320);
    ctx.fillStyle = '#d99bae'; ctx.fillRect(175, 105, 180, 74);
    ctx.fillStyle = '#54352f'; ctx.font = '600 30px monospace'; ctx.textAlign = 'center'; ctx.fillText('PROJECTS', 265, 151);
  } else if (kind === 'polaroid') {
    const sky = ctx.createLinearGradient(0, 0, 0, 320);
    sky.addColorStop(0, '#b6b6c4');
    sky.addColorStop(0.48, '#d8c5b5');
    sky.addColorStop(1, '#887c70');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, 512, 320);
    ctx.fillStyle = 'rgba(84, 77, 70, .38)'; ctx.fillRect(0, 244, 512, 76);
    ctx.save();
    ctx.filter = 'blur(16px)';
    ctx.fillStyle = 'rgba(45, 48, 50, .72)';
    ctx.beginPath(); ctx.ellipse(270, 105, 35, 43, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(270, 242, 84, 132, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(236, 205, 159, .34)'; ctx.beginPath(); ctx.arc(400, 82, 38, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#eee7d6'; ctx.fillRect(0, 0, 512, 320);
    ctx.fillStyle = '#2f5d42'; ctx.fillRect(0, 0, 512, 58);
    ctx.fillStyle = '#173228'; ctx.font = '600 30px monospace'; ctx.fillText('JIAYAN MO', 32, 128);
    ctx.font = '22px monospace'; ctx.fillText('CONTACT', 32, 176);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  return texture;
}

function createDeskScene(scene: THREE.Scene) {
  const root = new THREE.Group();
  root.position.y = 0.12;
  scene.add(root);

  const green = new THREE.MeshPhysicalMaterial({ color: 0x315f3c, roughness: 0.28, metalness: 0.02, clearcoat: 0.34, clearcoatRoughness: 0.3 });
  const greenDark = new THREE.MeshStandardMaterial({ color: 0x244d32, roughness: 0.38 });
  const orange = new THREE.MeshPhysicalMaterial({ color: 0xd85127, roughness: 0.3, clearcoat: 0.28 });
  const cream = new THREE.MeshPhysicalMaterial({ color: 0xe2d7bb, roughness: 0.38, clearcoat: 0.18 });
  const black = new THREE.MeshStandardMaterial({ color: 0x151b19, roughness: 0.55 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x101817, roughness: 0.18, metalness: 0.16, clearcoat: 0.8 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xb9b3a2, roughness: 0.25, metalness: 0.75 });
  const pink = new THREE.MeshStandardMaterial({ color: 0xd7a4bd, roughness: 0.72 });
  const yellow = new THREE.MeshStandardMaterial({ color: 0xd2ad58, roughness: 0.72 });
  const paper = new THREE.MeshStandardMaterial({ color: 0xeee7d6, roughness: 0.86 });

  addMesh(root, rounded(10.2, 0.38, 4.65, 0.12), green, [0, 2.45, 0]);
  addMesh(root, rounded(9.7, 0.72, 0.36, 0.07), greenDark, [0, 1.93, 2.02]);
  addMesh(root, rounded(9.65, 0.62, 0.28, 0.06), greenDark, [0, 1.96, -2.05]);
  const legGeo = taperedLegGeometry(4.35);
  [[-4.42,-1.76],[4.42,-1.76],[-4.42,1.76],[4.42,1.76]].forEach(([x,z]) => addMesh(root, legGeo.clone(), green, [x, -0.38, z]));

  const drawer = new THREE.Group();
  drawer.name = 'drawer';
  root.add(drawer);
  const drawerFront = addMesh(drawer, rounded(4.55, 0.82, 0.26, 0.07), green, [0, 1.96, 2.25]);
  addMesh(drawer, rounded(4.25, 0.18, 3.25, 0.05), greenDark, [0, 1.60, 0.82]);
  const drawerFace = addMesh(drawer, rounded(4.15, 0.55, 0.14, 0.05), green, [0, 1.96, 2.42]);
  addMesh(drawer, rounded(0.15, 0.45, 3.05, 0.04), green, [-2.05, 1.81, 0.82]);
  addMesh(drawer, rounded(0.15, 0.45, 3.05, 0.04), green, [2.05, 1.81, 0.82]);
  addMesh(drawer, rounded(4.12, 0.45, 0.14, 0.04), green, [0, 1.81, -0.66]);
  const handleBar = addMesh(drawer, new THREE.CylinderGeometry(0.085, 0.085, 1.15, 24), cream, [0, 1.96, 2.58], [0, 0, Math.PI / 2]);
  handleBar.castShadow = true;
  const handleLeft = addMesh(drawer, new THREE.CylinderGeometry(0.09, 0.09, 0.22, 20), cream, [-0.58, 1.96, 2.49], [Math.PI / 2, 0, 0]);
  const handleRight = addMesh(drawer, new THREE.CylinderGeometry(0.09, 0.09, 0.22, 20), cream, [0.58, 1.96, 2.49], [Math.PI / 2, 0, 0]);
  [drawerFront, drawerFace, handleBar, handleLeft, handleRight].forEach((object) => {
    object.userData.drawerHitTarget = true;
  });

  const textureLoader = new THREE.TextureLoader();
  const stuffGroups = new Map<PersonalStuffId, THREE.Group>();
  const makeStuff = (
    id: PersonalStuffId,
    layers: Array<{ src: string; width: number; height: number; x?: number; z?: number; lift?: number }>,
    position: [number, number, number],
    angle = 0,
  ) => {
    const group = new THREE.Group();
    group.name = `personal-${id}`;
    group.position.set(...position);
    group.rotation.y = angle;
    group.userData.stuffId = id;
    group.userData.restY = position[1];
    drawer.add(group);
    layers.forEach(({ src, width, height, x = 0, z = 0, lift = 0 }) => {
      const texture = textureLoader.load(src, () => scene.userData.invalidate?.());
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 16;
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.035,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      const mesh = addMesh(group, new THREE.PlaneGeometry(width, height), material, [x, lift, z], [-Math.PI / 2, 0, 0]);
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.userData.stuffId = id;
      mesh.renderOrder = 10 + Math.round(lift * 1000);
    });
    stuffGroups.set(id, group);
    return group;
  };

  makeStuff('movie-ticket', [{ src: '/portfolio/personal-stuff/objects/movie-ticket.png', width: 0.58, height: 0.78 }], [-1.55, 1.72, -0.03], -0.12);
  makeStuff('earpods', [{ src: '/portfolio/personal-stuff/objects/earpods.png', width: 0.82, height: 0.82 }], [-0.68, 1.725, -0.02], 0.11);
  makeStuff('guitar-pick', [{ src: '/portfolio/personal-stuff/objects/guitar-pick.png', width: 0.46, height: 0.49 }], [0.18, 1.73, 0.03], -0.08);
  makeStuff('photo', [{ src: '/portfolio/personal-stuff/objects/photo.png', width: 0.62, height: 0.93 }], [1.30, 1.725, 0.05], 0.08);
  makeStuff('macau-bungee', [{ src: '/portfolio/personal-stuff/objects/macau-bungee.png', width: 0.78, height: 0.78 }], [-1.05, 1.73, 1.16], 0.06);
  makeStuff('medal', [
    { src: '/portfolio/personal-stuff/objects/medal-ribbon.png?v=20260908', width: 1.17, height: 0.97 },
    { src: '/portfolio/personal-stuff/objects/medal-front.png?v=20260908', width: 0.63, height: 0.58, x: -0.27, z: 0.24, lift: 0.014 },
  ], [0.70, 1.735, 1.18], -0.08);
  const computer = new THREE.Group(); computer.name = 'video'; computer.position.set(0.65, 3.67, -0.62); root.add(computer);
  addMesh(computer, rounded(2.65, 2.35, 1.15, 0.25), cream, [0, 0, 0]);
  addMesh(computer, rounded(1.92, 1.46, 0.13, 0.18), black, [0, 0.12, 0.62]);
  const screenMaterial = new THREE.MeshPhysicalMaterial({ color: 0x07100d, emissive: 0x6ea484, emissiveIntensity: 0.04, roughness: 0.16, clearcoat: 0.85 });
  addMesh(computer, rounded(1.66, 1.19, 0.08, 0.16), screenMaterial, [0, 0.12, 0.71]);
  const computerButton = addMesh(computer, new THREE.CylinderGeometry(0.11, 0.11, 0.08, 28), orange, [0.91, -0.83, 0.63], [Math.PI / 2, 0, 0]);
  addMesh(computer, rounded(2.15, 0.22, 0.7, 0.08), cream, [0, -1.24, 0.02]);
  for (let i = 0; i < 7; i++) addMesh(computer, rounded(0.17, 0.035, 0.05, 0.012), black, [-0.62 + i * 0.2, -0.93, 0.61]);
  addMesh(computer, rounded(0.42, 0.12, 0.52, 0.04), cream, [-0.67, -1.31, 0]);
  addMesh(computer, rounded(0.42, 0.12, 0.52, 0.04), cream, [0.67, -1.31, 0]);

  const lamp = new THREE.Group(); lamp.position.set(-3.25, 2.7, -0.55); root.add(lamp);
  addMesh(lamp, new THREE.CylinderGeometry(0.66, 0.74, 0.22, 36), orange, [0, 0, 0]);
  const lampPoints = [new THREE.Vector3(0,0.12,0), new THREE.Vector3(-0.42,1.65,0), new THREE.Vector3(0.5,2.88,0)];
  cylinderBetween(lamp, lampPoints[0], lampPoints[1], 0.09, orange);
  cylinderBetween(lamp, lampPoints[1], lampPoints[2], 0.09, orange);
  lampPoints.forEach((point) => addMesh(lamp, new THREE.SphereGeometry(0.18, 24, 16), orange, [point.x, point.y, point.z]));
  const shade = addMesh(lamp, new THREE.CylinderGeometry(0.35, 0.72, 0.72, 36, 1, true), orange, [0.68, 3.02, 0], [0, 0, -0.5]);
  shade.material.side = THREE.DoubleSide;
  const bulbMaterial = new THREE.MeshStandardMaterial({ color: 0xd7c9aa, emissive: 0xffa83a, emissiveIntensity: 0.04 });
  const bulb = addMesh(lamp, new THREE.SphereGeometry(0.21, 24, 16), bulbMaterial, [0.83, 2.78, 0]);
  bulb.scale.y = 0.65;
  const lampLight = new THREE.PointLight(0xffb45e, 0, 7.5, 2.2); lampLight.position.set(0.83, 2.67, 0.2); lamp.add(lampLight);
  const lampSpot = new THREE.SpotLight(0xffd66f, 0, 8.5, 0.5, 0.72, 1.6);
  lampSpot.position.set(0.75, 2.76, 0.1);
  lampSpot.target.position.set(0.75, -0.08, 0.1);
  lamp.add(lampSpot, lampSpot.target);
  // Render one surface only: double-sided additive transparency creates a bright seam
  // where the cone overlaps itself, which reads as an unwanted white wireframe.
  const beamMaterial = new THREE.MeshBasicMaterial({
    color: 0xffdf77,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.FrontSide,
    blending: THREE.NormalBlending,
  });
  const beam = addMesh(lamp, new THREE.CylinderGeometry(0.16, 1.22, 3.1, 64, 1, true), beamMaterial, [0.75, 1.48, 0.1]);
  beam.castShadow = false; beam.receiveShadow = false; beam.renderOrder = 8;
  const poolMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd76a,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.FrontSide,
    blending: THREE.NormalBlending,
  });
  const lightPool = addMesh(lamp, new THREE.CircleGeometry(1.22, 48), poolMaterial, [0.75, -0.045, 0.1], [-Math.PI / 2, 0, 0]);
  lightPool.castShadow = false; lightPool.receiveShadow = false; lightPool.renderOrder = 7;

  const camera = new THREE.Group(); camera.name = 'photo'; camera.position.set(-2.82, 2.98, 1.05); camera.rotation.y = 0.06; root.add(camera);
  addMesh(camera, rounded(1.35, 0.72, 0.52, 0.08), black, [0, 0, 0]);
  addMesh(camera, rounded(1.38, 0.28, 0.55, 0.06), cream, [0, 0.31, 0]);
  addMesh(camera, rounded(1.39, 0.16, 0.56, 0.05), cream, [0, -0.36, 0]);
  addMesh(camera, rounded(0.32, 0.18, 0.18, 0.035), black, [-0.24, 0.48, 0.03]);
  addMesh(camera, rounded(0.23, 0.14, 0.05, 0.025), glass, [-0.24, 0.48, 0.31]);
  const shutterButton = addMesh(camera, new THREE.CylinderGeometry(0.085, 0.085, 0.075, 24), orange, [0.46, 0.49, 0], [0, 0, 0]);
  addMesh(camera, new THREE.CylinderGeometry(0.14, 0.14, 0.09, 28), metal, [-0.48, 0.48, 0]);
  const flashMaterial = new THREE.MeshStandardMaterial({ color: 0xe7e2ce, emissive: 0xfff1ba, emissiveIntensity: 0 });
  addMesh(camera, rounded(0.2, 0.12, 0.05, 0.025), flashMaterial, [0.49, 0.26, 0.31]);
  const lens = new THREE.Group(); lens.name = 'camera-lens'; lens.position.set(0.16, -0.05, 0.33); camera.add(lens);
  addMesh(lens, new THREE.CylinderGeometry(0.32, 0.32, 0.24, 32), metal, [0, 0, 0.08], [Math.PI / 2, 0, 0]);
  addMesh(lens, new THREE.CylinderGeometry(0.23, 0.25, 0.17, 32), black, [0, 0, 0.23], [Math.PI / 2, 0, 0]);
  addMesh(lens, new THREE.CylinderGeometry(0.17, 0.17, 0.04, 32), glass, [0, 0, 0.34], [Math.PI / 2, 0, 0]);

  const zine = new THREE.Group(); zine.name = 'design'; zine.position.set(1.95, 2.7, 1.15); zine.rotation.y = -0.13; root.add(zine);
  for (let i = 0; i < 3; i++) addMesh(zine, rounded(2.05, 0.03, 1.5, 0.025), paper, [0, i * 0.035, 0]);
  addMesh(zine, rounded(0.07, 0.11, 1.48, 0.022), pink, [-1.02, 0.045, 0]);
  const zineCoverMaterial = new THREE.MeshStandardMaterial({
    map: paperTexture('zine'), roughness: 0.72,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  const zineCover = addMesh(zine, new THREE.PlaneGeometry(1.93, 1.38), zineCoverMaterial, [0.03, 0.096, 0], [-Math.PI / 2, 0, 0]);
  zineCover.renderOrder = 2;
  addMesh(zine, rounded(0.3, 0.025, 0.16, 0.018), pink, [1.13, 0.045, -0.43]);
  addMesh(zine, rounded(0.3, 0.025, 0.16, 0.018), yellow, [1.13, 0.05, -0.12]);

  const folder = new THREE.Group(); folder.name = 'planning'; folder.position.set(3.35, 2.66, -0.65); folder.rotation.y = -0.08; root.add(folder);
  addMesh(folder, rounded(2.2, 0.09, 1.25, 0.035), pink, [0.07, -0.05, 0.08]);
  const folderPaper = new THREE.Group(); folder.add(folderPaper);
  addMesh(folderPaper, rounded(1.82, 0.045, 1.02, 0.025), paper, [0, 0.04, 0.08]);
  for (let i = 0; i < 4; i++) addMesh(folderPaper, rounded(1.2, 0.018, 0.025, 0.008), black, [-0.18, 0.07, -0.18 + i * 0.17]);
  const folderFlap = new THREE.Group(); folderFlap.position.set(0, 0.11, -0.65); folder.add(folderFlap);
  addMesh(folderFlap, rounded(2.25, 0.08, 1.3, 0.035), new THREE.MeshStandardMaterial({ map: paperTexture('folder'), roughness: 0.72 }), [0, 0, 0.65]);
  addMesh(folderFlap, rounded(0.68, 0.075, 0.22, 0.025), yellow, [-0.67, 0.015, 1.36]);

  const polaroid = new THREE.Group(); polaroid.name = 'polaroid'; polaroid.position.set(-1.12, 2.68, 1.25); polaroid.rotation.y = 0.15; root.add(polaroid);
  addMesh(polaroid, rounded(1.18, 0.065, 1.08, 0.025), paper, [0, 0, 0]);
  addMesh(polaroid, rounded(0.96, 0.018, 0.66, 0.012), black, [0, 0.044, -0.14]);
  addMesh(polaroid, new THREE.PlaneGeometry(0.91, 0.61), new THREE.MeshStandardMaterial({ map: paperTexture('polaroid'), roughness: 0.62 }), [0, 0.056, -0.14], [-Math.PI / 2, 0, 0]);

  const badge = new THREE.Group(); badge.name = 'badge'; badge.position.set(4.0, 2.76, 1.12); badge.rotation.y = -0.08; root.add(badge);
  addMesh(badge, rounded(0.84, 0.075, 1.16, 0.04), new THREE.MeshPhysicalMaterial({ color: 0xd7d9d2, transparent: true, opacity: 0.72, roughness: 0.2, transmission: 0.08 }), [0, 0, 0]);
  addMesh(badge, rounded(0.69, 0.032, 0.96, 0.025), new THREE.MeshStandardMaterial({ map: paperTexture('badge'), roughness: 0.75 }), [0, 0.058, 0.04]);
  addMesh(badge, new THREE.PlaneGeometry(0.64, 0.9), new THREE.MeshStandardMaterial({ map: paperTexture('badge'), roughness: 0.7 }), [0, 0.078, 0.04], [-Math.PI / 2, 0, 0]);
  addMesh(badge, rounded(0.18, 0.025, 0.3, 0.018), orange, [0, 0.105, -0.68]);
  addMesh(badge, rounded(0.28, 0.055, 0.2, 0.025), metal, [0, 0.135, -0.58]);
  addMesh(badge, new THREE.CylinderGeometry(0.075, 0.075, 0.04, 24), metal, [0, 0.17, -0.57]);
  const lanyardCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.055, 0.135, -0.75),
    new THREE.Vector3(-0.27, 0.145, -0.91),
    new THREE.Vector3(-0.25, 0.15, -1.15),
    new THREE.Vector3(0, 0.155, -1.27),
    new THREE.Vector3(0.27, 0.15, -1.15),
    new THREE.Vector3(0.29, 0.145, -0.91),
    new THREE.Vector3(0.055, 0.135, -0.75),
  ]);
  const lanyardMaterial = new THREE.MeshStandardMaterial({ color: 0xd85127, roughness: 0.62, side: THREE.DoubleSide });
  addMesh(badge, ribbonGeometry(lanyardCurve, 0.115), lanyardMaterial, [0, 0, 0]);

  const interactiveDefs: Array<[Interactive['id'], string, THREE.Group, boolean?]> = [
    ['lamp', 'Desk light', lamp, false],
    ['video', 'Video works', computer],
    ['photo', 'Photography', camera],
    ['design', 'Design', zine],
    ['planning', 'Planning', folder],
    ['polaroid', 'About me', polaroid],
    ['badge', 'Contact', badge],
    ['drawer', 'Personal stuff', drawer],
  ];
  const interactives = interactiveDefs.map(([id, label, group, hoverEnabled = true]) => {
    const outlines: THREE.LineSegments[] = [];
    group.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      if (id === 'drawer' && !object.userData.drawerHitTarget) return;
      object.userData.interactiveId = id;
      // The drawer remains an interactive close target, but its front and handle
      // should never receive the generic white hover outline.
      if (id === 'lamp' || id === 'photo' || id === 'drawer') return;
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(object.geometry, 28),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.82, depthTest: false }),
      );
      edges.renderOrder = 50;
      edges.visible = false;
      object.add(edges);
      outlines.push(edges);
    });
    return { id, label, group, hoverEnabled, outlines };
  });

  const materials = [green, greenDark, orange, cream, black, glass, metal, pink, yellow, paper, screenMaterial, bulbMaterial, flashMaterial];
  return {
    root, drawer, cameraObject: camera, lens, interactives, materials, stuffGroups,
    feedback: { computer, computerButton, screenMaterial, lamp, lampLight, lampSpot, bulbMaterial, beamMaterial, poolMaterial, shade, camera, lens, shutterButton, flashMaterial, zine, folder, folderFlap, folderPaper, polaroid, badge },
  };
}

export function DeskScene({ entered, drawerOpen, onEnter, onSelect, onDrawerToggle, onStuffSelect }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const runtime = useRef<{
    scene: THREE.Scene; camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer;
    target: THREE.Vector3; drawer: THREE.Group; cameraObject: THREE.Group; lens: THREE.Group;
    controls: OrbitControls; configureControls: (mode: 'far' | 'near' | 'drawer') => void;
    interactives: Interactive[]; stuffGroups: Map<PersonalStuffId, THREE.Group>; clearHover: () => void; render: () => void; resize: () => void;
  } | null>(null);
  const [hoveredLabel, setHoveredLabel] = useState('');
  const enteredState = useRef(entered);
  const drawerState = useRef(drawerOpen);
  const callbacks = useRef({ onEnter, onSelect, onDrawerToggle, onStuffSelect });
  enteredState.current = entered;
  drawerState.current = drawerOpen;
  callbacks.current = { onEnter, onSelect, onDrawerToggle, onStuffSelect };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x001625);
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.copy(FAR.position);
    const initialTarget = FAR.target.clone();
    camera.lookAt(initialTarget);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(initialTarget);
    const target = controls.target;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.rotateSpeed = 0.55;
    controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
    controls.touches.ONE = THREE.TOUCH.ROTATE;
    const built = createDeskScene(scene);
    scene.add(new THREE.HemisphereLight(0xb9d1dc, 0x0f241c, 2.25));
    const key = new THREE.DirectionalLight(0xffcf91, 4.3); key.position.set(-5, 10, 8); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); scene.add(key);
    const rim = new THREE.DirectionalLight(0x6ba8c3, 1.85); rim.position.set(8, 5, -7); scene.add(rim);
    const floor = addMesh(scene, new THREE.PlaneGeometry(34, 24), new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.25 }), [0, -2.64, 0], [-Math.PI / 2, 0, 0]);
    floor.receiveShadow = true;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let current: Interactive | null = null;
    let currentStuff: THREE.Group | null = null;
    let pointerOrigin: { x: number; y: number } | null = null;
    let didDrag = false;
    let feedbackBusy = false;
    let lampOn = false;
    const setHover = (next: Interactive | null) => {
      if (next && !next.hoverEnabled) next = null;
      if (current === next) return;
      current?.outlines.forEach((line) => { line.visible = false; });
      current = next;
      current?.outlines.forEach((line) => { line.visible = true; });
      setHoveredLabel(current ? (current.id === 'drawer' && drawerState.current ? 'Close personal stuff' : current.label) : '');
      renderer.domElement.style.cursor = current ? 'pointer' : drawerState.current ? 'default' : 'grab';
    };
    const setStuffHover = (next: THREE.Group | null) => {
      if (currentStuff === next) return;
      if (currentStuff) {
        gsap.to(currentStuff.position, { y: currentStuff.userData.restY, duration: 0.22, ease: 'power2.out', onUpdate: () => scene.userData.invalidate?.() });
        gsap.to(currentStuff.scale, { x: 1, y: 1, z: 1, duration: 0.22, ease: 'power2.out', onUpdate: () => scene.userData.invalidate?.() });
      }
      currentStuff = next;
      if (currentStuff) {
        gsap.to(currentStuff.position, { y: currentStuff.userData.restY + 0.10, duration: 0.22, ease: 'power2.out', onUpdate: () => scene.userData.invalidate?.() });
        gsap.to(currentStuff.scale, { x: 1.045, y: 1.045, z: 1.045, duration: 0.22, ease: 'power2.out', onUpdate: () => scene.userData.invalidate?.() });
      }
      renderer.domElement.style.cursor = currentStuff ? 'pointer' : drawerState.current ? 'default' : current ? 'pointer' : 'grab';
    };
    const hitTest = (event: MouseEvent | PointerEvent) => {
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(built.root, true);
      const id = hits.find((hit) => hit.object.userData.interactiveId)?.object.userData.interactiveId as Interactive['id'] | undefined;
      return built.interactives.find((item) => item.id === id) ?? null;
    };
    const hitTestStuff = (event: MouseEvent | PointerEvent) => {
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(built.drawer, true).find((candidate) => candidate.object.userData.stuffId);
      const id = hit?.object.userData.stuffId as PersonalStuffId | undefined;
      return id ? built.stuffGroups.get(id) ?? null : null;
    };
    const pointerDown = (event: PointerEvent) => {
      pointerOrigin = { x: event.clientX, y: event.clientY };
      didDrag = false;
    };
    const positionLabel = (event: PointerEvent) => {
      const label = labelRef.current;
      if (!label || !current) return;
      const bounds = renderer.domElement.getBoundingClientRect();
      const labelWidth = label.offsetWidth || 120;
      const labelHeight = label.offsetHeight || 31;
      const localX = event.clientX - bounds.left;
      const localY = event.clientY - bounds.top;
      const left = THREE.MathUtils.clamp(localX + 16, 12, bounds.width - labelWidth - 12);
      const top = THREE.MathUtils.clamp(localY - 10, labelHeight + 12, bounds.height - 12);
      label.style.left = `${left}px`;
      label.style.top = `${top}px`;
    };
    const pointerMove = (event: PointerEvent) => {
      if (pointerOrigin && Math.hypot(event.clientX - pointerOrigin.x, event.clientY - pointerOrigin.y) > 7) {
        didDrag = true;
        setHover(null);
      }
      if (!didDrag) {
        if (drawerState.current) {
          const stuff = hitTestStuff(event);
          setStuffHover(stuff);
          setHover(stuff ? null : hitTest(event));
        } else {
          setStuffHover(null);
          setHover(enteredState.current ? hitTest(event) : null);
        }
        positionLabel(event);
        requestAnimationFrame(() => positionLabel(event));
      }
    };
    const pointerLeave = () => { setHover(null); setStuffHover(null); };
    const activate = (event: MouseEvent) => {
      pointerOrigin = null;
      if (didDrag) { didDrag = false; return; }
      if (!enteredState.current) return;
      if (drawerState.current) {
        const selectedStuff = hitTestStuff(event);
        if (selectedStuff) {
          const id = selectedStuff.userData.stuffId as PersonalStuffId;
          const world = new THREE.Vector3();
          selectedStuff.getWorldPosition(world);
          world.project(camera);
          const bounds = renderer.domElement.getBoundingClientRect();
          callbacks.current.onStuffSelect(id, {
            x: bounds.left + (world.x + 1) * bounds.width / 2,
            y: bounds.top + (1 - world.y) * bounds.height / 2,
            width: Math.max(44, bounds.width * 0.055),
            height: Math.max(44, bounds.height * 0.075),
          });
          setStuffHover(null);
          return;
        }
        const drawerTarget = hitTest(event);
        if (drawerTarget?.id === 'drawer') {
          setHover(null);
          callbacks.current.onDrawerToggle();
        }
        return;
      }
      const selected = hitTest(event);
      window.__DESK_LAST_HIT__ = selected?.id ?? 'none';
      if (!selected || feedbackBusy) return;
      if (selected.id === 'drawer') { setHover(null); callbacks.current.onDrawerToggle(); return; }
      const fx = built.feedback;
      if (selected.id === 'lamp') {
        lampOn = !lampOn;
        gsap.timeline({ defaults: { ease: 'power2.inOut' }, onUpdate: render })
          .to(fx.shade.rotation, { z: lampOn ? -0.5 : -0.6, duration: 0.2 })
          .to(fx.lampLight, { intensity: lampOn ? 3.8 : 0, duration: 0.32 }, 0)
          .to(fx.lampSpot, { intensity: lampOn ? 7.5 : 0, duration: 0.36 }, 0)
          .to(fx.bulbMaterial, { emissiveIntensity: lampOn ? 4.6 : 0.04, duration: 0.28 }, 0)
          .to(fx.beamMaterial, { opacity: lampOn ? 0.22 : 0, duration: 0.38 }, 0.04)
          .to(fx.poolMaterial, { opacity: lampOn ? 0.18 : 0, duration: 0.34 }, 0.08)
          .to(fx.shade.rotation, { z: -0.5, duration: 0.28, ease: 'back.out(2)' });
        return;
      }

      feedbackBusy = true;
      setHover(null);
      const openAtPeak = (panel: DeskPanel) => callbacks.current.onSelect(panel);
      if (selected.id === 'video') {
        gsap.timeline({ defaults: { ease: 'power2.inOut' }, onUpdate: render, onComplete: () => { feedbackBusy = false; } })
          .to(fx.computerButton.scale, { y: 0.52, duration: 0.12 }, 0)
          .to(fx.screenMaterial, { emissiveIntensity: 1.25, duration: 0.32 }, 0)
          .to(fx.computer.position, { y: '+=0.14', duration: 0.25, ease: 'back.out(1.8)' }, 0)
          .call(() => openAtPeak('video'), undefined, 0.34)
          .to(fx.computer.position, { y: '-=0.14', duration: 0.3 }, 0.38)
          .to(fx.screenMaterial, { emissiveIntensity: 0.04, duration: 0.4 }, 0.5)
          .to(fx.computerButton.scale, { y: 1, duration: 0.2 }, 0.42);
      } else if (selected.id === 'photo') {
        gsap.timeline({ defaults: { ease: 'power2.inOut' }, onUpdate: render, onComplete: () => { feedbackBusy = false; } })
          .to(fx.shutterButton.scale, { y: 0.45, duration: 0.1 }, 0)
          .to(fx.camera.rotation, { z: -0.075, duration: 0.14 }, 0)
          .to(fx.lens.position, { z: 0.16, duration: 0.22, ease: 'back.out(2.2)' }, 0.04)
          .to(fx.flashMaterial, { emissiveIntensity: 7, duration: 0.06, ease: 'power4.in' }, 0.2)
          .to(fx.flashMaterial, { emissiveIntensity: 0, duration: 0.24 }, 0.26)
          .call(() => openAtPeak('photo'), undefined, 0.28)
          .to(fx.camera.rotation, { z: 0, duration: 0.3, ease: 'elastic.out(1,.5)' }, 0.3)
          .to(fx.lens.position, { z: 0, duration: 0.26 }, 0.32)
          .to(fx.shutterButton.scale, { y: 1, duration: 0.2 }, 0.26);
      } else if (selected.id === 'design') {
        gsap.timeline({ defaults: { ease: 'power3.inOut' }, onUpdate: render, onComplete: () => { feedbackBusy = false; } })
          .to(fx.zine.position, { y: '+=0.48', duration: 0.32 }, 0)
          .to(fx.zine.rotation, { z: 0.11, x: -0.13, duration: 0.32 }, 0)
          .call(() => openAtPeak('design'), undefined, 0.3)
          .to(fx.zine.position, { y: '-=0.48', duration: 0.34 }, 0.34)
          .to(fx.zine.rotation, { z: 0, x: 0, duration: 0.34 }, 0.34);
      } else if (selected.id === 'planning') {
        gsap.timeline({ defaults: { ease: 'power3.inOut' }, onUpdate: render, onComplete: () => { feedbackBusy = false; } })
          .to(fx.folderFlap.rotation, { x: -0.72, duration: 0.36 }, 0)
          .to(fx.folderPaper.position, { z: 0.35, y: 0.12, duration: 0.34 }, 0.08)
          .call(() => openAtPeak('planning'), undefined, 0.34)
          .to(fx.folderPaper.position, { z: 0, y: 0, duration: 0.3 }, 0.42)
          .to(fx.folderFlap.rotation, { x: 0, duration: 0.34 }, 0.44);
      } else if (selected.id === 'polaroid') {
        gsap.timeline({ defaults: { ease: 'power3.inOut' }, onUpdate: render, onComplete: () => { feedbackBusy = false; } })
          .to(fx.polaroid.position, { y: '+=0.52', duration: 0.32 }, 0)
          .to(fx.polaroid.rotation, { x: -0.34, z: -0.12, duration: 0.32 }, 0)
          .call(() => openAtPeak('polaroid'), undefined, 0.3)
          .to(fx.polaroid.position, { y: '-=0.52', duration: 0.34 }, 0.36)
          .to(fx.polaroid.rotation, { x: 0, z: 0, duration: 0.34 }, 0.36);
      } else if (selected.id === 'badge') {
        gsap.timeline({ defaults: { ease: 'power2.inOut' }, onUpdate: render, onComplete: () => { feedbackBusy = false; } })
          .to(fx.badge.position, { y: '+=0.42', duration: 0.28, ease: 'back.out(1.8)' }, 0)
          .to(fx.badge.rotation, { z: 0.18, duration: 0.16 }, 0)
          .to(fx.badge.rotation, { z: -0.1, duration: 0.16 }, 0.16)
          .call(() => openAtPeak('badge'), undefined, 0.3)
          .to(fx.badge.rotation, { z: 0, duration: 0.22 }, 0.32)
          .to(fx.badge.position, { y: '-=0.42', duration: 0.32 }, 0.34);
      }
    };
    renderer.domElement.addEventListener('pointerdown', pointerDown);
    renderer.domElement.addEventListener('pointermove', pointerMove);
    renderer.domElement.addEventListener('pointerleave', pointerLeave);
    renderer.domElement.addEventListener('click', activate);

    const render = () => {
      camera.lookAt(target);
      renderer.render(scene, camera);
    };
    scene.userData.invalidate = render;
    const degrees = THREE.MathUtils.degToRad;
    const configureControls = (mode: 'far' | 'near' | 'drawer') => {
      const view = mode === 'far' ? FAR : mode === 'near' ? NEAR : DRAWER;
      const offset = view.position.clone().sub(view.target);
      const azimuth = Math.atan2(offset.x, offset.z);
      const pitchRange = mode === 'far' ? [10, 25] : [22, 38];
      controls.minAzimuthAngle = azimuth - degrees(18);
      controls.maxAzimuthAngle = azimuth + degrees(18);
      controls.minPolarAngle = degrees(90 - pitchRange[1]);
      controls.maxPolarAngle = degrees(90 - pitchRange[0]);
      controls.enabled = mode !== 'drawer';
      controls.update();
      renderer.domElement.style.cursor = controls.enabled ? 'grab' : 'default';
    };
    let settleFrames = 0;
    let animationFrame = 0;
    const onControlStart = () => {
      settleFrames = 0;
      setHover(null);
      renderer.domElement.style.cursor = 'grabbing';
    };
    const onControlEnd = () => {
      settleFrames = 72;
      renderer.domElement.style.cursor = 'grab';
    };
    const onControlChange = () => render();
    const updateControls = () => {
      animationFrame = requestAnimationFrame(updateControls);
      if (settleFrames > 0 && controls.enabled) {
        controls.update();
        settleFrames -= 1;
      }
    };
    controls.addEventListener('start', onControlStart);
    controls.addEventListener('end', onControlEnd);
    controls.addEventListener('change', onControlChange);
    configureControls('far');
    updateControls();
    const resize = () => {
      const width = Math.max(1, mount.clientWidth), height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); render();
    };
    const observer = new ResizeObserver(resize); observer.observe(mount); resize();
    runtime.current = { scene, camera, renderer, target, drawer: built.drawer, cameraObject: built.cameraObject, lens: built.lens, controls, configureControls, interactives: built.interactives, stuffGroups: built.stuffGroups, clearHover: () => { setHover(null); setStuffHover(null); }, render, resize };
    window.__IMG2THREEJS_READY__ = true;

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrame);
      controls.removeEventListener('start', onControlStart);
      controls.removeEventListener('end', onControlEnd);
      controls.removeEventListener('change', onControlChange);
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', pointerDown);
      renderer.domElement.removeEventListener('pointermove', pointerMove);
      renderer.domElement.removeEventListener('pointerleave', pointerLeave);
      renderer.domElement.removeEventListener('click', activate);
      gsap.killTweensOf(camera.position); gsap.killTweensOf(target); gsap.killTweensOf(built.drawer.position);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose(); renderer.domElement.remove(); runtime.current = null;
    };
  }, []);

  useEffect(() => {
    const rt = runtime.current;
    if (!rt) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = drawerOpen ? DRAWER : entered ? NEAR : FAR;
    const mode = drawerOpen ? 'drawer' : entered ? 'near' : 'far';
    const duration = reduceMotion ? 0 : drawerOpen ? 1.08 : 1.02;
    rt.clearHover();
    rt.controls.enabled = false;
    const timeline = gsap.timeline({
      defaults: { duration, ease: 'power3.inOut', overwrite: 'auto' },
      onUpdate: rt.render,
      onComplete: () => rt.configureControls(mode),
    });
    timeline.to(rt.camera.position, { x: state.position.x, y: state.position.y, z: state.position.z }, 0)
      .to(rt.target, { x: state.target.x, y: state.target.y, z: state.target.z }, 0);
    if (drawerOpen) timeline.to(rt.drawer.position, { z: 2.72, duration: reduceMotion ? 0 : 0.92, ease: 'power2.inOut' }, 0.16);
    else timeline.to(rt.drawer.position, { z: 0, duration: reduceMotion ? 0 : 0.76, ease: 'power3.inOut' }, 0);
    return () => { timeline.kill(); };
  }, [entered, drawerOpen]);

  return (
    <div className="desk-scene" ref={mountRef}>
      <div ref={labelRef} className={`desk-hover-label${hoveredLabel ? ' is-visible' : ''}`}>{hoveredLabel}</div>
    </div>
  );
}

declare global {
  interface Window { __IMG2THREEJS_READY__?: boolean; __DESK_LAST_HIT__?: string }
}
