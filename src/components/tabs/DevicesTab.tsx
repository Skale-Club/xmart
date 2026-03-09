'use client';

import DeviceCard from '@/components/DeviceCard/DeviceCard';
import { Device } from '@/types/device';
import styles from '@/app/page.module.css';

interface DevicesTabProps {
  devices: Device[];
}

export default function DevicesTab({ devices }: DevicesTabProps) {
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
