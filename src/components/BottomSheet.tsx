import React, { useState, useRef } from 'react';
import { ActiveTab, MoleculeData, NewmanInfo, RenderMode, SheetState, SpatialOccupancyData } from '../types';
import { PRESET_MOLECUELS } from '../data/presetMolecules';
import { getElementCPK } from '../utils/cpkData';
import { Search, Sparkles, Compass, Check, AlertCircle, Loader2, ArrowUpRight, Share2, Layers, Sliders, ChevronUp, ChevronDown } from 'lucide-react';

interface BottomSheetProps {
  activeTab: ActiveTab;
  molecule: MoleculeData;
  newmanInfo: NewmanInfo;
  spatialData: SpatialOccupancyData;
  renderMode: RenderMode;
  onChangeRenderMode: (mode: RenderMode) => void;
  showAtomLabels: boolean;
  onToggleAtomLabels: () => void;
  onSelectMolecule: (mol: MoleculeData) => void;
  onSearchPubChem: (query: string) => Promise<void>;
  isLoadingSearch: boolean;
  searchError: string | null;
  sheetState: SheetState;
  onChangeSheetState: (state: SheetState) => void;
  selectedAtomIds: number[];
  onSelectAtom: (atomId: number) => void;
  onClearAtomSelection: () => void;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  activeTab,
  molecule,
  newmanInfo,
  spatialData,
  renderMode,
  onChangeRenderMode,
  showAtomLabels,
  onToggleAtomLabels,
  onSelectMolecule,
  onSearchPubChem,
  isLoadingSearch,
  searchError,
  sheetState,
  onChangeSheetState,
  selectedAtomIds,
  onSelectAtom,
  onClearAtomSelection,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const touchStartY = useRef<number>(0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearchPubChem(searchQuery.trim());
    }
  };

  const categories = [
    { id: 'all', label: 'Tutti' },
    { id: 'basic', label: 'Base' },
    { id: 'organic', label: 'Organici' },
    { id: 'bio', label: 'Bio' },
    { id: 'crystal', label: 'Cristalli' },
  ];

  const filteredPresets = PRESET_MOLECUELS.filter((m) => {
    if (selectedCategory === 'all') return true;
    return m.category === selectedCategory;
  });

  // Calculate Atom Counts Breakdown
  const atomCounts: Record<string, number> = {};
  molecule.atoms.forEach((a) => {
    atomCounts[a.element] = (atomCounts[a.element] || 0) + 1;
  });

  // Height class according to sheet state
  const sheetHeightClass =
    sheetState === 'min'
      ? 'h-[80px]'
      : sheetState === 'half'
      ? 'h-[50vh]'
      : 'h-[85vh]';

  const toggleNextState = () => {
    if (sheetState === 'min') onChangeSheetState('half');
    else if (sheetState === 'half') onChangeSheetState('full');
    else onChangeSheetState('min');
  };

  return (
    <div
      className={`fixed bottom-[78px] left-0 right-0 z-20 transition-all duration-300 ease-out bg-zinc-950/90 backdrop-blur-2xl border-t border-white/12 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden ${sheetHeightClass}`}
    >
      {/* Drag Handle Bar */}
      <div
        onClick={toggleNextState}
        className="w-full py-2.5 flex flex-col items-center justify-center cursor-pointer active:opacity-80 select-none bg-white/[0.02]"
      >
        <div className="w-12 h-1 rounded-full bg-white/20 mb-1" />
        <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
          <span>{sheetState === 'min' ? 'Trascina in alto per espandere' : sheetState === 'half' ? 'Dettagli completi' : 'Riduci pannello'}</span>
          {sheetState === 'min' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </div>
      </div>

      {/* Sheet Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 pt-1 space-y-6 pb-20 scrollbar-none">
        {/* TAB 1: MOLECOLA (Presets Carousel + PubChem Live Search) */}
        {activeTab === 'molecule' && (
          <div className="space-y-5">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cerca su PubChem (es. Aspirina, Caffeina, C6H12O6)..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-24 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 transition-all font-sans"
                />
                <Search className="w-5 h-5 text-zinc-400 absolute left-3.5" />
                <button
                  type="submit"
                  disabled={isLoadingSearch || !searchQuery.trim()}
                  className="absolute right-2 px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-all active:scale-95 disabled:opacity-40 flex items-center gap-1.5"
                >
                  {isLoadingSearch ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Cerca'}
                </button>
              </div>
              {searchError && (
                <div className="flex items-center gap-2 mt-2 text-xs text-red-400 bg-red-950/40 border border-red-500/30 rounded-xl p-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{searchError}</span>
                </div>
              )}
            </form>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                      : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Presets Horizontal Carousel */}
            <div>
              <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2.5">
                Libreria Molecole Predefinite
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {filteredPresets.map((m) => {
                  const isSelected = molecule.id === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => onSelectMolecule(m)}
                      className={`text-left p-3 rounded-2xl border transition-all active:scale-95 flex flex-col justify-between ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-white">{m.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                      </div>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-cyan-400 font-semibold">{m.formula}</span>
                        <span className="text-zinc-500">{m.molecularMass} g/mol</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VISUALIZZAZIONE (Render Modes, Labels, Glow, Lighting) */}
        {activeTab === 'display' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-3">
                Modalità di Rendering 3D
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'ball-and-stick', name: 'Ball & Stick', desc: 'Sfere CPK e legami cilindrici' },
                  { id: 'space-filling', name: 'Space Filling (vdW)', desc: 'Raggi van der Waals effettivi' },
                  { id: 'wireframe', name: 'Wireframe / Stick', desc: 'Sviluppo scheletrico leggero' },
                  { id: 'surface', name: 'Superficie Elettronica', desc: 'Nube di carica traslucida' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => onChangeRenderMode(mode.id as RenderMode)}
                    className={`text-left p-3 rounded-2xl border transition-all active:scale-95 ${
                      renderMode === mode.id
                        ? 'bg-cyan-950/40 border-cyan-500/60 text-white shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                        : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-sm mb-1">{mode.name}</div>
                    <div className="text-[11px] text-zinc-400">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Display Toggles */}
            <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">Etichette Atomi (CPK)</div>
                  <div className="text-xs text-zinc-400">Mostra simboli chimici fluttuanti sugli atomi</div>
                </div>
                <button
                  onClick={onToggleAtomLabels}
                  className={`w-12 h-6 rounded-full transition-all relative ${
                    showAtomLabels ? 'bg-cyan-500' : 'bg-zinc-800'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                      showAtomLabels ? 'left-6' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ANALISI 3D (Newman Projection, Angles, Occupancy) */}
        {activeTab === 'analysis' && (
          <div className="space-y-5">
            {/* Newman Projection Card */}
            <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-cyan-950/40 border border-cyan-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-sm text-white">Riconoscimento Proiezione di Newman</h3>
                </div>
                <span
                  className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-bold uppercase ${
                    newmanInfo.detected
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 animate-pulse'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {newmanInfo.detected ? 'ATTIVA' : 'INATTIVA'}
                </span>
              </div>

              {newmanInfo.detected ? (
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-zinc-300">
                    <span>Allineamento Asse:</span>
                    <strong className="text-cyan-400">{newmanInfo.alignmentAngleDeg}°</strong>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span>Angolo Diedro Calcolato:</span>
                    <strong className="text-cyan-400">{newmanInfo.dihedralAngleDeg}°</strong>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span>Conformazione Stabile:</span>
                    <strong className="text-cyan-300 uppercase">{newmanInfo.conformation}</strong>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Ruota la molecola in 3D fino ad allineare la visuale lungo l'asse di un legame principale (es. C–C in Etano). Il sistema identificherà automaticamente la Proiezione di Newman.
                </p>
              )}
            </div>

            {/* Spatial Occupancy Gauge Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <h3 className="font-bold text-sm text-white flex items-center justify-between">
                <span>Occupazione Spaziale Apparente</span>
                <span className="text-cyan-400 font-mono text-xs">{spatialData.apparentAreaRatio}%</span>
              </h3>
              <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 rounded-full"
                  style={{ width: `${spatialData.apparentAreaRatio}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-zinc-400 pt-1">
                <div>Vol. Bounding Box: <strong className="text-white">{spatialData.boundingVolume} Å³</strong></div>
                <div>Vol. vdW Totale: <strong className="text-white">{spatialData.vdwTotalVolume} Å³</strong></div>
              </div>
            </div>

            {/* Atom Angle Inspector Instructions */}
            <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-3.5 text-xs text-amber-200/90 leading-relaxed space-y-1">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Misurazione Dinamica degli Angoli
              </div>
              <p>Tocca 3 atomi consecutivi nella scena 3D per calcolare l'angolo di legame esatto e visualizzare l'arco guida AR.</p>
            </div>
          </div>
        )}

        {/* TAB 4: IMPOSTAZIONI & CHIMICA DETTAGLIATA */}
        {activeTab === 'settings' && (
          <div className="space-y-5">
            {/* Chemical Breakdown Table */}
            <div>
              <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2.5">
                Composizione Elementare (CPK)
              </h3>
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-zinc-400 font-mono text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5 pl-3">Elemento</th>
                      <th className="p-2.5">Conteggio</th>
                      <th className="p-2.5">Massa %</th>
                      <th className="p-2.5 pr-3">Elettroneg.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {Object.entries(atomCounts).map(([symbol, count]) => {
                      const cpk = getElementCPK(symbol);
                      const massPct = Math.round(((count * cpk.atomicMass) / molecule.molecularMass) * 1000) / 10;
                      return (
                        <tr key={symbol} className="hover:bg-white/5 text-zinc-200">
                          <td className="p-2.5 pl-3 flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full border border-white/30 shrink-0"
                              style={{ backgroundColor: cpk.color }}
                            />
                            <strong>{cpk.name} ({symbol})</strong>
                          </td>
                          <td className="p-2.5 font-bold">{count}</td>
                          <td className="p-2.5 text-cyan-400">{massPct}%</td>
                          <td className="p-2.5 text-zinc-400">{cpk.electronegativity || 'N/A'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Molecule Metadata Links */}
            {molecule.pubchemCid && (
              <a
                href={`https://pubchem.ncbi.nlm.nih.gov/compound/${molecule.pubchemCid}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3.5 bg-white/5 border border-white/10 rounded-2xl text-xs font-mono text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-all active:scale-95"
              >
                <span>Scheda PubChem Ufficiale (CID {molecule.pubchemCid})</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
