'use client';

import { useDeviceStore } from '@/store/deviceStore';
import AutomationCard from '@/components/AutomationCard/AutomationCard';
import styles from '@/app/page.module.css';

export default function AutomationsPage() {
    const { automations } = useDeviceStore();

    return (
        <div className={styles.dashboard}>
            <h1 className={styles.pageTitle}>Automations</h1>
            <div className={styles.automationsGrid}>
                {automations.map((automation) => (
                    <AutomationCard key={automation.id} automation={automation} />
                ))}
            </div>
        </div>
    );
}
