import type { ActiveTab } from '../types';
import type { UserRead } from './api';

export type Permission =
  | 'invoice.create'
  | 'invoice.edit'
  | 'invoice.cancel'
  | 'invoice.pay'
  | 'client.manage'
  | 'client.delete'
  | 'product.manage'
  | 'product.delete'
  | 'organization.manage'
  | 'settings.manage';

export interface AccessControl {
  roleLabel: string;
  can: (permission: Permission) => boolean;
  canAccessTab: (tab: ActiveTab) => boolean;
}

const ALL_PERMISSIONS: Permission[] = [
  'invoice.create', 'invoice.edit', 'invoice.cancel', 'invoice.pay',
  'client.manage', 'client.delete', 'product.manage', 'product.delete',
  'organization.manage', 'settings.manage',
];

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  administrador: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS,
  gestor: ALL_PERMISSIONS,
  manager: ALL_PERMISSIONS,
  contabilista: ['invoice.create', 'invoice.edit', 'invoice.pay', 'client.manage', 'product.manage'],
  accountant: ['invoice.create', 'invoice.edit', 'invoice.pay', 'client.manage', 'product.manage'],
  operador: ['invoice.create', 'invoice.edit', 'client.manage'],
  vendedor: ['invoice.create', 'invoice.edit', 'client.manage'],
  sales: ['invoice.create', 'invoice.edit', 'client.manage'],
  consulta: [],
  viewer: [],
  read_only: [],
};

const ROLE_LABELS: Record<string, string> = {
  administrador: 'Administrador', admin: 'Administrador', gestor: 'Gestor', manager: 'Gestor',
  contabilista: 'Contabilista', accountant: 'Contabilista', operador: 'Operador',
  vendedor: 'Vendedor', sales: 'Vendedor', consulta: 'Consulta', viewer: 'Consulta', read_only: 'Consulta',
};

function normalizeRole(role?: string): string {
  return (role || 'consulta')
    .trim()
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');
}

export function getAccessControl(user: UserRead | null): AccessControl {
  const role = normalizeRole(user?.role);
  const permissions = new Set(user?.is_superuser ? ALL_PERMISSIONS : (ROLE_PERMISSIONS[role] || []));
  const can = (permission: Permission) => permissions.has(permission);
  const canAccessTab = (tab: ActiveTab) => {
    if (tab === 'organizacao') return can('organization.manage');
    if (tab === 'definicoes' || tab === 'configuracoes') return can('settings.manage');
    // Dashboard, documents, clients and products may be consulted by every active user.
    return true;
  };

  return { roleLabel: user?.is_superuser ? 'Administrador' : (ROLE_LABELS[role] || 'Consulta'), can, canAccessTab };
}
