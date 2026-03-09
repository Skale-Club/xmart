/**
 * Centralized route configuration for the application
 * Each route has a slug (URL path) and metadata
 */

export interface RouteConfig {
  slug: string;
  label: string;
  description?: string;
}

export const ROUTES = {
  DASHBOARD: {
    slug: '/dashboard',
    label: 'Dashboard',
    description: 'Overview of your smart home',
  },
  DEVICES: {
    slug: '/devices',
    label: 'Devices',
    description: 'Manage your smart devices',
  },
  CAMERAS: {
    slug: '/cameras',
    label: 'Cameras',
    description: 'View and manage security cameras',
  },
  AUTOMATIONS: {
    slug: '/automations',
    label: 'Automations',
    description: 'Create and manage automations',
  },
  SETTINGS: {
    slug: '/settings',
    label: 'Settings',
    description: 'Application settings',
  },
} as const;

export type RouteName = keyof typeof ROUTES;

/**
 * Get route by slug
 */
export function getRouteBySlug(slug: string): RouteConfig | undefined {
  return Object.values(ROUTES).find((route) => route.slug === slug);
}

/**
 * Get all route slugs
 */
export function getAllSlugs(): string[] {
  return Object.values(ROUTES).map((route) => route.slug);
}
