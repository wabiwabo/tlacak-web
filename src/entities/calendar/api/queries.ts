import { createCrudHooks } from '@/shared/api/crud';
import type { Calendar } from '../model/types';

const calendarCrud = createCrudHooks<Calendar>('calendars');

export const calendarKeys = calendarCrud.keys;
export const useCalendarsQuery = calendarCrud.useList;
export const useSaveCalendar = calendarCrud.useSave;
export const useRemoveCalendar = calendarCrud.useRemove;
export const calendarsApi = calendarCrud.api;
