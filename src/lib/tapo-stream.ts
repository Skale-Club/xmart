// Tapo Camera Stream Manager
// This module handles RTSP stream initialization for Tapo cameras

export interface TapoCameraConfig {
  id: string;
  name: string;
  ip: string;
  username: string;
  password: string;
  stream?: 'stream1' | 'stream2'; // stream1 = HD, stream2 = 360p
  onDemand?: boolean; // Start stream only when camera is active/reachable
}

export interface StreamResponse {
  rtspUrl: string;
  streamType: string;
  message: string;
}

/**
 * Initialize a camera stream by calling the API route
 */
export async function initializeCameraStream(
  camera: TapoCameraConfig
): Promise<StreamResponse> {
  const response = await fetch('/api/camera/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cameraIp: camera.ip,
      username: camera.username,
      password: camera.password,
      stream: camera.stream || 'stream1',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to initialize camera stream');
  }

  return response.json();
}

/**
 * Validate camera connection by testing RTSP URL
 */
export function validateCameraConfig(camera: TapoCameraConfig): boolean {
  if (!camera.ip || !camera.username || !camera.password) {
    return false;
  }

  // Basic IP validation
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  return ipRegex.test(camera.ip);
}

/**
 * Get RTSP URL for a Tapo camera
 */
export function getRTSPUrl(camera: TapoCameraConfig): string {
  const stream = camera.stream || 'stream1';
  return `rtsp://${encodeURIComponent(camera.username)}:${encodeURIComponent(
    camera.password
  )}@${camera.ip}:554/${stream}`;
}
