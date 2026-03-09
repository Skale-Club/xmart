'use client';

import AutomationCard from '@/components/AutomationCard/AutomationCard';
import { AutomationRule } from '@/types/device';
import styles from '@/app/page.module.css';

interface AutomationsTabProps {
  automations: AutomationRule[];
}

export default function AutomationsTab({ automations }: AutomationsTabProps) {
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
