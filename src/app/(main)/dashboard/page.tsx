'use client';

import { useMemo } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import DeviceCard from '@/components/DeviceCard/DeviceCard';
import RoomCard from '@/components/RoomCard/RoomCard';
import StarIcon from '@/components/icons/StarIcon';
import { Activity, Power } from 'lucide-react';
import styles from '@/app/page.module.css';

export default function DashboardPage() {
    const {
        devices,
        rooms,
        favoriteDeviceIds,
        getDevicesByRoom,
    } = useDeviceStore();

    const favoriteDevices = useMemo(
        () => devices.filter((d) => favoriteDeviceIds.includes(d.id)),
        [devices, favoriteDeviceIds]
    );

    const onlineDevices = useMemo(
        () => devices.filter((d) => d.status === 'online').length,
        [devices]
    );

    const activeDevices = useMemo(
        () =>
            devices.filter((d) => {
                if (d.state.on !== undefined) return d.state.on;
                if (d.state.locked !== undefined) return d.state.locked;
                return false;
            }).length,
        [devices]
    );

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    }, []);

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <div className={styles.greeting}>
                    <h1>{greeting}, Vanildo!</h1>
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
