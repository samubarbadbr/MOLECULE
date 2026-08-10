import { ElementCPK } from '../types';

export const CPK_DATABASE: Record<string, ElementCPK> = {
  H: { symbol: 'H', name: 'Idrogeno', color: '#FFFFFF', covalentRadius: 0.31, vdwRadius: 1.20, atomicMass: 1.008, electronegativity: 2.20, atomicNumber: 1 },
  He: { symbol: 'He', name: 'Elio', color: '#D9FFFF', covalentRadius: 0.28, vdwRadius: 1.40, atomicMass: 4.002, electronegativity: 0, atomicNumber: 2 },
  Li: { symbol: 'Li', name: 'Litio', color: '#CC80FF', covalentRadius: 1.28, vdwRadius: 1.82, atomicMass: 6.941, electronegativity: 0.98, atomicNumber: 3 },
  Be: { symbol: 'Be', name: 'Berillio', color: '#C2FF00', covalentRadius: 0.96, vdwRadius: 1.53, atomicMass: 9.012, electronegativity: 1.57, atomicNumber: 4 },
  B: { symbol: 'B', name: 'Boro', color: '#FFB5B5', covalentRadius: 0.84, vdwRadius: 1.92, atomicMass: 10.81, electronegativity: 2.04, atomicNumber: 5 },
  C: { symbol: 'C', name: 'Carbonio', color: '#3A3A3C', covalentRadius: 0.76, vdwRadius: 1.70, atomicMass: 12.011, electronegativity: 2.55, atomicNumber: 6 },
  N: { symbol: 'N', name: 'Azoto', color: '#2563EB', covalentRadius: 0.71, vdwRadius: 1.55, atomicMass: 14.007, electronegativity: 3.04, atomicNumber: 7 },
  O: { symbol: 'O', name: 'Ossigeno', color: '#DC2626', covalentRadius: 0.66, vdwRadius: 1.52, atomicMass: 15.999, electronegativity: 3.44, atomicNumber: 8 },
  F: { symbol: 'F', name: 'Fluoro', color: '#16A34A', covalentRadius: 0.57, vdwRadius: 1.47, atomicMass: 18.998, electronegativity: 3.98, atomicNumber: 9 },
  Ne: { symbol: 'Ne', name: 'Neon', color: '#B3E5FC', covalentRadius: 0.58, vdwRadius: 1.54, atomicMass: 20.180, electronegativity: 0, atomicNumber: 10 },
  Na: { symbol: 'Na', name: 'Sodio', color: '#9333EA', covalentRadius: 1.66, vdwRadius: 2.27, atomicMass: 22.990, electronegativity: 0.93, atomicNumber: 11 },
  Mg: { symbol: 'Mg', name: 'Magnesio', color: '#15803D', covalentRadius: 1.41, vdwRadius: 1.73, atomicMass: 24.305, electronegativity: 1.31, atomicNumber: 12 },
  Al: { symbol: 'Al', name: 'Alluminio', color: '#FAFAF9', covalentRadius: 1.21, vdwRadius: 1.84, atomicMass: 26.982, electronegativity: 1.61, atomicNumber: 13 },
  Si: { symbol: 'Si', name: 'Silicio', color: '#DAA520', covalentRadius: 1.11, vdwRadius: 2.10, atomicMass: 28.085, electronegativity: 1.90, atomicNumber: 14 },
  P: { symbol: 'P', name: 'Fosforo', color: '#EA580C', covalentRadius: 1.07, vdwRadius: 1.80, atomicMass: 30.974, electronegativity: 2.19, atomicNumber: 15 },
  S: { symbol: 'S', name: 'Zolfo', color: '#CA8A04', covalentRadius: 1.05, vdwRadius: 1.80, atomicMass: 32.06, electronegativity: 2.58, atomicNumber: 16 },
  Cl: { symbol: 'Cl', name: 'Cloro', color: '#059669', covalentRadius: 1.02, vdwRadius: 1.75, atomicMass: 35.45, electronegativity: 3.16, atomicNumber: 17 },
  K: { symbol: 'K', name: 'Potassio', color: '#8F40D4', covalentRadius: 2.03, vdwRadius: 2.75, atomicMass: 39.098, electronegativity: 0.82, atomicNumber: 19 },
  Ca: { symbol: 'Ca', name: 'Calcio', color: '#3D8080', covalentRadius: 1.76, vdwRadius: 2.31, atomicMass: 40.078, electronegativity: 1.00, atomicNumber: 20 },
  Fe: { symbol: 'Fe', name: 'Ferro', color: '#E06633', covalentRadius: 1.24, vdwRadius: 2.04, atomicMass: 55.845, electronegativity: 1.83, atomicNumber: 26 },
  Cu: { symbol: 'Cu', name: 'Rame', color: '#C88033', covalentRadius: 1.32, vdwRadius: 1.40, atomicMass: 63.546, electronegativity: 1.90, atomicNumber: 29 },
  Zn: { symbol: 'Zn', name: 'Zinco', color: '#7D80B0', covalentRadius: 1.22, vdwRadius: 1.39, atomicMass: 65.38, electronegativity: 1.65, atomicNumber: 30 },
  Br: { symbol: 'Br', name: 'Bromo', color: '#A62929', covalentRadius: 1.20, vdwRadius: 1.85, atomicMass: 79.904, electronegativity: 2.96, atomicNumber: 35 },
  I: { symbol: 'I', name: 'Iodio', color: '#9400D3', covalentRadius: 1.39, vdwRadius: 1.98, atomicMass: 126.90, electronegativity: 2.66, atomicNumber: 53 },
};

const DEFAULT_CPK: ElementCPK = {
  symbol: 'X',
  name: 'Elemento Sconosciuto',
  color: '#FF00FF',
  covalentRadius: 0.80,
  vdwRadius: 1.50,
  atomicMass: 12.0,
  electronegativity: 2.0,
  atomicNumber: 0,
};

export function getElementCPK(symbol: string): ElementCPK {
  const cleanSymbol = symbol.trim();
  const formatted = cleanSymbol.charAt(0).toUpperCase() + cleanSymbol.slice(1).toLowerCase();
  return CPK_DATABASE[formatted] || { ...DEFAULT_CPK, symbol: cleanSymbol };
}
