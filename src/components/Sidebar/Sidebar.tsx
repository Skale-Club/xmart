'use client';

import React, { useState } from 'react';
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
import styles from './Sidebar.module.css';

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    onAddDevice?: () => void;
}

const ADD_LABELS: Record<string, string> = {
    cameras: 'Add Camera',
};

export default function Sidebar({ activeTab, onTabChange, onAddDevice }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        { id: 'dashboard',   label: 'Dashboard',   icon: <Home size={20} /> },
        { id: 'devices',     label: 'Devices',     icon: <Lightbulb size={20} /> },
        { id: 'cameras',     label: 'Cameras',     icon: <Camera size={20} /> },
        { id: 'automations', label: 'Automations', icon: <Clock size={20} /> },
        { id: 'settings',    label: 'Settings',    icon: <Settings size={20} /> },
    ];

    const addLabel = ADD_LABELS[activeTab] ?? 'Add Device';

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
                        <button
                            key={item.id}
                            className={`${styles.navItem} ${activeTab === item.id ? styles.active : ''}`}
                            onClick={() => {
                                onTabChange(item.id);
                                setIsOpen(false);
                            }}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
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
