import React, { useState, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { ActiveTab, MoleculeData, NewmanInfo, RenderMode, SheetState, SpatialOccupancyData } from './types';
import { PRESET_MOLECUELS } from './data/presetMolecules';
import { detectNewmanProjection, calculateSpatialOccupancy } from './utils/geometryAnalysis';
import { fetchPubChemMolecule } from './utils/sdfParser';
import { MoleculeCanvas } from './components/MoleculeCanvas';
import { AngleOverlayCanvas } from './components/AngleOverlayCanvas';
import { TopHUD } from './components/TopHUD';
import { ControlsBar } from './components/ControlsBar';
import { BottomSheet } from './components/BottomSheet';

export default function App() {
  const [molecule, setMolecule] = useState<MoleculeData>(PRESET_MOLECUELS[0]); // Default Ethane
  const [renderMode, setRenderMode] = useState<RenderMode>('ball-and-stick');
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [showAtomLabels, setShowAtomLabels] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('molecule');
  const [sheetState, setSheetState] = useState<SheetState>('min');
  const [selectedAtomIds, setSelectedAtomIds] = useState<number[]>([]);

  // 3D Engine References & Analysis State
  const cameraRef = useRef<THREE.Camera | null>(null);
  const moleculeGroupRef = useRef<THREE.Group | null>(null);

  const [newmanInfo, setNewmanInfo] = useState<NewmanInfo>({
    detected: false,
    frontAtomId: -1,
    rearAtomId: -1,
    bondAxisVector: [0, 0, 0],
    alignmentAngleDeg: 180,
    dihedralAngleDeg: 0,
    conformation: 'intermediate',
    substituentsFront: [],
    substituentsRear: [],
  });

  const [spatialData, setSpatialData] = useState<SpatialOccupancyData>({
    apparentAreaRatio: 25,
    boundingVolume: 120,
    vdwTotalVolume: 85,
    aspectRatio: 1.2,
  });

  // Search State
  const [isLoadingSearch, setIsLoadingSearch] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Canvas viewport dimensions
  const [canvasDim, setCanvasDim] = useState<{ width: number; height: number }>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Handle atom selection tap
  const handleSelectAtom = useCallback((atomId: number) => {
    setSelectedAtomIds((prev) => {
      if (prev.includes(atomId)) {
        return prev.filter((id) => id !== atomId);
      }
      if (prev.length >= 3) {
        return [atomId]; // Reset to new selection start
      }
      return [...prev, atomId];
    });
  }, []);

  // Update 3D camera / group state during render animation frame loop
  const handleUpdate3DState = useCallback(
    (camera: THREE.Camera, group: THREE.Group) => {
      cameraRef.current = camera;
      moleculeGroupRef.current = group;

      // Update Newman Projection Detection
      const newman = detectNewmanProjection(molecule, camera, group);
      setNewmanInfo(newman);

      // Update Spatial Occupancy Metric
      const spatial = calculateSpatialOccupancy(
        molecule,
        camera,
        group,
        window.innerWidth,
        window.innerHeight
      );
      setSpatialData(spatial);
    },
    [molecule]
  );

  // Search PubChem API
  const handleSearchPubChem = async (query: string) => {
    setIsLoadingSearch(true);
    setSearchError(null);
    try {
      const mol = await fetchPubChemMolecule(query);
      setMolecule(mol);
      setSelectedAtomIds([]);
      setSheetState('min');
    } catch (err: any) {
      setSearchError(err.message || 'Errore durante la ricerca della molecola su PubChem');
    } finally {
      setIsLoadingSearch(false);
    }
  };

  // Camera preset orienting
  const handleCameraPreset = (preset: 'front' | 'top' | 'side' | 'iso') => {
    if (!moleculeGroupRef.current) return;
    const group = moleculeGroupRef.current;
    if (preset === 'front') {
      group.rotation.set(0, 0, 0);
    } else if (preset === 'top') {
      group.rotation.set(Math.PI / 2, 0, 0);
    } else if (preset === 'side') {
      group.rotation.set(0, Math.PI / 2, 0);
    } else if (preset === 'iso') {
      group.rotation.set(0.5, 0.7, 0);
    }
  };

  // Take HD PNG Snapshot
  const handleTakeSnapshot = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${molecule.name.toLowerCase().replace(/\s+/g, '_')}_3d.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none font-sans text-white">
      {/* 3D WebGL Canvas */}
      <MoleculeCanvas
        molecule={molecule}
        renderMode={renderMode}
        autoRotate={autoRotate}
        selectedAtomIds={selectedAtomIds}
        onSelectAtom={handleSelectAtom}
        onUpdate3DState={handleUpdate3DState}
      />

      {/* 2D AR Angle & Newman Overlay Canvas */}
      <AngleOverlayCanvas
        molecule={molecule}
        camera={cameraRef.current}
        moleculeGroup={moleculeGroupRef.current}
        selectedAtomIds={selectedAtomIds}
        newmanInfo={newmanInfo}
        showAtomLabels={showAtomLabels}
        width={canvasDim.width}
        height={canvasDim.height}
      />

      {/* Top HUD Display */}
      <TopHUD
        molecule={molecule}
        newmanInfo={newmanInfo}
        spatialData={spatialData}
        selectedAtomIds={selectedAtomIds}
        onResetView={() => handleCameraPreset('iso')}
        onClearSelection={() => setSelectedAtomIds([])}
        onOpenSearch={() => {
          setActiveTab('molecule');
          setSheetState('half');
        }}
      />

      {/* Drag-Expandable Bottom Sheet */}
      <BottomSheet
        activeTab={activeTab}
        molecule={molecule}
        newmanInfo={newmanInfo}
        spatialData={spatialData}
        renderMode={renderMode}
        onChangeRenderMode={setRenderMode}
        showAtomLabels={showAtomLabels}
        onToggleAtomLabels={() => setShowAtomLabels(!showAtomLabels)}
        onSelectMolecule={(m) => {
          setMolecule(m);
          setSelectedAtomIds([]);
          setSheetState('min');
        }}
        onSearchPubChem={handleSearchPubChem}
        isLoadingSearch={isLoadingSearch}
        searchError={searchError}
        sheetState={sheetState}
        onChangeSheetState={setSheetState}
        selectedAtomIds={selectedAtomIds}
        onSelectAtom={handleSelectAtom}
        onClearAtomSelection={() => setSelectedAtomIds([])}
      />

      {/* Fixed Thumb Navigation Controls Bar */}
      <ControlsBar
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveTab(tab);
          if (sheetState === 'min') {
            setSheetState('half');
          }
        }}
        renderMode={renderMode}
        onChangeRenderMode={setRenderMode}
        autoRotate={autoRotate}
        onToggleAutoRotate={() => setAutoRotate(!autoRotate)}
        onCameraPreset={handleCameraPreset}
        onTakeSnapshot={handleTakeSnapshot}
      />
    </div>
  );
}
