import { createCrudHooks } from '@/shared/api/crud';
import type { Maintenance } from '../model/types';

const maintenanceCrud = createCrudHooks<Maintenance>('maintenance');

export const maintenanceKeys = maintenanceCrud.keys;
export const useMaintenancesQuery = maintenanceCrud.useList;
export const useSaveMaintenance = maintenanceCrud.useSave;
export const useRemoveMaintenance = maintenanceCrud.useRemove;
export const maintenancesApi = maintenanceCrud.api;
