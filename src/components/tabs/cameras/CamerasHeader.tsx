'use client';

import { Grid3x3, Plus, Square } from 'lucide-react';
import styles from '@/app/page.module.css';

interface CamerasHeaderProps {
  hasCameras: boolean;
  cameraView: 'grid' | 'single';
  onSetView: (view: 'grid' | 'single') => void;
  onAddCamera: () => void;
}

export default function CamerasHeader({
  hasCameras,
  cameraView,
  onSetView,
  onAddCamera,
}: CamerasHeaderProps) {
  return (
    <div className={styles.tabHeader}>
      <div>
        <h1 className={styles.pageTitle}>Cameras</h1>
        <p className={styles.tabSubtitle}>Live view from your Tapo cameras</p>
      </div>
      <div className={styles.tabActions}>
        {hasCameras && (
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${cameraView === 'grid' ? styles.viewBtnActive : ''}`}
              onClick={() => onSetView('grid')}
              title="Grid view"
            >
              <Grid3x3 size={16} />
            </button>
            <button
              className={`${styles.viewBtn} ${cameraView === 'single' ? styles.viewBtnActive : ''}`}
              onClick={() => onSetView('single')}
              title="Single view"
            >
              <Square size={16} />
            </button>
          </div>
        )}
        <button className={styles.addBtn} onClick={onAddCamera}>
          <Plus size={16} />
          Add Camera
        </button>
      </div>
    </div>
  );
}
