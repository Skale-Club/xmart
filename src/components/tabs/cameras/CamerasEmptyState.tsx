'use client';

import { Camera, Plus } from 'lucide-react';
import styles from '@/app/page.module.css';

interface CamerasEmptyStateProps {
  onAddCamera: () => void;
}

export default function CamerasEmptyState({ onAddCamera }: CamerasEmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <Camera size={36} />
      </div>
      <h2 className={styles.emptyTitle}>No cameras added yet</h2>
      <p className={styles.emptyText}>
        Add your Tapo camera credentials to start viewing live streams.
      </p>
      <button className={styles.addBtn} onClick={onAddCamera}>
        <Plus size={16} />
        Add Your First Camera
      </button>
      <div className={styles.setupGuide}>
        <h3>Quick Setup</h3>
        <ol>
          <li>Open the Tapo app, then Camera Settings, Advanced, and Device Account</li>
          <li>Create a Device Account (username + password)</li>
          <li>Find the camera IP in your router or Tapo app</li>
          <li>Click "Add Camera" and enter the details</li>
          <li>Keep this page open while testing the first stream</li>
        </ol>
      </div>
    </div>
  );
}
