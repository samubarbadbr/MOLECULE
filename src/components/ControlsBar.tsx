import React from 'react';
import { ActiveTab, RenderMode } from '../types';
import { Atom, Eye, Activity, Sliders, RotateCw, Camera, Compass } from 'lucide-react';

interface ControlsBarProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  renderMode: RenderMode;
  onChangeRenderMode: (mode: RenderMode) => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  onCameraPreset: (preset: 'front' | 'top' | 'side' | 'iso') => void;
  onTakeSnapshot: () => void;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  activeTab,
  onChangeTab,
  renderMode,
  onChangeRenderMode,
  autoRotate,
  onToggleAutoRotate,
  onCameraPreset,
  onTakeSnapshot,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none p-3 pb-5 flex flex-col items-center gap-2">
      {/* Quick Camera Presets Strip */}
      <div className="pointer-events-auto flex items-center gap-1.5 bg-black/70 backdrop-blur-xl border border-white/10 rounded-full px-3 py-1.5 shadow-2xl">
        <button
          onClick={() => onCameraPreset('front')}
          className="text-[11px] font-mono px-2.5 py-1 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
        >
          Frontale
        </button>
        <button
          onClick={() => onCameraPreset('top')}
          className="text-[11px] font-mono px-2.5 py-1 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
        >
          Superiore
        </button>
        <button
          onClick={() => onCameraPreset('side')}
          className="text-[11px] font-mono px-2.5 py-1 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
        >
          Profilo
        </button>
        <button
          onClick={() => onCameraPreset('iso')}
          className="text-[11px] font-mono px-2.5 py-1 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
        >
          Assonometrica
        </button>
        <div className="w-px h-4 bg-white/15 my-auto" />
        <button
          onClick={onToggleAutoRotate}
          className={`p-1.5 rounded-full transition-all active:scale-95 ${
            autoRotate ? 'text-cyan-400 bg-cyan-500/20' : 'text-zinc-400 hover:text-white'
          }`}
          title="Auto Rotazione"
        >
          <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin-slow' : ''}`} />
        </button>
        <button
          onClick={onTakeSnapshot}
          className="p-1.5 rounded-full text-zinc-400 hover:text-white active:scale-95 transition-all"
          title="Scatta Foto HD"
        >
          <Camera className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Primary Thumb-Zone Bottom Tab Navigation */}
      <nav className="pointer-events-auto w-full max-w-md bg-black/80 backdrop-blur-2xl border border-white/12 rounded-3xl p-1.5 flex items-center justify-around shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        <button
          onClick={() => onChangeTab('molecule')}
          className={`flex flex-col items-center justify-center flex-1 py-2 rounded-2xl transition-all active:scale-95 ${
            activeTab === 'molecule'
              ? 'bg-gradient-to-b from-cyan-500/20 to-cyan-500/5 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Atom className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium tracking-tight">Molecola</span>
        </button>

        <button
          onClick={() => onChangeTab('display')}
          className={`flex flex-col items-center justify-center flex-1 py-2 rounded-2xl transition-all active:scale-95 ${
            activeTab === 'display'
              ? 'bg-gradient-to-b from-cyan-500/20 to-cyan-500/5 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Eye className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium tracking-tight">Render</span>
        </button>

        <button
          onClick={() => onChangeTab('analysis')}
          className={`flex flex-col items-center justify-center flex-1 py-2 rounded-2xl transition-all active:scale-95 ${
            activeTab === 'analysis'
              ? 'bg-gradient-to-b from-cyan-500/20 to-cyan-500/5 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Activity className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium tracking-tight">Analisi 3D</span>
        </button>

        <button
          onClick={() => onChangeTab('settings')}
          className={`flex flex-col items-center justify-center flex-1 py-2 rounded-2xl transition-all active:scale-95 ${
            activeTab === 'settings'
              ? 'bg-gradient-to-b from-cyan-500/20 to-cyan-500/5 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sliders className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium tracking-tight">Opzioni</span>
        </button>
      </nav>
    </div>
  );
};
