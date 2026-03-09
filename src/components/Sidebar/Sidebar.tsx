'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    Lightbulb,
    Clock,
    Settings,
    Menu,
    X,
    Plus,
    Camera,
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import styles from './Sidebar.module.css';

interface SidebarProps {
    onAddDevice?: () => void;
}

const ADD_LABELS: Record<string, string> = {
    [ROUTES.CAMERAS.slug]: 'Add Camera',
};

export default function Sidebar({ onAddDevice }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const menuItems = [
        { id: 'dashboard', label: ROUTES.DASHBOARD.label, icon: <Home size={20} />, href: ROUTES.DASHBOARD.slug },
        { id: 'devices', label: ROUTES.DEVICES.label, icon: <Lightbulb size={20} />, href: ROUTES.DEVICES.slug },
        { id: 'cameras', label: ROUTES.CAMERAS.label, icon: <Camera size={20} />, href: ROUTES.CAMERAS.slug },
        { id: 'automations', label: ROUTES.AUTOMATIONS.label, icon: <Clock size={20} />, href: ROUTES.AUTOMATIONS.slug },
        { id: 'settings', label: ROUTES.SETTINGS.label, icon: <Settings size={20} />, href: ROUTES.SETTINGS.slug },
    ];

    const addLabel = ADD_LABELS[pathname] ?? 'Add Device';

    const isActive = (href: string) => {
        return pathname === href || pathname.startsWith(href + '/');
    };

    return (
        <>
            <button
                className={styles.menuToggle}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
                <div className={styles.logo}>
                    <div className={styles.logoIcon}>
                        <Home size={24} />
                    </div>
                    <span className={styles.logoText}>MyHome</span>
                </div>

                <nav className={styles.nav}>
                    {menuItems.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
                            onClick={() => setIsOpen(false)}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className={styles.footer}>
                    <button className={styles.addButton} onClick={onAddDevice}>
                        <Plus size={20} />
                        <span>{addLabel}</span>
                    </button>
                </div>
            </aside>

            {isOpen && (
                <div
                    className={styles.overlay}
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}
