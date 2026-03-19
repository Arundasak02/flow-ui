import { create } from 'zustand';
import type { SemanticLevel, ViewMode } from '@/types/graph';
import type { FlowNodeData } from '@/types/graph';

interface FlowState {
  viewMode: ViewMode;
  selectedNodeId: string | null;
  searchQuery: string;
  searchOpen: boolean;
  panelOpen: boolean;
  activeTraceId: string | null;
  isReplaying: boolean;
  semanticLevel: SemanticLevel;
  focusNodeId: string | null;
  replaySpeed: 0.5 | 1 | 2;
  graphId: string | null;
  useLiveData: boolean;
  nodeDataById: Record<string, FlowNodeData>;
  sidebarCollapsed: boolean;
  sidebarPinned: boolean;
  inspectorWidth: number;
  commandPaletteOpen: boolean;

  setViewMode: (mode: ViewMode) => void;
  selectNode: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  setSearchOpen: (open: boolean) => void;
  setPanelOpen: (open: boolean) => void;
  setActiveTrace: (id: string | null) => void;
  setReplaying: (v: boolean) => void;
  setSemanticLevel: (level: SemanticLevel) => void;
  setFocusNodeId: (id: string | null) => void;
  setReplaySpeed: (speed: 0.5 | 1 | 2) => void;
  setGraphId: (id: string | null) => void;
  setUseLiveData: (enabled: boolean) => void;
  setNodeDataById: (data: Record<string, FlowNodeData>) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarPinned: (pinned: boolean) => void;
  setInspectorWidth: (width: number) => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

const defaultSidebarCollapsed = localStorage.getItem('flow-sidebar-collapsed') === '1';
const defaultSidebarPinned = localStorage.getItem('flow-sidebar-pinned') !== '0';
const defaultInspectorWidth = Number(localStorage.getItem('flow-inspector-width') ?? 360) || 360;

export const useFlowStore = create<FlowState>((set) => ({
  viewMode: 'business',
  selectedNodeId: null,
  searchQuery: '',
  searchOpen: false,
  panelOpen: false,
  activeTraceId: null,
  isReplaying: false,
  semanticLevel: 1,
  focusNodeId: null,
  replaySpeed: 1,
  graphId: null,
  useLiveData: false,
  nodeDataById: {},
  sidebarCollapsed: defaultSidebarCollapsed,
  sidebarPinned: defaultSidebarPinned,
  inspectorWidth: Math.max(300, Math.min(520, defaultInspectorWidth)),
  commandPaletteOpen: false,

  setViewMode: (mode) => set({ viewMode: mode }),
  selectNode: (id) => set({ selectedNodeId: id, panelOpen: id !== null }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setPanelOpen: (open) => set({ panelOpen: open }),
  setActiveTrace: (id) => set({ activeTraceId: id }),
  setReplaying: (v) => set({ isReplaying: v }),
  setSemanticLevel: (level) => set({ semanticLevel: level }),
  setFocusNodeId: (id) => set({ focusNodeId: id }),
  setReplaySpeed: (speed) => set({ replaySpeed: speed }),
  setGraphId: (id) => set({ graphId: id }),
  setUseLiveData: (enabled) => set({ useLiveData: enabled }),
  setNodeDataById: (data) => set({ nodeDataById: data }),
  setSidebarCollapsed: (collapsed) => {
    localStorage.setItem('flow-sidebar-collapsed', collapsed ? '1' : '0');
    set({ sidebarCollapsed: collapsed });
  },
  toggleSidebarCollapsed: () =>
    set((state) => {
      const next = !state.sidebarCollapsed;
      localStorage.setItem('flow-sidebar-collapsed', next ? '1' : '0');
      return { sidebarCollapsed: next };
    }),
  setSidebarPinned: (pinned) => {
    localStorage.setItem('flow-sidebar-pinned', pinned ? '1' : '0');
    set({ sidebarPinned: pinned });
  },
  setInspectorWidth: (width) => {
    const safe = Math.max(300, Math.min(520, width));
    localStorage.setItem('flow-inspector-width', String(safe));
    set({ inspectorWidth: safe });
  },
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
}));
