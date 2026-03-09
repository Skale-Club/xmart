'use client';

import { Trash2 } from 'lucide-react';
import TapoCameraStream from '@/components/TapoCameraStream';
import { TapoCameraConfig } from '@/lib/tapo-stream';
import { isOnDemandCamera } from '@/lib/camera-utils';
import styles from '@/app/page.module.css';

interface CamerasGridViewProps {
  cameras: TapoCameraConfig[];
  onDeleteCamera: (id: string) => void;
}

export default function CamerasGridView({ cameras, onDeleteCamera }: CamerasGridViewProps) {
  return (
    <div className={styles.cameraGrid}>
      {cameras.map((camera) => (
        <div key={camera.id} className={styles.cameraCard}>
          <button
            className={styles.cameraDeleteBtn}
            onClick={() => onDeleteCamera(camera.id)}
            title="Remove camera"
          >
            <Trash2 size={14} />
          </button>
          <TapoCameraStream
            camera={camera}
            width={640}
            height={360}
            autoplay
            onlyWhenActive={isOnDemandCamera(camera)}
          />
        </div>
      ))}
    </div>
  );
}
