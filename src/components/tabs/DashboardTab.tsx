'use client';

import { Activity, Power } from 'lucide-react';
import DeviceCard from '@/components/DeviceCard/DeviceCard';
import RoomCard from '@/components/RoomCard/RoomCard';
import StarIcon from '@/components/icons/StarIcon';
import { Device, Room } from '@/types/device';
import styles from '@/app/page.module.css';

interface DashboardTabProps {
  greeting: string;
  userName: string;
  onlineDevices: number;
  activeDevices: number;
  favoriteDevices: Device[];
  rooms: Room[];
  getDevicesByRoom: (roomId: string) => Device[];
}

export default function DashboardTab({
  greeting,
  userName,
  onlineDevices,
  activeDevices,
  favoriteDevices,
  rooms,
  getDevicesByRoom,
}: DashboardTabProps) {
  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div className={styles.greeting}>
          <h1>{greeting}, {userName}!</h1>
          <p>Welcome to your smart home</p>
        </div>
        <div className={styles.quickStats}>
          <div className={styles.statCard}>
            <Activity size={20} />
            <div>
              <span className={styles.statValue}>{onlineDevices}</span>
              <span className={styles.statLabel}>Online</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <Power size={20} />
            <div>
              <span className={styles.statValue}>{activeDevices}</span>
              <span className={styles.statLabel}>Active</span>
            </div>
          </div>
        </div>
      </div>

      {favoriteDevices.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <StarIcon size={20} /> Favorites
          </h2>
          <div className={styles.favoritesGrid}>
            {favoriteDevices.map((device) => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Rooms</h2>
        {rooms.map((room) => {
          const roomDevices = getDevicesByRoom(room.id);
          if (roomDevices.length === 0) return null;
          return <RoomCard key={room.id} room={room} devices={roomDevices} />;
        })}
      </section>
    </div>
  );
}
