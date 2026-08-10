import * as THREE from 'three';
import { Atom, Bond, BondAngleMeasurement, MoleculeData, NewmanInfo, SpatialOccupancyData } from '../types';

/**
 * Calculates 3D angle between three atoms A - B - C (B is central atom) in degrees
 */
export function calculateBondAngle(
  atomA: { x: number; y: number; z: number },
  atomB: { x: number; y: number; z: number },
  atomC: { x: number; y: number; z: number }
): number {
  const vBA = new THREE.Vector3(atomA.x - atomB.x, atomA.y - atomB.y, atomA.z - atomB.z).normalize();
  const vBC = new THREE.Vector3(atomC.x - atomB.x, atomC.y - atomB.y, atomC.z - atomB.z).normalize();

  const dot = THREE.MathUtils.clamp(vBA.dot(vBC), -1, 1);
  const angleRad = Math.acos(dot);
  return Math.round((angleRad * (180 / Math.PI)) * 10) / 10;
}

/**
 * Calculates Dihedral Angle (torsion) between 4 atoms A - B - C - D in degrees
 */
export function calculateDihedralAngle(
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  p3: THREE.Vector3,
  p4: THREE.Vector3
): number {
  const b1 = new THREE.Vector3().subVectors(p2, p1);
  const b2 = new THREE.Vector3().subVectors(p3, p2);
  const b3 = new THREE.Vector3().subVectors(p4, p3);

  const n1 = new THREE.Vector3().crossVectors(b1, b2).normalize();
  const n2 = new THREE.Vector3().crossVectors(b2, b3).normalize();

  const m1 = new THREE.Vector3().crossVectors(n1, b2.clone().normalize());
  
  const x = n1.dot(n2);
  const y = m1.dot(n2);

  let angleRad = Math.atan2(y, x);
  let angleDeg = Math.round((angleRad * (180 / Math.PI)) * 10) / 10;
  return Math.abs(angleDeg);
}

/**
 * Detects if the current camera view aligns with any key bond (C-C, C-N, etc.) to form a Newman Projection
 */
export function detectNewmanProjection(
  molecule: MoleculeData,
  camera: THREE.Camera,
  moleculeGroup: THREE.Group,
  alignmentThresholdDeg: number = 12
): NewmanInfo {
  const defaultInfo: NewmanInfo = {
    detected: false,
    frontAtomId: -1,
    rearAtomId: -1,
    bondAxisVector: [0, 0, 0],
    alignmentAngleDeg: 180,
    dihedralAngleDeg: 0,
    conformation: 'intermediate',
    substituentsFront: [],
    substituentsRear: [],
  };

  if (!molecule || molecule.atoms.length < 2) return defaultInfo;

  // Get camera view direction in world coordinates
  const camDir = new THREE.Vector3();
  camera.getWorldDirection(camDir); // Points away from camera (along view ray)

  // Find C-C or C-X bonds to check for Newman view
  const candidateBonds = molecule.bonds.filter((bond) => {
    const a1 = molecule.atoms.find((a) => a.id === bond.atom1Id);
    const a2 = molecule.atoms.find((a) => a.id === bond.atom2Id);
    if (!a1 || !a2) return false;
    // Prefer Carbon-Carbon or heavy atom bonds
    return (a1.element === 'C' && a2.element === 'C') || (a1.element !== 'H' && a2.element !== 'H');
  });

  if (candidateBonds.length === 0) return defaultInfo;

  let bestBond: Bond | null = null;
  let minAlignAngle = 180;
  let isAtom1Front = true;
  let bondWorldDir = new THREE.Vector3();

  candidateBonds.forEach((bond) => {
    const a1 = molecule.atoms.find((a) => a.id === bond.atom1Id)!;
    const a2 = molecule.atoms.find((a) => a.id === bond.atom2Id)!;

    const v1 = new THREE.Vector3(a1.x, a1.y, a1.z).applyMatrix4(moleculeGroup.matrixWorld);
    const v2 = new THREE.Vector3(a2.x, a2.y, a2.z).applyMatrix4(moleculeGroup.matrixWorld);

    // Vector from Atom1 to Atom2
    const vAxis = new THREE.Vector3().subVectors(v2, v1).normalize();

    // Angle between bond axis and camera ray direction
    const dotVal = THREE.MathUtils.clamp(vAxis.dot(camDir), -1, 1);
    const angleRad = Math.acos(Math.abs(dotVal));
    const angleDeg = angleRad * (180 / Math.PI);

    if (angleDeg < minAlignAngle) {
      minAlignAngle = angleDeg;
      bestBond = bond;
      // Determine which atom is closer to camera (front atom)
      const dist1 = camera.position.distanceTo(v1);
      const dist2 = camera.position.distanceTo(v2);
      isAtom1Front = dist1 < dist2;
      bondWorldDir = vAxis;
    }
  });

  if (bestBond && minAlignAngle <= alignmentThresholdDeg) {
    const b = bestBond as Bond;
    const frontAtom = molecule.atoms.find((a) => a.id === (isAtom1Front ? b.atom1Id : b.atom2Id));
    const rearAtom = molecule.atoms.find((a) => a.id === (isAtom1Front ? b.atom2Id : b.atom1Id));

    if (!frontAtom || !rearAtom) return defaultInfo;

    // Find front and rear substituents
    const frontSubstituents = molecule.bonds
      .filter((bond) => (bond.atom1Id === frontAtom.id || bond.atom2Id === frontAtom.id) && bond.atom1Id !== rearAtom.id && bond.atom2Id !== rearAtom.id)
      .map((bond) => {
        const otherId = bond.atom1Id === frontAtom.id ? bond.atom2Id : bond.atom1Id;
        return molecule.atoms.find((a) => a.id === otherId)?.element || '?';
      });

    const rearSubstituents = molecule.bonds
      .filter((bond) => (bond.atom1Id === rearAtom.id || bond.atom2Id === rearAtom.id) && bond.atom1Id !== frontAtom.id && bond.atom2Id !== frontAtom.id)
      .map((bond) => {
        const otherId = bond.atom1Id === rearAtom.id ? bond.atom2Id : bond.atom1Id;
        return molecule.atoms.find((a) => a.id === otherId)?.element || '?';
      });

    // Estimate Dihedral Angle for conformation classification
    const frontSubId = molecule.bonds.find((bond) => (bond.atom1Id === frontAtom.id && bond.atom2Id !== rearAtom.id) || (bond.atom2Id === frontAtom.id && bond.atom1Id !== rearAtom.id));
    const rearSubId = molecule.bonds.find((bond) => (bond.atom1Id === rearAtom.id && bond.atom2Id !== frontAtom.id) || (bond.atom2Id === rearAtom.id && bond.atom1Id !== frontAtom.id));

    let dihedral = 60;
    if (frontSubId && rearSubId) {
      const fSubAtomId = frontSubId.atom1Id === frontAtom.id ? frontSubId.atom2Id : frontSubId.atom1Id;
      const rSubAtomId = rearSubId.atom1Id === rearAtom.id ? rearSubId.atom2Id : rearSubId.atom1Id;

      const pA = molecule.atoms.find((a) => a.id === fSubAtomId);
      const pB = frontAtom;
      const pC = rearAtom;
      const pD = molecule.atoms.find((a) => a.id === rSubAtomId);

      if (pA && pB && pC && pD) {
        dihedral = calculateDihedralAngle(
          new THREE.Vector3(pA.x, pA.y, pA.z),
          new THREE.Vector3(pB.x, pB.y, pB.z),
          new THREE.Vector3(pC.x, pC.y, pC.z),
          new THREE.Vector3(pD.x, pD.y, pD.z)
        );
      }
    }

    let conformation: 'eclipsed' | 'staggered' | 'intermediate' = 'intermediate';
    const normDihedral = dihedral % 60;
    if (normDihedral <= 15 || normDihedral >= 45) {
      conformation = normDihedral <= 15 ? 'eclipsed' : 'staggered';
    } else {
      conformation = 'staggered';
    }

    return {
      detected: true,
      frontAtomId: frontAtom.id,
      rearAtomId: rearAtom.id,
      bondAxisVector: [bondWorldDir.x, bondWorldDir.y, bondWorldDir.z],
      alignmentAngleDeg: Math.round(minAlignAngle * 10) / 10,
      dihedralAngleDeg: dihedral,
      conformation,
      substituentsFront: frontSubstituents,
      substituentsRear: rearSubstituents,
    };
  }

  return defaultInfo;
}

/**
 * Computes the apparent spatial occupancy metric based on projected 2D screen area and 3D bounding volume
 */
export function calculateSpatialOccupancy(
  molecule: MoleculeData,
  camera: THREE.Camera,
  moleculeGroup: THREE.Group,
  canvasWidth: number,
  canvasHeight: number
): SpatialOccupancyData {
  if (!molecule || molecule.atoms.length === 0 || canvasWidth === 0 || canvasHeight === 0) {
    return { apparentAreaRatio: 0, boundingVolume: 0, vdwTotalVolume: 0, aspectRatio: 1 };
  }

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  let minPxX = Infinity, maxPxX = -Infinity;
  let minPxY = Infinity, maxPxY = -Infinity;

  let totalVdwVolume = 0;

  molecule.atoms.forEach((atom) => {
    // 3D world bounds
    minX = Math.min(minX, atom.x);
    maxX = Math.max(maxX, atom.x);
    minY = Math.min(minY, atom.y);
    maxY = Math.max(maxY, atom.y);
    minZ = Math.min(minZ, atom.z);
    maxZ = Math.max(maxZ, atom.z);

    // vdW sphere volume = 4/3 * pi * r^3
    const r = 1.2; // approx average vdW radius
    totalVdwVolume += (4 / 3) * Math.PI * Math.pow(r, 3);

    // Screen projection bounds
    const vec = new THREE.Vector3(atom.x, atom.y, atom.z).applyMatrix4(moleculeGroup.matrixWorld);
    vec.project(camera);

    const px = (vec.x * 0.5 + 0.5) * canvasWidth;
    const py = (-(vec.y * 0.5) + 0.5) * canvasHeight;

    minPxX = Math.min(minPxX, px);
    maxPxX = Math.max(maxPxX, px);
    minPxY = Math.min(minPxY, py);
    maxPxY = Math.max(maxPxY, py);
  });

  const width3D = Math.max(0.1, maxX - minX + 2.0);
  const height3D = Math.max(0.1, maxY - minY + 2.0);
  const depth3D = Math.max(0.1, maxZ - minZ + 2.0);
  const boundingVolume = Math.round(width3D * height3D * depth3D * 10) / 10;

  const projWidth = Math.max(10, maxPxX - minPxX);
  const projHeight = Math.max(10, maxPxY - minPxY);
  const projArea = projWidth * projHeight;
  const viewportArea = canvasWidth * canvasHeight;

  const apparentAreaRatio = Math.min(100, Math.round((projArea / viewportArea) * 100 * 10) / 10);
  const aspectRatio = Math.round((projWidth / projHeight) * 100) / 100;

  return {
    apparentAreaRatio,
    boundingVolume,
    vdwTotalVolume: Math.round(totalVdwVolume * 10) / 10,
    aspectRatio,
  };
}

/**
 * Helper to project 3D point to 2D canvas pixel coordinates
 */
export function project3DTo2D(
  pos: { x: number; y: number; z: number },
  camera: THREE.Camera,
  moleculeGroup: THREE.Group,
  width: number,
  height: number
): { x: number; y: number; visible: boolean } {
  const vec = new THREE.Vector3(pos.x, pos.y, pos.z).applyMatrix4(moleculeGroup.matrixWorld);
  
  // Check if point is behind camera
  const camPos = camera.position.clone();
  const dirToPoint = vec.clone().sub(camPos);
  const camDir = new THREE.Vector3();
  camera.getWorldDirection(camDir);

  const visible = dirToPoint.dot(camDir) > 0;

  vec.project(camera);

  const x = (vec.x * 0.5 + 0.5) * width;
  const y = (-(vec.y * 0.5) + 0.5) * height;

  return { x, y, visible };
}
