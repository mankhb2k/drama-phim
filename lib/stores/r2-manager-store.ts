import { create } from "zustand";

export type R2FolderItem = {
  name: string;
  prefix: string;
};

export type R2FileItem = {
  key: string;
  name: string;
  size: number;
  lastModified: string;
  publicUrl: string;
};

type R2ManagerState = {
  currentPrefix: string;
  search: string;
  folders: R2FolderItem[];
  files: R2FileItem[];
  isLoading: boolean;
  selectedKeys: string[];
};

type R2ManagerActions = {
  setPrefix: (prefix: string) => void;
  setSearch: (search: string) => void;
  setData: (folders: R2FolderItem[], files: R2FileItem[]) => void;
  setLoading: (value: boolean) => void;
  toggleSelect: (key: string) => void;
  clearSelection: () => void;
};

export type R2ManagerStore = R2ManagerState & R2ManagerActions;

export const useR2ManagerStore = create<R2ManagerStore>((set) => ({
  currentPrefix: "videos/",
  search: "",
  folders: [],
  files: [],
  isLoading: false,
  selectedKeys: [],
  setPrefix: (prefix: string) =>
    set({
      currentPrefix: prefix,
      selectedKeys: [],
    }),
  setSearch: (search: string) => set({ search }),
  setData: (folders: R2FolderItem[], files: R2FileItem[]) =>
    set({
      folders,
      files,
    }),
  setLoading: (value: boolean) => set({ isLoading: value }),
  toggleSelect: (key: string) =>
    set((state: R2ManagerState) => {
      const exists = state.selectedKeys.includes(key);
      if (exists) {
        return {
          selectedKeys: state.selectedKeys.filter(
            (itemKey: string) => itemKey !== key,
          ),
        } as Partial<R2ManagerState>;
      }
      return {
        selectedKeys: [...state.selectedKeys, key],
      } as Partial<R2ManagerState>;
    }),
  clearSelection: () => set({ selectedKeys: [] }),
}));

