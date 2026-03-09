'use client';

import { useMemo } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { useCameraStore } from '@/store/cameraStore';
import styles from '@/app/page.module.css';

export default function SettingsPage() {
    const { devices, rooms, automations } = useDeviceStore();
    const { cameras } = useCameraStore();

    const activeAutomations = useMemo(
        () => automations.filter((a) => a.enabled).length,
        [automations]
    );

    return (
        <div className={styles.dashboard}>
            <h1 className={styles.pageTitle}>Settings</h1>
            <div className={styles.settingsCard}>
                <h3>System Information</h3>
                <div className={styles.settingsInfo}>
                    <div className={styles.infoRow}>
                        <span>Total Devices</span>
                        <span>{devices.length}</span>
                    </div>
                    <div className={styles.infoRow}>
                        <span>Total Rooms</span>
                        <span>{rooms.length}</span>
                    </div>
                    <div className={styles.infoRow}>
                        <span>Cameras</span>
                        <span>{cameras.length}</span>
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
