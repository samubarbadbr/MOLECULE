import { Atom, Bond, MoleculeData } from '../types';
import { getElementCPK } from './cpkData';

/**
 * Parses SDF (Structure-Data File) block into MoleculeData structure
 */
export function parseSDF(sdfText: string, moleculeName: string = 'Molecola PubChem'): MoleculeData {
  const lines = sdfText.split(/\r?\n/);
  if (lines.length < 4) {
    throw new Error('Formato SDF non valido o troppo corto');
  }

  const titleLine = lines[0].trim() || moleculeName;
  
  // Find Counts line (Line 4 in standard V2000 SDF)
  let countsLineIndex = -1;
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    if (lines[i].includes('V2000') || lines[i].includes('V3000')) {
      countsLineIndex = i;
      break;
    }
  }

  if (countsLineIndex === -1) {
    // Fallback: look for typical 3-digit counts line
    countsLineIndex = 3;
  }

  const countsLine = lines[countsLineIndex] || '';
  const numAtoms = parseInt(countsLine.substring(0, 3).trim(), 10) || 0;
  const numBonds = parseInt(countsLine.substring(3, 6).trim(), 10) || 0;

  const atoms: Atom[] = [];
  const bonds: Bond[] = [];

  const atomStartIndex = countsLineIndex + 1;
  const bondStartIndex = atomStartIndex + numAtoms;

  // Parse Atoms
  for (let i = 0; i < numAtoms; i++) {
    const lineIndex = atomStartIndex + i;
    if (lineIndex >= lines.length) break;
    const line = lines[lineIndex];

    const x = parseFloat(line.substring(0, 10).trim());
    const y = parseFloat(line.substring(10, 20).trim());
    const z = parseFloat(line.substring(20, 30).trim());
    const symbol = line.substring(30, 34).trim();

    if (!isNaN(x) && !isNaN(y) && !isNaN(z) && symbol) {
      atoms.push({
        id: i + 1,
        element: symbol,
        x,
        y,
        z,
        name: `${symbol}${i + 1}`,
      });
    }
  }

  // Parse Bonds
  for (let j = 0; j < numBonds; j++) {
    const lineIndex = bondStartIndex + j;
    if (lineIndex >= lines.length) break;
    const line = lines[lineIndex];

    const atom1Id = parseInt(line.substring(0, 3).trim(), 10);
    const atom2Id = parseInt(line.substring(3, 6).trim(), 10);
    const orderCode = parseInt(line.substring(6, 9).trim(), 10);

    if (!isNaN(atom1Id) && !isNaN(atom2Id)) {
      let order = 1;
      if (orderCode === 2) order = 2;
      else if (orderCode === 3) order = 3;
      else if (orderCode === 4) order = 1.5; // aromatic

      bonds.push({
        id: j + 1,
        atom1Id,
        atom2Id,
        order,
      });
    }
  }

  // If no bonds were explicitly parsed in SDF, calculate bonds using covalent radii!
  if (bonds.length === 0 && atoms.length > 1) {
    bonds.push(...autoGenerateBonds(atoms));
  }

  // Calculate mass and formula
  let totalMass = 0;
  const elemCounts: Record<string, number> = {};

  atoms.forEach((atom) => {
    const cpk = getElementCPK(atom.element);
    totalMass += cpk.atomicMass;
    elemCounts[atom.element] = (elemCounts[atom.element] || 0) + 1;
  });

  // Construct Hill System Formula (C first, then H, then alphabetical)
  let formula = '';
  if (elemCounts['C']) {
    formula += `C${elemCounts['C'] > 1 ? elemCounts['C'] : ''}`;
    delete elemCounts['C'];
    if (elemCounts['H']) {
      formula += `H${elemCounts['H'] > 1 ? elemCounts['H'] : ''}`;
      delete elemCounts['H'];
    }
  }
  Object.keys(elemCounts).sort().forEach((sym) => {
    formula += `${sym}${elemCounts[sym] > 1 ? elemCounts[sym] : ''}`;
  });

  // Center molecule at origin (0,0,0)
  centerMoleculeCoordinates(atoms);

  return {
    id: `pubchem_${Date.now()}`,
    name: titleLine || moleculeName,
    formula: formula || 'Sconosciuta',
    molecularMass: Math.round(totalMass * 100) / 100,
    category: 'organic',
    atoms,
    bonds,
    geometryType: inferGeometryType(atoms, bonds),
  };
}

/**
 * Automatically computes bonds between atoms based on covalent radii + tolerance
 */
export function autoGenerateBonds(atoms: Atom[]): Bond[] {
  const bonds: Bond[] = [];
  let bondId = 1;

  for (let i = 0; i < atoms.length; i++) {
    for (let j = i + 1; j < atoms.length; j++) {
      const a1 = atoms[i];
      const a2 = atoms[j];

      const dx = a1.x - a2.x;
      const dy = a1.y - a2.y;
      const dz = a1.z - a2.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      const r1 = getElementCPK(a1.element).covalentRadius;
      const r2 = getElementCPK(a2.element).covalentRadius;

      // Max bonding distance = sum of covalent radii + 0.45 Å tolerance
      const maxBondDist = (r1 + r2) + 0.45;

      if (dist > 0.4 && dist <= maxBondDist) {
        bonds.push({
          id: bondId++,
          atom1Id: a1.id,
          atom2Id: a2.id,
          order: 1,
        });
      }
    }
  }

  return bonds;
}

/**
 * Center molecule around origin
 */
export function centerMoleculeCoordinates(atoms: Atom[]) {
  if (atoms.length === 0) return;
  let cx = 0, cy = 0, cz = 0;
  atoms.forEach((a) => {
    cx += a.x;
    cy += a.y;
    cz += a.z;
  });
  cx /= atoms.length;
  cy /= atoms.length;
  cz /= atoms.length;

  atoms.forEach((a) => {
    a.x -= cx;
    a.y -= cy;
    a.z -= cz;
  });
}

function inferGeometryType(atoms: Atom[], bonds: Bond[]): string {
  if (atoms.length <= 2) return 'Lineare Diatomica';
  if (atoms.length === 3) return 'Piegata / Lineare Triatomica';
  
  // Count C atoms
  const cCount = atoms.filter(a => a.element === 'C').length;
  if (cCount >= 6 && bonds.filter(b => b.order === 1.5).length >= 5) {
    return 'Planare Aromatica';
  }
  return 'Complessa Tridimensionale';
}

/**
 * Fetches 3D SDF structure from PubChem PUG REST API
 */
export async function fetchPubChemMolecule(query: string): Promise<MoleculeData> {
  const cleanQuery = encodeURIComponent(query.trim());
  
  // Try 3D record first
  const url3D = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${cleanQuery}/SDF?record_type=3d`;
  
  try {
    const resp = await fetch(url3D);
    if (resp.ok) {
      const text = await resp.text();
      return parseSDF(text, query);
    }
  } catch (err) {
    console.warn('3D PubChem query failed, attempting 2D conformer fallback:', err);
  }

  // Fallback to standard SDF (or CID lookup)
  const url2D = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${cleanQuery}/SDF`;
  const resp2D = await fetch(url2D);
  if (!resp2D.ok) {
    throw new Error(`Molecola "${query}" non trovata su PubChem.`);
  }
  const text2D = await resp2D.text();
  return parseSDF(text2D, query);
}
