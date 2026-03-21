'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar/Sidebar';
import AddDeviceModal from '@/components/AddDeviceModal/AddDeviceModal';
import AddCameraModal from '@/components/AddCameraModal';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/config/routes';
import styles from '@/app/page.module.css';

interface MainLayoutProps {
    children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
    const [isAddCameraOpen, setIsAddCameraOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const openCameraModal = () => setIsAddCameraOpen(true);
        const openDeviceModal = () => setIsAddDeviceOpen(true);

        window.addEventListener('xmarte:add-camera', openCameraModal);
        window.addEventListener('xmarte:add-device', openDeviceModal);

        return () => {
            window.removeEventListener('xmarte:add-camera', openCameraModal);
            window.removeEventListener('xmarte:add-device', openDeviceModal);
        };
    }, []);

    const handleAddClick = () => {
        if (pathname === ROUTES.CAMERAS.slug) {
            setIsAddCameraOpen(true);
            return;
        }
        setIsAddDeviceOpen(true);
    };

    return (
        <div className={styles.container}>
            <Sidebar onAddDevice={handleAddClick} />
            <main className={styles.main}>{children}</main>
            <AddDeviceModal isOpen={isAddDeviceOpen} onClose={() => setIsAddDeviceOpen(false)} />
            <AddCameraModal isOpen={isAddCameraOpen} onClose={() => setIsAddCameraOpen(false)} />
        </div>
    );
}
