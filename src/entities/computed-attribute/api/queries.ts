import { createCrudHooks } from '@/shared/api/crud';
import type { ComputedAttribute } from '../model/types';

// The REST resource is the two-segment path `attributes/computed`.
const computedAttributeCrud = createCrudHooks<ComputedAttribute>('attributes/computed');

export const computedAttributeKeys = computedAttributeCrud.keys;
export const useComputedAttributesQuery = computedAttributeCrud.useList;
export const useSaveComputedAttribute = computedAttributeCrud.useSave;
export const useRemoveComputedAttribute = computedAttributeCrud.useRemove;
export const computedAttributesApi = computedAttributeCrud.api;
