export type RenderMode = 'ball-and-stick' | 'space-filling' | 'wireframe' | 'surface';

export interface Atom {
  id: number;
  element: string; // e.g. "C", "H", "O", "N"
  x: number;
  y: number;
  z: number;
  formalCharge?: number;
  name?: string;
}

export interface Bond {
  id: number;
  atom1Id: number;
  atom2Id: number;
  order: number; // 1 = single, 2 = double, 3 = triple, 1.5 = aromatic
}

export interface MoleculeData {
  id: string;
  name: string;
  formula: string;
  molecularMass: number; // g/mol
  iupacName?: string;
  smiles?: string;
  description?: string;
  atoms: Atom[];
  bonds: Bond[];
  geometryType?: string;
  pubchemCid?: number;
  category?: 'basic' | 'organic' | 'bio' | 'crystal' | 'polymer';
}

export interface ElementCPK {
  symbol: string;
  name: string;
  color: string;
  covalentRadius: number; // Å
  vdwRadius: number; // Å
  atomicMass: number; // g/mol
  electronegativity: number; // Pauling scale
  atomicNumber: number;
}

export interface NewmanInfo {
  detected: boolean;
  frontAtomId: number;
  rearAtomId: number;
  bondAxisVector: [number, number, number];
  alignmentAngleDeg: number;
  dihedralAngleDeg: number;
  conformation: 'eclipsed' | 'staggered' | 'intermediate';
  substituentsFront: string[];
  substituentsRear: string[];
}

export interface BondAngleMeasurement {
  atom1Id: number;
  atom2Id: number; // Central atom
  atom3Id: number;
  angleDeg: number;
  screenCoords: {
    p1: { x: number; y: number };
    p2: { x: number; y: number };
    p3: { x: number; y: number };
  };
}

export interface SpatialOccupancyData {
  apparentAreaRatio: number; // 0 to 100%
  boundingVolume: number; // Å³
  vdwTotalVolume: number; // Å³
  aspectRatio: number;
}

export type SheetState = 'min' | 'half' | 'full';
export type ActiveTab = 'molecule' | 'display' | 'analysis' | 'settings';
