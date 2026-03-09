'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { useCameraStore } from '@/store/cameraStore';
import { useActiveTab } from '@/hooks/useActiveTab';
import Sidebar from '@/components/Sidebar/Sidebar';
import AddDeviceModal from '@/components/AddDeviceModal/AddDeviceModal';
import AddCameraModal from '@/components/AddCameraModal';
import DashboardTab from '@/components/tabs/DashboardTab';
import DevicesTab from '@/components/tabs/DevicesTab';
import CamerasTab from '@/components/tabs/CamerasTab';
import AutomationsTab from '@/components/tabs/AutomationsTab';
import SettingsTab from '@/components/tabs/SettingsTab';
import { TabId } from '@/types/navigation';
import styles from './page.module.css';

export default function DashboardPage() {
  const { activeTab, setActiveTab } = useActiveTab('dashboard');
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [isAddCameraOpen, setIsAddCameraOpen] = useState(false);

  const {
    devices,
    rooms,
    automations,
    favoriteDeviceIds,
    getDevicesByRoom,
  } = useDeviceStore();

  const { cameras, removeCamera, loadCameras } = useCameraStore();

  useEffect(() => {
    loadCameras();
  }, [loadCameras]);

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

  const activeAutomations = useMemo(
    () => automations.filter((a) => a.enabled).length,
    [automations]
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const handleAddClick = () => {
    if (activeTab === 'cameras') {
      setIsAddCameraOpen(true);
      return;
    }
    setIsAddDeviceOpen(true);
  };

  const handleDeleteCamera = async (id: string) => {
    if (!confirm('Remove this camera?')) return;
    fetch(`/api/relay/camera/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
    try {
      await removeCamera(id);
    } catch (error) {
      console.error(error);
      alert('Could not remove camera from database.');
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardTab
            greeting={greeting}
            userName="Vanildo"
            onlineDevices={onlineDevices}
            activeDevices={activeDevices}
            favoriteDevices={favoriteDevices}
            rooms={rooms}
            getDevicesByRoom={getDevicesByRoom}
          />
        );
      case 'devices':
        return <DevicesTab devices={devices} />;
      case 'cameras':
        return (
          <CamerasTab
            cameras={cameras}
            onAddCamera={() => setIsAddCameraOpen(true)}
            onDeleteCamera={handleDeleteCamera}
          />
        );
      case 'automations':
        return <AutomationsTab automations={automations} />;
      case 'settings':
        return (
          <SettingsTab
            totalDevices={devices.length}
            totalRooms={rooms.length}
            totalCameras={cameras.length}
            activeAutomations={activeAutomations}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as TabId)}
        onAddDevice={handleAddClick}
      />
      <main className={styles.main}>{renderTab()}</main>
      <AddDeviceModal isOpen={isAddDeviceOpen} onClose={() => setIsAddDeviceOpen(false)} />
      <AddCameraModal isOpen={isAddCameraOpen} onClose={() => setIsAddCameraOpen(false)} />
    </div>
  );
}
