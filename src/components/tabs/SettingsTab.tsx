'use client';

import styles from '@/app/page.module.css';

interface SettingsTabProps {
  totalDevices: number;
  totalRooms: number;
  totalCameras: number;
  activeAutomations: number;
}

export default function SettingsTab({
  totalDevices,
  totalRooms,
  totalCameras,
  activeAutomations,
}: SettingsTabProps) {
  return (
    <div className={styles.dashboard}>
      <h1 className={styles.pageTitle}>Settings</h1>
      <div className={styles.settingsCard}>
        <h3>System Information</h3>
        <div className={styles.settingsInfo}>
          <div className={styles.infoRow}>
            <span>Total Devices</span>
            <span>{totalDevices}</span>
          </div>
          <div className={styles.infoRow}>
            <span>Total Rooms</span>
            <span>{totalRooms}</span>
          </div>
          <div className={styles.infoRow}>
            <span>Cameras</span>
            <span>{totalCameras}</span>
          </div>
          <div className={styles.infoRow}>
            <span>Active Automations</span>
            <span>{activeAutomations}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
