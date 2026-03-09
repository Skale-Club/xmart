'use client';

import { useEffect, useState } from 'react';
import { TabId, VALID_TABS } from '@/types/navigation';

const ACTIVE_TAB_STORAGE_KEY = 'ui-active-tab';

export function useActiveTab(defaultTab: TabId = 'dashboard') {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    if (saved && VALID_TABS.includes(saved as TabId)) {
      setActiveTab(saved as TabId);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  return { activeTab, setActiveTab };
}
