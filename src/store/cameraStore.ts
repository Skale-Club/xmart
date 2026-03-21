import { create } from 'zustand';
import { TapoCameraConfig } from '@/lib/tapo-stream';

interface CameraStore {
  cameras: TapoCameraConfig[];
  addCamera: (camera: TapoCameraConfig) => Promise<void>;
  removeCamera: (id: string) => Promise<void>;
  updateCamera: (id: string, updates: Partial<TapoCameraConfig>) => Promise<void>;
  getCamera: (id: string) => TapoCameraConfig | undefined;
  loadCameras: () => Promise<void>;
}

// Helper functions for localStorage
const STORAGE_KEY = 'tapo-cameras';
const METADATA_KEY = 'tapo-cameras-meta';
const LEGACY_KEYS = ['camera-storage', 'cameraStore'];

const loadFromStorage = (): TapoCameraConfig[] => {
  if (typeof window === 'undefined') return [];
  try {
    const parseCameras = (raw: string | null): TapoCameraConfig[] => {
      if (!raw) return [];
      const parsed = JSON.parse(raw);

      // Current expected shape: direct array
      if (Array.isArray(parsed)) return parsed;

      // Legacy persisted shapes
      if (Array.isArray(parsed?.cameras)) return parsed.cameras;
      if (Array.isArray(parsed?.state?.cameras)) return parsed.state.cameras;

      return [];
    };

    // 1) Current key
    const current = parseCameras(localStorage.getItem(STORAGE_KEY));
    if (current.length > 0) return current;

    // 2) Legacy keys (migrate automatically)
    for (const key of LEGACY_KEYS) {
      const legacy = parseCameras(localStorage.getItem(key));
      if (legacy.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));
        return legacy;
      }
    }

    return [];
  } catch (error) {
    console.error('Error loading cameras from storage:', error);
    return [];
  }
};

const saveToStorage = (cameras: TapoCameraConfig[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cameras));
  } catch (error) {
    console.error('Error saving cameras to storage:', error);
  }
};

type CameraMetaMap = Record<string, { onDemand?: boolean }>;

const loadMeta = (): CameraMetaMap => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(METADATA_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
};

const saveMeta = (meta: CameraMetaMap) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(METADATA_KEY, JSON.stringify(meta));
  } catch {}
};

const mergeOnDemandMeta = (cameras: TapoCameraConfig[]): TapoCameraConfig[] => {
  const meta = loadMeta();
  return cameras.map((cam) => ({ ...cam, onDemand: meta[cam.id]?.onDemand ?? cam.onDemand ?? false }));
};

const writeOnDemandMeta = (camera: TapoCameraConfig) => {
  const meta = loadMeta();
  meta[camera.id] = { onDemand: !!camera.onDemand };
  saveMeta(meta);
};

const removeOnDemandMeta = (id: string) => {
  const meta = loadMeta();
  delete meta[id];
  saveMeta(meta);
};

export const useCameraStore = create<CameraStore>((set, get) => ({
  cameras: [],

  loadCameras: async () => {
    try {
      const res = await fetch('/api/cameras', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to load cameras: ${res.status}`);

      const data = await res.json();
      let cameras = Array.isArray(data?.cameras)
        ? data.cameras.map((c: any) => ({
            id: c.id,
            name: c.name,
            ip: c.ip,
            username: c.username,
            password: c.password,
            stream: c.stream || 'stream1',
          }))
        : [];

      // One-time migration: if Supabase is empty but local storage has cameras, import them.
      if (cameras.length === 0) {
        const local = loadFromStorage();
        if (local.length > 0) {
          for (const cam of local) {
            const created = await fetch('/api/cameras', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: cam.name,
                ip: cam.ip,
                username: cam.username,
                password: cam.password,
                stream: cam.stream || 'stream1',
              }),
            });

            if (!created.ok) continue;
            const createdData = await created.json();
            const migrated: TapoCameraConfig = {
              id: createdData.camera.id,
              name: createdData.camera.name,
              ip: createdData.camera.ip,
              username: createdData.camera.username,
              password: createdData.camera.password,
              stream: createdData.camera.stream || 'stream1',
              onDemand: !!cam.onDemand,
            };
            writeOnDemandMeta(migrated);
            cameras.push(migrated);
          }
        }
      }

      const merged = mergeOnDemandMeta(cameras);
      set({ cameras: merged });
      saveToStorage(merged);
      return;
    } catch (error) {
      console.error('Error loading cameras from API:', error);
    }

    set({ cameras: [] });
  },

  addCamera: async (camera) => {
    const res = await fetch('/api/cameras', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: camera.name,
        ip: camera.ip,
        username: camera.username,
        password: camera.password,
        stream: camera.stream || 'stream1',
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || 'Failed to save camera in Supabase');
    }

    const data = await res.json();
    const saved: TapoCameraConfig = {
      id: data.camera.id,
      name: data.camera.name,
      ip: data.camera.ip,
      username: data.camera.username,
      password: data.camera.password,
      stream: data.camera.stream || 'stream1',
      onDemand: !!camera.onDemand,
    };

    writeOnDemandMeta(saved);
    set((state) => {
      const newCameras = [saved, ...state.cameras.filter((c) => c.id !== saved.id)];
      saveToStorage(newCameras);
      return { cameras: newCameras };
    });
  },

  removeCamera: async (id) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) {
      const res = await fetch(`/api/cameras/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to delete camera from Supabase');
      }
    }

    removeOnDemandMeta(id);
    set((state) => {
      const newCameras = state.cameras.filter((cam) => cam.id !== id);
      saveToStorage(newCameras);
      return { cameras: newCameras };
    });
  },

  updateCamera: async (id, updates) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) {
      const payload: any = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.ip !== undefined) payload.ip = updates.ip;
      if (updates.username !== undefined) payload.username = updates.username;
      if (updates.password !== undefined) payload.password = updates.password;
      if (updates.stream !== undefined) payload.stream = updates.stream;

      if (Object.keys(payload).length > 0) {
        const res = await fetch(`/api/cameras/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || 'Failed to update camera in Supabase');
        }
      }
    }

    set((state) => {
      const newCameras = state.cameras.map((cam) =>
        cam.id === id ? { ...cam, ...updates } : cam
      );
      const updated = newCameras.find((c) => c.id === id);
      if (updated) writeOnDemandMeta(updated);
      saveToStorage(newCameras);
      return { cameras: newCameras };
    });
  },

  getCamera: (id) => {
    return get().cameras.find((cam) => cam.id === id);
  },
}));
