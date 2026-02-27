import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  bannerCollapsed: boolean;
  theme: 'dark';
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setBannerCollapsed: (collapsed: boolean) => void;
  toggleBanner: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  bannerCollapsed: false,
  theme: 'dark',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setBannerCollapsed: (collapsed) => set({ bannerCollapsed: collapsed }),
  toggleBanner: () => set((state) => ({ bannerCollapsed: !state.bannerCollapsed })),
}));
