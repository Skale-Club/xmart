'use client';

import { Trash2 } from 'lucide-react';
import TapoCameraStream from '@/components/TapoCameraStream';
import { TapoCameraConfig } from '@/lib/tapo-stream';
import { isOnDemandCamera } from '@/lib/camera-utils';
import styles from '@/app/page.module.css';

interface CamerasSingleViewProps {
  cameras: TapoCameraConfig[];
  selectedCameraIndex: number;
  onSelectCamera: (index: number) => void;
  onDeleteCamera: (id: string) => void;
}

export default function CamerasSingleView({
  cameras,
  selectedCameraIndex,
  onSelectCamera,
  onDeleteCamera,
}: CamerasSingleViewProps) {
  const selected = cameras[selectedCameraIndex];

  return (
    <div className={styles.cameraSingle}>
      <div className={styles.cameraCard}>
        <button
          className={styles.cameraDeleteBtn}
          onClick={() => onDeleteCamera(selected.id)}
          title="Remove camera"
        >
          <Trash2 size={14} />
        </button>
        <TapoCameraStream
          camera={selected}
          width={1280}
          height={720}
          autoplay
          onlyWhenActive={isOnDemandCamera(selected)}
        />
      </div>
      {cameras.length > 1 && (
        <div className={styles.cameraThumbs}>
          {cameras.map((cam, i) => (
            <button
              key={cam.id}
              className={`${styles.cameraThumb} ${i === selectedCameraIndex ? styles.cameraThumbActive : ''}`}
              onClick={() => onSelectCamera(i)}
            >
              {cam.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
