import { createCrudHooks } from '@/shared/api/crud';
import type { Driver } from '../model/types';

const driverCrud = createCrudHooks<Driver>('drivers');

export const driverKeys = driverCrud.keys;
export const useDriversQuery = driverCrud.useList;
export const useSaveDriver = driverCrud.useSave;
export const useRemoveDriver = driverCrud.useRemove;
export const driversApi = driverCrud.api;
