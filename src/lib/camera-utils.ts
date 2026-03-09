import { TapoCameraConfig } from '@/lib/tapo-stream';

export function isOnDemandCamera(camera: TapoCameraConfig): boolean {
  if (camera.onDemand) return true;
  const n = camera.name.toLowerCase();
  return n.includes('c403') || n.includes('solar');
}
