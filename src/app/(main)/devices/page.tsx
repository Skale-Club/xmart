'use client';

import { useDeviceStore } from '@/store/deviceStore';
import DeviceCard from '@/components/DeviceCard/DeviceCard';
import styles from '@/app/page.module.css';

export default function DevicesPage() {
    const { devices } = useDeviceStore();

    return (
        <div className={styles.dashboard}>
            <h1 className={styles.pageTitle}>All Devices</h1>
            <div className={styles.devicesGrid}>
                {devices.map((device) => (
                    <DeviceCard key={device.id} device={device} />
                ))}
            </div>
        </div>
    );
}
