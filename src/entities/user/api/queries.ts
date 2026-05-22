import { createCrudHooks } from '@/shared/api/crud';
import type { User } from '../model/types';

const userCrud = createCrudHooks<User>('users');

export const userKeys = userCrud.keys;
export const useUsersQuery = userCrud.useList;
export const useSaveUser = userCrud.useSave;
export const useRemoveUser = userCrud.useRemove;
export const usersApi = userCrud.api;
