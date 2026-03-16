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

/** Sắp xếp danh sách: mặc định (theo API) hoặc A-Z theo tên. */
export type SortByName = "default" | "a-z";

type R2ManagerState = {
  currentPrefix: string;
  search: string;
  folders: R2FolderItem[];
  files: R2FileItem[];
  isLoading: boolean;
  selectedKeys: string[];
  /** Bucket đang chọn (null = dùng bucket mặc định từ env). */
  currentBucket: string | null;
  /** Sắp xếp theo tên A-Z khi bật. */
  sortByName: SortByName;
  /** Tên hiển thị (tiếng Việt) của thư mục đang xem (prefix hiện tại), từ DB. */
  currentFolderDisplayName: string | null;
  /** Tăng khi đổi tên/di chuyển/xóa thư mục để sidebar biết cần cập nhật. */
  folderListVersion: number;
};

type R2ManagerActions = {
  setPrefix: (prefix: string) => void;
  setSearch: (search: string) => void;
  setData: (
    folders: R2FolderItem[],
    files: R2FileItem[],
    currentFolderDisplayName?: string | null,
  ) => void;
  setLoading: (value: boolean) => void;
  toggleSelect: (key: string) => void;
  clearSelection: () => void;
  /** Chọn tất cả file trong danh sách hiện tại. */
  selectAllFiles: () => void;
  setCurrentBucket: (bucket: string | null) => void;
  setSortByName: (value: SortByName) => void;
  /** Tăng folderListVersion sau khi đổi tên/di chuyển/xóa thư mục. */
  incrementFolderListVersion: () => void;
};

export type R2ManagerStore = R2ManagerState & R2ManagerActions;

export const useR2ManagerStore = create<R2ManagerStore>((set) => ({
  currentPrefix: "",
  search: "",
  folders: [],
  files: [],
  isLoading: false,
  selectedKeys: [],
  currentBucket: null,
  sortByName: "a-z",
  currentFolderDisplayName: null,
  folderListVersion: 0,
  setCurrentBucket: (bucket: string | null) => set({ currentBucket: bucket }),
  setSortByName: (value: SortByName) => set({ sortByName: value }),
  setPrefix: (prefix: string) =>
    set((state: R2ManagerState) => {
      const key = prefix.replace(/^\/+|\/+$/g, "").trim();
      const normalized = key ? `${key}/` : "";
      return {
        currentPrefix: normalized || prefix,
        selectedKeys: [],
        currentFolderDisplayName: null,
      } as Partial<R2ManagerState>;
    }),
  setSearch: (search: string) => set({ search }),
  setData: (
    folders: R2FolderItem[],
    files: R2FileItem[],
    currentFolderDisplayName?: string | null,
  ) =>
    set((state) => {
      const next: Partial<R2ManagerState> = { folders, files };
      if (currentFolderDisplayName !== undefined)
        next.currentFolderDisplayName = currentFolderDisplayName;
      return next;
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
  selectAllFiles: () =>
    set((state: R2ManagerState) => ({
      selectedKeys: state.files.map((f: R2FileItem) => f.key),
    })),
  incrementFolderListVersion: () =>
    set((state: R2ManagerState) => ({
      folderListVersion: state.folderListVersion + 1,
    })),
}));

