import React from 'react';
import { MoleculeData, NewmanInfo, SpatialOccupancyData } from '../types';
import { Atom, Compass, Eye, Sparkles, Scale, Maximize2, RefreshCw } from 'lucide-react';

interface TopHUDProps {
  molecule: MoleculeData;
  newmanInfo: NewmanInfo;
  spatialData: SpatialOccupancyData;
  selectedAtomIds: number[];
  onResetView: () => void;
  onClearSelection: () => void;
  onOpenSearch: () => void;
}

export const TopHUD: React.FC<TopHUDProps> = ({
  molecule,
  newmanInfo,
  spatialData,
  selectedAtomIds,
  onResetView,
  onClearSelection,
  onOpenSearch,
}) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 p-3 pt-4 pointer-events-none flex flex-col gap-2">
      {/* Primary Top Bar */}
      <div className="pointer-events-auto flex items-center justify-between bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2.5 shadow-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSearch}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 active:scale-95 transition-all shadow-inner"
            title="Cerca molecola"
          >
            <Atom className="w-5 h-5 animate-pulse" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-white font-bold text-base tracking-tight leading-none">
                {molecule.name}
              </h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-semibold">
                {molecule.formula}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono mt-1">
              <span className="flex items-center gap-1">
                <Scale className="w-3 h-3 text-zinc-500" />
                {molecule.molecularMass} g/mol
              </span>
              <span>•</span>
              <span>{molecule.atoms.length} atomi</span>
              <span>•</span>
              <span>{molecule.bonds.length} legami</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onResetView}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white active:scale-95 transition-all"
            title="Reset Camera"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Secondary Dynamic Status Badges (Newman / Angle / Occupancy) */}
      <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
        {/* Newman View Banner */}
        {newmanInfo.detected && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-cyan-950/90 to-blue-950/90 border border-cyan-400/50 rounded-xl px-3 py-1.5 backdrop-blur-md shadow-[0_0_15px_rgba(0,240,255,0.25)] animate-pulse">
            <Compass className="w-4 h-4 text-cyan-400 animate-spin-slow" />
            <div className="text-[11px] font-mono">
              <span className="font-bold text-cyan-300 uppercase tracking-wider block leading-none">
                PROIEZIONE NEWMAN
              </span>
              <span className="text-cyan-200/80 text-[10px]">
                {newmanInfo.conformation === 'staggered' ? 'Sfalsata (Staggered)' : newmanInfo.conformation === 'eclipsed' ? 'Eclissata (Eclipsed)' : 'Intermedia'} ({newmanInfo.dihedralAngleDeg}°)
              </span>
            </div>
          </div>
        )}

        {/* Selected Atoms / Angle Measurement Indicator */}
        {selectedAtomIds.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-950/80 border border-amber-500/40 rounded-xl px-3 py-1.5 backdrop-blur-md shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <div className="text-[11px] font-mono">
              <span className="font-bold text-amber-300 block leading-none">
                MISURA ANGOLO ({selectedAtomIds.length}/3)
              </span>
              <span className="text-amber-200/80 text-[10px]">
                {selectedAtomIds.length === 3 ? 'Angolo calcolato in 3D' : 'Seleziona ancora atomi per completare'}
              </span>
            </div>
            <button
              onClick={onClearSelection}
              className="ml-1 text-xs text-amber-400/80 hover:text-amber-200 underline font-mono"
            >
              Reset
            </button>
          </div>
        )}

        {/* Spatial Occupancy Indicator */}
        <div className="ml-auto flex items-center gap-2 bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 backdrop-blur-md text-[11px] font-mono text-zinc-300">
          <div className="relative w-3.5 h-3.5 rounded-full border border-cyan-400 flex items-center justify-center">
            <div
              className="bg-cyan-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(20, spatialData.apparentAreaRatio)}%`, height: `${Math.max(20, spatialData.apparentAreaRatio)}%` }}
            />
          </div>
          <span>
            Occupazione Apparente: <strong className="text-cyan-400">{spatialData.apparentAreaRatio}%</strong>
          </span>
        </div>
      </div>
    </header>
  );
};
