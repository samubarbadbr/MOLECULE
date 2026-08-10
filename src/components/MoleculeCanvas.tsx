import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Atom, MoleculeData, RenderMode } from '../types';
import { getElementCPK } from '../utils/cpkData';

interface MoleculeCanvasProps {
  molecule: MoleculeData;
  renderMode: RenderMode;
  autoRotate: boolean;
  selectedAtomIds: number[];
  onSelectAtom: (atomId: number) => void;
  onUpdate3DState: (camera: THREE.Camera, group: THREE.Group) => void;
}

export const MoleculeCanvas: React.FC<MoleculeCanvasProps> = ({
  molecule,
  renderMode,
  autoRotate,
  selectedAtomIds,
  onSelectAtom,
  onUpdate3DState,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const moleculeGroupRef = useRef<THREE.Group | null>(null);

  // Rotation & Inertia state
  const rotationState = useRef({
    rx: 0.3,
    ry: 0.5,
    vx: 0,
    vy: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    pinchDist: 0,
    cameraDist: 14,
    targetCameraDist: 14,
    panX: 0,
    panY: 0,
  });

  const lastTapTimeRef = useRef<number>(0);
  const materialsRef = useRef<THREE.Material[]>([]);
  const geometriesRef = useRef<THREE.BufferGeometry[]>([]);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // OLED pure black
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 14);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Molecule Group
    const group = new THREE.Group();
    scene.add(group);
    moleculeGroupRef.current = group;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight1.position.set(10, 15, 12);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x00f0ff, 0.6); // Cyan rim light
    dirLight2.position.set(-10, -10, -10);
    scene.add(dirLight2);

    // Resize Observer
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (moleculeGroupRef.current && cameraRef.current) {
        const state = rotationState.current;

        if (autoRotate && !state.isDragging) {
          state.ry += 0.006;
        } else if (!state.isDragging) {
          // Inertia damping
          state.rx += state.vx;
          state.ry += state.vy;
          state.vx *= 0.92;
          state.vy *= 0.92;
        }

        moleculeGroupRef.current.rotation.x = state.rx;
        moleculeGroupRef.current.rotation.y = state.ry;

        // Smooth Zoom Interpolation
        state.cameraDist += (state.targetCameraDist - state.cameraDist) * 0.12;
        cameraRef.current.position.z = state.cameraDist;
        cameraRef.current.position.x = state.panX;
        cameraRef.current.position.y = state.panY;

        renderer.render(scene, cameraRef.current);
        onUpdate3DState(cameraRef.current, moleculeGroupRef.current);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (rendererRef.current && rendererRef.current.domElement) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Build / Rebuild 3D Molecule Mesh when molecule or renderMode changes
  const buildMoleculeScene = useCallback(() => {
    const group = moleculeGroupRef.current;
    if (!group) return;

    // Cleanup previous objects to prevent memory leaks
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
    }
    materialsRef.current.forEach((m) => m.dispose());
    geometriesRef.current.forEach((g) => g.dispose());
    materialsRef.current = [];
    geometriesRef.current = [];

    if (!molecule || molecule.atoms.length === 0) return;

    const atomCount = molecule.atoms.length;
    // Adapt detail resolution for 60 FPS
    const sphereSegments = atomCount > 40 ? 12 : 24;
    const cylinderSegments = atomCount > 40 ? 8 : 16;

    const baseAtomRadius = renderMode === 'space-filling' ? 1.0 : 0.42;
    const bondRadius = 0.12;

    // Helper map for atom positions
    const atomPosMap = new Map<number, THREE.Vector3>();

    // Render Atoms
    molecule.atoms.forEach((atom) => {
      const cpk = getElementCPK(atom.element);
      const pos = new THREE.Vector3(atom.x, atom.y, atom.z);
      atomPosMap.set(atom.id, pos);

      const radius = renderMode === 'space-filling'
        ? cpk.vdwRadius * 0.75
        : Math.max(0.28, cpk.covalentRadius * 0.65);

      const geom = new THREE.SphereGeometry(radius, sphereSegments, sphereSegments);
      geometriesRef.current.push(geom);

      const isSelected = selectedAtomIds.includes(atom.id);

      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(cpk.color),
        roughness: 0.25,
        metalness: 0.15,
        emissive: isSelected ? new THREE.Color(0x00f0ff) : new THREE.Color(0x000000),
        emissiveIntensity: isSelected ? 0.6 : 0,
        wireframe: renderMode === 'wireframe',
      });
      materialsRef.current.push(mat);

      const sphereMesh = new THREE.Mesh(geom, mat);
      sphereMesh.position.copy(pos);
      sphereMesh.userData = { atomId: atom.id, type: 'atom' };
      group.add(sphereMesh);
    });

    // Render Bonds (Only if not space-filling)
    if (renderMode !== 'space-filling') {
      molecule.bonds.forEach((bond) => {
        const p1 = atomPosMap.get(bond.atom1Id);
        const p2 = atomPosMap.get(bond.atom2Id);
        const a1 = molecule.atoms.find((a) => a.id === bond.atom1Id);
        const a2 = molecule.atoms.find((a) => a.id === bond.atom2Id);

        if (!p1 || !p2 || !a1 || !a2) return;

        const cpk1 = getElementCPK(a1.element);
        const cpk2 = getElementCPK(a2.element);

        const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

        // Multiple bonds rendering (double/triple bonds)
        const bondOrder = bond.order || 1;
        const bondCount = Math.floor(bondOrder);
        const isAromatic = bondOrder === 1.5;

        const dir = new THREE.Vector3().subVectors(p2, p1);
        const length = dir.length();
        dir.normalize();

        // Perpendicular offset vector for multiple bonds
        let perp = new THREE.Vector3(0, 1, 0);
        if (Math.abs(dir.y) > 0.9) perp = new THREE.Vector3(1, 0, 0);
        const offsetVec = new THREE.Vector3().crossVectors(dir, perp).normalize().multiplyScalar(0.18);

        const offsets: THREE.Vector3[] = [new THREE.Vector3(0, 0, 0)];
        if (bondCount === 2 || isAromatic) {
          offsets[0] = offsetVec.clone().multiplyScalar(0.6);
          offsets[1] = offsetVec.clone().multiplyScalar(-0.6);
        } else if (bondCount === 3) {
          offsets[0] = new THREE.Vector3(0, 0, 0);
          offsets[1] = offsetVec.clone().multiplyScalar(1.0);
          offsets[2] = offsetVec.clone().multiplyScalar(-1.0);
        }

        offsets.forEach((off, idx) => {
          const currentBondRadius = bondRadius * (bondCount > 1 ? 0.75 : 1.0);

          // Half 1: P1 to Mid
          const geom1 = new THREE.CylinderGeometry(currentBondRadius, currentBondRadius, length / 2, cylinderSegments);
          geometriesRef.current.push(geom1);
          const mat1 = new THREE.MeshStandardMaterial({
            color: new THREE.Color(cpk1.color),
            roughness: 0.3,
            metalness: 0.1,
            wireframe: renderMode === 'wireframe',
          });
          materialsRef.current.push(mat1);

          const mesh1 = new THREE.Mesh(geom1, mat1);
          const half1Pos = new THREE.Vector3().addVectors(p1, midPoint).multiplyScalar(0.5).add(off);
          mesh1.position.copy(half1Pos);
          mesh1.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
          group.add(mesh1);

          // Half 2: Mid to P2
          const geom2 = new THREE.CylinderGeometry(currentBondRadius, currentBondRadius, length / 2, cylinderSegments);
          geometriesRef.current.push(geom2);
          const mat2 = new THREE.MeshStandardMaterial({
            color: new THREE.Color(cpk2.color),
            roughness: 0.3,
            metalness: 0.1,
            wireframe: renderMode === 'wireframe',
          });
          materialsRef.current.push(mat2);

          const mesh2 = new THREE.Mesh(geom2, mat2);
          const half2Pos = new THREE.Vector3().addVectors(midPoint, p2).multiplyScalar(0.5).add(off);
          mesh2.position.copy(half2Pos);
          mesh2.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
          group.add(mesh2);
        });
      });
    }

    // Surface Electron Cloud Mode
    if (renderMode === 'surface') {
      const surfaceGeom = new THREE.SphereGeometry(3.5, 32, 32);
      geometriesRef.current.push(surfaceGeom);
      const surfaceMat = new THREE.MeshPhongMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.15,
        wireframe: true,
      });
      materialsRef.current.push(surfaceMat);
      const surfaceMesh = new THREE.Mesh(surfaceGeom, surfaceMat);
      group.add(surfaceMesh);
    }
  }, [molecule, renderMode, selectedAtomIds]);

  useEffect(() => {
    buildMoleculeScene();
  }, [buildMoleculeScene]);

  // Pointer Events for Touch Orbit, Pinch-Zoom, Pan, and Atom Tap Selection
  const handlePointerDown = (e: React.PointerEvent) => {
    const state = rotationState.current;
    state.isDragging = true;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    state.vx = 0;
    state.vy = 0;

    // Double tap camera reset check
    const now = Date.now();
    if (now - lastTapTimeRef.current < 280) {
      // Reset Camera
      state.rx = 0.3;
      state.ry = 0.5;
      state.vx = 0;
      state.vy = 0;
      state.panX = 0;
      state.panY = 0;
      state.targetCameraDist = 14;
    }
    lastTapTimeRef.current = now;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const state = rotationState.current;
    if (!state.isDragging) return;

    const dx = e.clientX - state.lastX;
    const dy = e.clientY - state.lastY;

    state.vy = dx * 0.008;
    state.vx = dy * 0.008;

    state.ry += state.vy;
    state.rx += state.vx;

    state.lastX = e.clientX;
    state.lastY = e.clientY;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const state = rotationState.current;
    state.isDragging = false;

    // Raycast check on click / tap
    if (containerRef.current && cameraRef.current && moleculeGroupRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      const intersects = raycaster.intersectObjects(moleculeGroupRef.current.children, true);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData && hit.userData.atomId) {
          onSelectAtom(hit.userData.atomId);
        }
      }
    }
  };

  // Wheel Zoom (for desktop test)
  const handleWheel = (e: React.WheelEvent) => {
    const state = rotationState.current;
    state.targetCameraDist = THREE.MathUtils.clamp(state.targetCameraDist + e.deltaY * 0.012, 4, 30);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      className="relative w-full h-full bg-black select-none touch-none overflow-hidden cursor-grab active:cursor-grabbing"
    />
  );
};
