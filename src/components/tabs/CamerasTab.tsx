'use client';

import { useEffect, useState } from 'react';
import RelayServerStatus from '@/components/RelayServerStatus/RelayServerStatus';
import CamerasHeader from '@/components/tabs/cameras/CamerasHeader';
import CamerasEmptyState from '@/components/tabs/cameras/CamerasEmptyState';
import CamerasGridView from '@/components/tabs/cameras/CamerasGridView';
import CamerasSingleView from '@/components/tabs/cameras/CamerasSingleView';
import { TapoCameraConfig } from '@/lib/tapo-stream';
import styles from '@/app/page.module.css';

interface CamerasTabProps {
  cameras: TapoCameraConfig[];
  onAddCamera: () => void;
  onDeleteCamera: (id: string) => void;
}

export default function CamerasTab({ cameras, onAddCamera, onDeleteCamera }: CamerasTabProps) {
  const [cameraView, setCameraView] = useState<'grid' | 'single'>('grid');
  const [selectedCameraIndex, setSelectedCameraIndex] = useState(0);

  useEffect(() => {
    if (selectedCameraIndex > cameras.length - 1) {
      setSelectedCameraIndex(Math.max(0, cameras.length - 1));
    }
  }, [cameras.length, selectedCameraIndex]);

  return (
    <div className={styles.dashboard}>
      <RelayServerStatus />
      <CamerasHeader
        hasCameras={cameras.length > 0}
        cameraView={cameraView}
        onSetView={setCameraView}
        onAddCamera={onAddCamera}
      />

      {cameras.length === 0 ? (
        <CamerasEmptyState onAddCamera={onAddCamera} />
      ) : cameraView === 'grid' ? (
        <CamerasGridView cameras={cameras} onDeleteCamera={onDeleteCamera} />
      ) : (
        <CamerasSingleView
          cameras={cameras}
          selectedCameraIndex={selectedCameraIndex}
          onSelectCamera={setSelectedCameraIndex}
          onDeleteCamera={onDeleteCamera}
        />
      )}
    </div>
  );
}
