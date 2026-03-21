'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { AuthChangeEvent, Session, UserResponse } from '@supabase/supabase-js';
import {
    Home,
    Lightbulb,
    Clock,
    Settings,
    Menu,
    X,
    Plus,
    Camera,
    LogOut,
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { getSupabaseClient } from '@/lib/supabase';
import styles from './Sidebar.module.css';

interface SidebarProps {
    onAddDevice?: () => void;
}

const ADD_LABELS: Record<string, string> = {
    [ROUTES.CAMERAS.slug]: 'Add Camera',
};

export default function Sidebar({ onAddDevice }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const supabase = getSupabaseClient();

        supabase.auth.getUser().then((result: UserResponse) => {
            setUserEmail(result.data.user?.email ?? null);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            setUserEmail(session?.user?.email ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

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

    const handleSignOut = async () => {
        const supabase = getSupabaseClient();
        await supabase.auth.signOut();
        router.replace('/login');
        router.refresh();
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
                    <div className={styles.userCard}>
                        <span className={styles.userLabel}>Signed in</span>
                        <strong className={styles.userValue}>{userEmail ?? '...'}</strong>
                    </div>
                    <button className={styles.addButton} onClick={onAddDevice}>
                        <Plus size={20} />
                        <span>{addLabel}</span>
                    </button>
                    <button className={styles.signOutButton} onClick={handleSignOut} type="button">
                        <LogOut size={18} />
                        <span>Sign out</span>
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
