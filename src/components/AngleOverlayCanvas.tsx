import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Atom, MoleculeData, NewmanInfo } from '../types';
import { project3DTo2D, calculateBondAngle } from '../utils/geometryAnalysis';

interface AngleOverlayCanvasProps {
  molecule: MoleculeData;
  camera: THREE.Camera | null;
  moleculeGroup: THREE.Group | null;
  selectedAtomIds: number[];
  newmanInfo: NewmanInfo;
  showAtomLabels: boolean;
  width: number;
  height: number;
}

export const AngleOverlayCanvas: React.FC<AngleOverlayCanvasProps> = ({
  molecule,
  camera,
  moleculeGroup,
  selectedAtomIds,
  newmanInfo,
  showAtomLabels,
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !camera || !moleculeGroup || !molecule) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // 1. Render Newman View Target Reticle if active
    if (newmanInfo.detected) {
      const frontAtom = molecule.atoms.find((a) => a.id === newmanInfo.frontAtomId);
      if (frontAtom) {
        const p2d = project3DTo2D(frontAtom, camera, moleculeGroup, width, height);
        if (p2d.visible) {
          ctx.save();
          ctx.translate(p2d.x, p2d.y);

          // Glowing target rings
          ctx.strokeStyle = '#00F0FF';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);

          ctx.beginPath();
          ctx.arc(0, 0, 48, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
          ctx.beginPath();
          ctx.arc(0, 0, 64, 0, Math.PI * 2);
          ctx.stroke();

          ctx.setLineDash([]);
          ctx.fillStyle = '#00F0FF';
          ctx.shadowColor = '#00F0FF';
          ctx.shadowBlur = 12;

          // Crosshair notches
          ctx.fillRect(-24, -1, 10, 2);
          ctx.fillRect(14, -1, 10, 2);
          ctx.fillRect(-1, -24, 2, 10);
          ctx.fillRect(-1, 14, 2, 10);

          // HUD Tag
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('NEWMAN VIEW AXIS', 0, -56);

          ctx.restore();
        }
      }
    }

    // 2. Render Selected Atoms Highlights and Bond Angle Arc if 3 atoms are selected
    if (selectedAtomIds.length > 0) {
      const projAtoms: { atom: Atom; p2d: { x: number; y: number; visible: boolean } }[] = [];

      selectedAtomIds.forEach((id) => {
        const atom = molecule.atoms.find((a) => a.id === id);
        if (atom) {
          const p2d = project3DTo2D(atom, camera, moleculeGroup, width, height);
          projAtoms.push({ atom, p2d });
        }
      });

      // Highlight selected atom circles
      projAtoms.forEach(({ atom, p2d }, idx) => {
        if (!p2d.visible) return;

        ctx.save();
        ctx.strokeStyle = idx === 1 ? '#FFB800' : '#00FF9D';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = idx === 1 ? '#FFB800' : '#00FF9D';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.arc(p2d.x, p2d.y, 22, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = idx === 1 ? '#FFB800' : '#00FF9D';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${atom.element}${atom.id}`, p2d.x, p2d.y - 30);

        ctx.restore();
      });

      // If 3 atoms selected, draw angle arc
      if (projAtoms.length === 3) {
        const [a1, a2, a3] = projAtoms; // a2 is central atom
        if (a1.p2d.visible && a2.p2d.visible && a3.p2d.visible) {
          const angleDeg = calculateBondAngle(a1.atom, a2.atom, a3.atom);

          ctx.save();
          // Draw AR guideline legs
          ctx.strokeStyle = 'rgba(255, 184, 0, 0.8)';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 3]);

          ctx.beginPath();
          ctx.moveTo(a2.p2d.x, a2.p2d.y);
          ctx.lineTo(a1.p2d.x, a1.p2d.y);
          ctx.moveTo(a2.p2d.x, a2.p2d.y);
          ctx.lineTo(a3.p2d.x, a3.p2d.y);
          ctx.stroke();

          // Calculate angles for arc
          const angle1 = Math.atan2(a1.p2d.y - a2.p2d.y, a1.p2d.x - a2.p2d.x);
          const angle3 = Math.atan2(a3.p2d.y - a2.p2d.y, a3.p2d.x - a2.p2d.x);

          ctx.setLineDash([]);
          ctx.strokeStyle = '#FFB800';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#FFB800';
          ctx.shadowBlur = 8;

          ctx.beginPath();
          ctx.arc(a2.p2d.x, a2.p2d.y, 36, angle1, angle3, false);
          ctx.stroke();

          // Badge with angle
          const midAngle = (angle1 + angle3) / 2;
          const badgeX = a2.p2d.x + Math.cos(midAngle) * 52;
          const badgeY = a2.p2d.y + Math.sin(midAngle) * 52;

          ctx.fillStyle = 'rgba(20, 20, 24, 0.9)';
          ctx.strokeStyle = '#FFB800';
          ctx.lineWidth = 1.5;

          const badgeText = `${angleDeg}°`;
          ctx.font = 'bold 12px monospace';
          const textWidth = ctx.measureText(badgeText).width;

          ctx.beginPath();
          ctx.roundRect(badgeX - textWidth / 2 - 8, badgeY - 12, textWidth + 16, 24, 12);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#FFB800';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(badgeText, badgeX, badgeY);

          ctx.restore();
        }
      }
    }

    // 3. Atom Labels (if enabled and no specific selection overriding)
    if (showAtomLabels && selectedAtomIds.length === 0) {
      ctx.save();
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      molecule.atoms.forEach((atom) => {
        // Skip H labels if too crowded (>15 atoms)
        if (molecule.atoms.length > 15 && atom.element === 'H') return;

        const p2d = project3DTo2D(atom, camera, moleculeGroup, width, height);
        if (p2d.visible) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.beginPath();
          ctx.arc(p2d.x, p2d.y + 14, 9, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = atom.element === 'C' ? '#E5E7EB' : '#FFFFFF';
          ctx.fillText(atom.element, p2d.x, p2d.y + 14);
        }
      });
      ctx.restore();
    }
  }, [molecule, camera, moleculeGroup, selectedAtomIds, newmanInfo, showAtomLabels, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none z-10"
    />
  );
};
