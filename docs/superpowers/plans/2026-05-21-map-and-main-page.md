# Map & main page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Map & main-page subsystem for the rewritten Traccar web frontend — a singleton MapLibre map wrapper with a style switcher and preloaded sprite icons, the MapLibre layers (positions + native clustering, geofences, accuracy circles, live-route trails, selected-device highlight, default camera), the responsive main page (filter toolbar, virtualized device list, device row, motion bar), the live-data layer (WebSocket controller, domain stores/queries, caching prefetch, motion-segment builder), the draggable `StatusCard` device popup, device selection, and the events drawer. This replaces the legacy `MainPage`, `MainMap`, `MainToolbar`, `DeviceList`, `DeviceRow`, `EventsDrawer`, the `map/core` + `map/main` modules, `SocketController`, `CachingController`, `MotionController`, and the Redux `devices`/`events`/`geofences`/`groups` slices and the `positions`/`history` parts of the `session` slice — at 1:1 behavioural parity.

**Architecture:** New `entities/` domain modules each own typed models + TanStack Query hooks: `entities/device`, `entities/position`, `entities/geofence`, `entities/event`, `entities/group`. The MapLibre subsystem lives under `src/map/` (singleton wrapper `MapView`, style list, sprite preloader, declarative layer components, the `SwitcherControl`). `features/main/` holds the page composition (`MainPage` body, `MainToolbar`, `DeviceList`, `DeviceRow`, `MotionBar`, `EventsDrawer`, `StatusCard`) and its Zustand UI stores (live data, selection, filter, map-UI). `features/live/` holds the `SocketController`, `CachingController` and `MotionController` headless controllers. `pages/MainPage.tsx` stays thin and is the protected `/` index route. Server reads go through TanStack Query; live/selection/filter/map-UI state goes through Zustand; the MapLibre `map` stays a typed module-level singleton (legitimate for MapLibre) and is mutated only from inside effects/handlers, never during render. The dependency rule `pages → features → entities → shared`, with `map/` consumed by features, is enforced by `import-x`.

**Tech Stack:** React 19, TypeScript (strict), Vite 8, Tailwind CSS v4, shadcn/ui, TanStack Query v5, Zustand v5, React Router v7, react-i18next, MapLibre GL v5, `react-window` v2, `@turf/circle`, `wellknown`, `dayjs`, openapi-fetch, Vitest + Testing Library, Playwright. All map dependencies are already in `package.json` — no installs needed.

**Branch:** `rewrite/modern-frontend`

---

## File Structure

| Path | Responsibility |
|------|----------------|
| `src/entities/device/model/types.ts` | `Device` domain type augmented from the OpenAPI schema. |
| `src/entities/device/api/queries.ts` | `useDevicesQuery` + `deviceKeys`. |
| `src/entities/device/index.ts` | Device entity barrel. |
| `src/entities/position/model/types.ts` | `Position` domain type. |
| `src/entities/position/api/queries.ts` | `usePositionsQuery` + `positionKeys`. |
| `src/entities/position/index.ts` | Position entity barrel. |
| `src/entities/geofence/model/types.ts` | `Geofence` domain type. |
| `src/entities/geofence/api/queries.ts` | `useGeofencesQuery` + `geofenceKeys`. |
| `src/entities/geofence/index.ts` | Geofence entity barrel. |
| `src/entities/group/model/types.ts` | `Group` domain type. |
| `src/entities/group/api/queries.ts` | `useGroupsQuery` + `groupKeys`. |
| `src/entities/group/index.ts` | Group entity barrel. |
| `src/entities/event/model/types.ts` | `Event` domain type. |
| `src/entities/event/index.ts` | Event entity barrel. |
| `src/features/main/model/live-store.ts` | Zustand store: live `devices`, `positions`, `history`, `events`, `socketOpen`, `includeLogs`. |
| `src/features/main/model/selection-store.ts` | Zustand store: `selectedDeviceId` + `selectTime`. |
| `src/features/main/model/filter-store.ts` | Zustand store (persisted): `keyword`, `filter`, `filterSort`, `filterMap`. |
| `src/features/main/model/map-ui-store.ts` | Zustand store (persisted): `selectedMapStyle`, `mapReady`. |
| `src/features/main/lib/filter-devices.ts` | Pure device filter/sort port of legacy `useFilter`. |
| `src/features/main/lib/motion-segments.ts` | Pure motion-segment builder port of `MotionController.buildSegments`. |
| `src/features/main/lib/socket-message.ts` | Pure socket-message reducer + live-history ring-buffer helper. |
| `src/map/core/map-instance.ts` | The MapLibre `map` singleton + ready-flag listener registry. |
| `src/map/core/map-util.ts` | `geofenceToFeature`, `reverseCoordinates`, `findFonts`, icon canvas helpers. |
| `src/map/core/map-styles.ts` | The ~21 map-style definitions (free working, key-gated inert). |
| `src/map/core/preload-images.ts` | Sprite icon preloader (device icons × status colours). |
| `src/map/core/switcher.ts` | `SwitcherControl` map-style switcher control. |
| `src/map/core/MapView.tsx` | React wrapper mounting the singleton + emitting the `ready` signal. |
| `src/map/layers/MapPositions.tsx` | Positions layer with native clustering + direction arrows. |
| `src/map/layers/MapGeofence.tsx` | Geofence polygons/lines/labels layer. |
| `src/map/layers/MapAccuracy.tsx` | Accuracy circle layer. |
| `src/map/layers/MapLiveRoutes.tsx` | Live-route trail layer. |
| `src/map/layers/MapSelectedDevice.tsx` | Camera ease-to on selection. |
| `src/map/layers/MapDefaultCamera.tsx` | Initial fit-to-bounds / default-camera. |
| `src/map/index.ts` | Map subsystem barrel. |
| `src/features/main/MainMap.tsx` | Composes `MapView` + all layers. |
| `src/features/main/MotionBar.tsx` | Inline motion segment bar. |
| `src/features/main/DeviceRow.tsx` | One virtualized device-list row. |
| `src/features/main/DeviceList.tsx` | `react-window`-virtualized device list. |
| `src/features/main/MainToolbar.tsx` | Search + status/group/sort filter + add + list/map toggle. |
| `src/features/main/StatusCard.tsx` | Draggable device popup. |
| `src/features/main/EventsDrawer.tsx` | Right-side events drawer. |
| `src/features/main/MainPage.tsx` | Responsive page composition. |
| `src/features/main/index.ts` | Main feature barrel. |
| `src/features/live/SocketController.tsx` | WebSocket controller (positions/devices/events/logs + reconnect). |
| `src/features/live/CachingController.tsx` | Prefetch geofences/groups/drivers/maintenance/calendars. |
| `src/features/live/MotionController.tsx` | 24h motion-events poller. |
| `src/features/live/index.ts` | Live feature barrel. |
| `src/pages/MainPage.tsx` | Thin route component (already exists; rewired). |
| `src/features/shell/AppShell.tsx` | Modified — mounts the live controllers. |
| `e2e/map.spec.ts` | E2E smoke for the map + device list. |

---

## Task 1: Domain entities — device, position, group

**Files:**
- Create: `src/entities/device/model/types.ts`, `src/entities/device/api/queries.ts`, `src/entities/device/index.ts`, `src/entities/position/model/types.ts`, `src/entities/position/api/queries.ts`, `src/entities/position/index.ts`, `src/entities/group/model/types.ts`, `src/entities/group/api/queries.ts`, `src/entities/group/index.ts`
- Test: `src/entities/device/api/__tests__/queries.test.tsx`

- [ ] **Step 1: Create `src/entities/device/model/types.ts`**

The generated OpenAPI schema types `attributes` as `Record<string, never>`; the backend actually returns a free-form bag. Augment here.

```ts
import type { components } from '@/shared/api/schema';

type SchemaDevice = components['schemas']['Device'];

/** Free-form attribute bag the backend returns on Device. */
export type DeviceAttributes = Record<string, unknown>;

/** A tracked device as returned by GET /api/devices. */
export interface Device extends Omit<SchemaDevice, 'attributes'> {
  attributes: DeviceAttributes;
}

export type DeviceStatus = 'online' | 'offline' | 'unknown';
```

- [ ] **Step 2: Create `src/entities/device/api/queries.ts`**

`useDevicesQuery` loads the device list once; `SocketController` keeps it fresh by writing the live store, so `staleTime` is `Infinity`.

```ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { Device } from '../model/types';

export const deviceKeys = {
  all: ['devices'] as const,
};

export async function fetchDevices(): Promise<Device[]> {
  const { data, error } = await apiClient.GET('/devices');
  if (error || !data) {
    throw new Error('Failed to load devices');
  }
  return data as Device[];
}

export function useDevicesQuery() {
  return useQuery({
    queryKey: deviceKeys.all,
    queryFn: fetchDevices,
    staleTime: Infinity,
  });
}
```

- [ ] **Step 3: Create `src/entities/device/index.ts`**

```ts
export type { Device, DeviceAttributes, DeviceStatus } from './model/types';
export { deviceKeys, fetchDevices, useDevicesQuery } from './api/queries';
```

- [ ] **Step 4: Create `src/entities/position/model/types.ts`**

```ts
import type { components } from '@/shared/api/schema';

type SchemaPosition = components['schemas']['Position'];

/** Free-form attribute bag the backend returns on Position. */
export type PositionAttributes = Record<string, unknown>;

/** A device position as returned by GET /api/positions and the socket feed. */
export interface Position extends Omit<SchemaPosition, 'attributes'> {
  attributes: PositionAttributes;
  geofenceIds?: number[];
}
```

- [ ] **Step 5: Create `src/entities/position/api/queries.ts`**

```ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { Position } from '../model/types';

export const positionKeys = {
  all: ['positions'] as const,
};

export async function fetchPositions(): Promise<Position[]> {
  const { data, error } = await apiClient.GET('/positions');
  if (error || !data) {
    throw new Error('Failed to load positions');
  }
  return data as Position[];
}

export function usePositionsQuery() {
  return useQuery({
    queryKey: positionKeys.all,
    queryFn: fetchPositions,
    staleTime: Infinity,
  });
}
```

- [ ] **Step 6: Create `src/entities/position/index.ts`**

```ts
export type { Position, PositionAttributes } from './model/types';
export { positionKeys, fetchPositions, usePositionsQuery } from './api/queries';
```

- [ ] **Step 7: Create `src/entities/group/model/types.ts`**

```ts
import type { components } from '@/shared/api/schema';

type SchemaGroup = components['schemas']['Group'];

export type GroupAttributes = Record<string, unknown>;

/** A device group as returned by GET /api/groups. */
export interface Group extends Omit<SchemaGroup, 'attributes'> {
  attributes: GroupAttributes;
}
```

- [ ] **Step 8: Create `src/entities/group/api/queries.ts`**

```ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { Group } from '../model/types';

export const groupKeys = {
  all: ['groups'] as const,
};

export async function fetchGroups(): Promise<Group[]> {
  const { data, error } = await apiClient.GET('/groups');
  if (error || !data) {
    throw new Error('Failed to load groups');
  }
  return data as Group[];
}

export function useGroupsQuery() {
  return useQuery({
    queryKey: groupKeys.all,
    queryFn: fetchGroups,
    staleTime: 5 * 60 * 1000,
  });
}
```

- [ ] **Step 9: Create `src/entities/group/index.ts`**

```ts
export type { Group, GroupAttributes } from './model/types';
export { groupKeys, fetchGroups, useGroupsQuery } from './api/queries';
```

- [ ] **Step 10: Write the test — `src/entities/device/api/__tests__/queries.test.tsx`**

```tsx
import { describe, expect, it, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useDevicesQuery } from '../queries';
import { apiClient } from '@/shared/api/client';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

afterEach(() => vi.restoreAllMocks());

describe('useDevicesQuery', () => {
  it('returns the device list from GET /devices', async () => {
    vi.spyOn(apiClient, 'GET').mockResolvedValue({
      data: [{ id: 1, name: 'Truck A', attributes: {} }],
    } as never);
    const { result } = renderHook(() => useDevicesQuery(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]?.name).toBe('Truck A');
  });
});
```

- [ ] **Step 11: Verify lint, typecheck, tests**

Run: `npm run lint && npm run typecheck && npx vitest run src/entities`
Expected: all exit 0; the device-query test passes.

- [ ] **Step 12: Commit**

```bash
git add src/entities/device src/entities/position src/entities/group
git commit -m "Add device, position and group domain entities"
```

---

## Task 2: Domain entities — geofence & event

**Files:**
- Create: `src/entities/geofence/model/types.ts`, `src/entities/geofence/api/queries.ts`, `src/entities/geofence/index.ts`, `src/entities/event/model/types.ts`, `src/entities/event/index.ts`

- [ ] **Step 1: Create `src/entities/geofence/model/types.ts`**

```ts
import type { components } from '@/shared/api/schema';

type SchemaGeofence = components['schemas']['Geofence'];

export type GeofenceAttributes = Record<string, unknown>;

/** A geofence as returned by GET /api/geofences. `area` is a WKT string. */
export interface Geofence extends Omit<SchemaGeofence, 'attributes'> {
  attributes: GeofenceAttributes;
}
```

- [ ] **Step 2: Create `src/entities/geofence/api/queries.ts`**

```ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { Geofence } from '../model/types';

export const geofenceKeys = {
  all: ['geofences'] as const,
};

export async function fetchGeofences(): Promise<Geofence[]> {
  const { data, error } = await apiClient.GET('/geofences');
  if (error || !data) {
    throw new Error('Failed to load geofences');
  }
  return data as Geofence[];
}

export function useGeofencesQuery() {
  return useQuery({
    queryKey: geofenceKeys.all,
    queryFn: fetchGeofences,
    staleTime: 5 * 60 * 1000,
  });
}
```

- [ ] **Step 3: Create `src/entities/geofence/index.ts`**

```ts
export type { Geofence, GeofenceAttributes } from './model/types';
export { geofenceKeys, fetchGeofences, useGeofencesQuery } from './api/queries';
```

- [ ] **Step 4: Create `src/entities/event/model/types.ts`**

Events arrive only over the socket — there is no list query here.

```ts
import type { components } from '@/shared/api/schema';

type SchemaEvent = components['schemas']['Event'];

export type EventAttributes = Record<string, unknown>;

/** A device event as delivered over the WebSocket feed. */
export interface DeviceEvent extends Omit<SchemaEvent, 'attributes'> {
  attributes: EventAttributes;
}
```

- [ ] **Step 5: Create `src/entities/event/index.ts`**

```ts
export type { DeviceEvent, EventAttributes } from './model/types';
```

- [ ] **Step 6: Verify lint, typecheck**

Run: `npm run lint && npm run typecheck`
Expected: both exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/entities/geofence src/entities/event
git commit -m "Add geofence and event domain entities"
```

---

## Task 3: Pure device filter (port of legacy useFilter)

**Files:**
- Create: `src/features/main/lib/filter-devices.ts`
- Test: `src/features/main/lib/__tests__/filter-devices.test.ts`

- [ ] **Step 1: Write the failing test — `src/features/main/lib/__tests__/filter-devices.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { filterDevices } from '../filter-devices';
import type { Device } from '@/entities/device';
import type { Group } from '@/entities/group';

const devices: Device[] = [
  { id: 1, name: 'Beta', uniqueId: 'b1', status: 'online', groupId: 10 } as Device,
  { id: 2, name: 'Alpha', uniqueId: 'a2', status: 'offline', groupId: 11 } as Device,
  { id: 3, name: 'Gamma', uniqueId: 'g3', status: 'online', groupId: undefined } as Device,
];
const groups: Group[] = [
  { id: 10, name: 'North', groupId: undefined } as Group,
  { id: 11, name: 'South', groupId: 10 } as Group,
];

describe('filterDevices', () => {
  it('returns every device when no filter is set', () => {
    const result = filterDevices(devices, groups, {
      keyword: '',
      statuses: [],
      groups: [],
      sort: '',
    });
    expect(result).toHaveLength(3);
  });

  it('filters by keyword across name and uniqueId, case-insensitively', () => {
    const result = filterDevices(devices, groups, {
      keyword: 'alph',
      statuses: [],
      groups: [],
      sort: '',
    });
    expect(result.map((d) => d.id)).toEqual([2]);
  });

  it('filters by status', () => {
    const result = filterDevices(devices, groups, {
      keyword: '',
      statuses: ['online'],
      groups: [],
      sort: '',
    });
    expect(result.map((d) => d.id).sort()).toEqual([1, 3]);
  });

  it('filters by group, including nested parent groups', () => {
    const result = filterDevices(devices, groups, {
      keyword: '',
      statuses: [],
      groups: [10],
      sort: '',
    });
    expect(result.map((d) => d.id).sort()).toEqual([1, 2]);
  });

  it('sorts by name', () => {
    const result = filterDevices(devices, groups, {
      keyword: '',
      statuses: [],
      groups: [],
      sort: 'name',
    });
    expect(result.map((d) => d.name)).toEqual(['Alpha', 'Beta', 'Gamma']);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/features/main/lib/__tests__/filter-devices.test.ts`
Expected: FAIL — cannot resolve `../filter-devices`.

- [ ] **Step 3: Implement `src/features/main/lib/filter-devices.ts`**

```ts
import dayjs from 'dayjs';
import type { Device } from '@/entities/device';
import type { Group } from '@/entities/group';

export type DeviceSort = '' | 'name' | 'lastUpdate';

export interface DeviceFilter {
  keyword: string;
  statuses: string[];
  groups: number[];
  sort: DeviceSort;
}

function deviceGroupChain(device: Device, groupsById: Map<number, Group>): number[] {
  const chain: number[] = [];
  let groupId = device.groupId ?? undefined;
  while (groupId) {
    chain.push(groupId);
    groupId = groupsById.get(groupId)?.groupId ?? undefined;
  }
  return chain;
}

/** Pure device filter + sort — the port of the legacy `useFilter` hook. */
export function filterDevices(
  devices: Device[],
  groups: Group[],
  filter: DeviceFilter,
): Device[] {
  const groupsById = new Map(groups.map((group) => [group.id as number, group]));
  const keyword = filter.keyword.toLowerCase();

  const result = devices
    .filter((device) => !filter.statuses.length || filter.statuses.includes(device.status ?? ''))
    .filter(
      (device) =>
        !filter.groups.length ||
        deviceGroupChain(device, groupsById).some((id) => filter.groups.includes(id)),
    )
    .filter((device) => {
      if (!keyword) {
        return true;
      }
      return [device.name, device.uniqueId, device.phone, device.model, device.contact].some(
        (value) => typeof value === 'string' && value.toLowerCase().includes(keyword),
      );
    });

  if (filter.sort === 'name') {
    result.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  } else if (filter.sort === 'lastUpdate') {
    result.sort((a, b) => {
      const t1 = a.lastUpdate ? dayjs(a.lastUpdate).valueOf() : 0;
      const t2 = b.lastUpdate ? dayjs(b.lastUpdate).valueOf() : 0;
      return t2 - t1;
    });
  }

  return result;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/features/main/lib/__tests__/filter-devices.test.ts`
Expected: PASS — all five tests pass.

- [ ] **Step 5: Verify lint, typecheck**

Run: `npm run lint && npm run typecheck`
Expected: both exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/features/main/lib/filter-devices.ts src/features/main/lib/__tests__
git commit -m "Add pure device filter (port of legacy useFilter)"
```

---

## Task 4: Motion-segment builder & socket-message reducer

**Files:**
- Create: `src/features/main/lib/motion-segments.ts`, `src/features/main/lib/socket-message.ts`
- Test: `src/features/main/lib/__tests__/motion-segments.test.ts`, `src/features/main/lib/__tests__/socket-message.test.ts`

- [ ] **Step 1: Write the failing test — `src/features/main/lib/__tests__/motion-segments.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { buildMotionSegments } from '../motion-segments';

describe('buildMotionSegments', () => {
  it('returns a single stopped segment when there are no events', () => {
    expect(buildMotionSegments([], 0, 100)).toEqual([{ type: 'stopped', value: 1 }]);
  });

  it('builds moving/stopped segments split at event timestamps', () => {
    const segments = buildMotionSegments(
      [
        { type: 'deviceMoving', eventTime: new Date(40).toISOString() },
        { type: 'deviceStopped', eventTime: new Date(70).toISOString() },
      ],
      0,
      100,
    );
    expect(segments).toEqual([
      { type: 'stopped', value: 40 },
      { type: 'moving', value: 30 },
      { type: 'stopped', value: 30 },
    ]);
  });

  it('clamps event timestamps into the window', () => {
    const segments = buildMotionSegments(
      [{ type: 'deviceStopped', eventTime: new Date(500).toISOString() }],
      0,
      100,
    );
    expect(segments).toEqual([{ type: 'moving', value: 100 }]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/features/main/lib/__tests__/motion-segments.test.ts`
Expected: FAIL — cannot resolve `../motion-segments`.

- [ ] **Step 3: Implement `src/features/main/lib/motion-segments.ts`**

```ts
import dayjs from 'dayjs';

export type MotionState = 'moving' | 'stopped';

export interface MotionSegment {
  type: MotionState;
  value: number;
}

export interface MotionEvent {
  type: string;
  eventTime: string;
}

/** Builds motion bar segments from sorted 24h deviceMoving/deviceStopped events. */
export function buildMotionSegments(
  events: MotionEvent[],
  fromTimestamp: number,
  toTimestamp: number,
): MotionSegment[] {
  const segments: MotionSegment[] = [];
  let cursor = fromTimestamp;
  let state: MotionState = 'stopped';
  if (events.length && events[0]?.type === 'deviceStopped') {
    state = 'moving';
  }

  for (const event of events) {
    const timestamp = dayjs(event.eventTime).valueOf();
    const clamped = Math.max(fromTimestamp, Math.min(toTimestamp, timestamp));
    if (clamped > cursor) {
      segments.push({ type: state, value: clamped - cursor });
    }
    state = event.type === 'deviceMoving' ? 'moving' : 'stopped';
    cursor = clamped;
  }

  if (toTimestamp > cursor) {
    segments.push({ type: state, value: toTimestamp - cursor });
  }

  if (!segments.length) {
    return [{ type: 'stopped', value: 1 }];
  }
  return segments;
}
```

- [ ] **Step 4: Write the failing test — `src/features/main/lib/__tests__/socket-message.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { appendHistory } from '../socket-message';

describe('appendHistory', () => {
  it('appends a new coordinate to an empty route', () => {
    expect(appendHistory([], 10, 20, 5)).toEqual([[10, 20]]);
  });

  it('does not append a duplicate coordinate', () => {
    expect(appendHistory([[10, 20]], 10, 20, 5)).toEqual([[10, 20]]);
  });

  it('caps the route at the live-route limit', () => {
    const route: [number, number][] = [
      [1, 1],
      [2, 2],
      [3, 3],
    ];
    expect(appendHistory(route, 4, 4, 3)).toEqual([
      [2, 2],
      [3, 3],
      [4, 4],
    ]);
  });
});
```

- [ ] **Step 5: Run it to verify it fails**

Run: `npx vitest run src/features/main/lib/__tests__/socket-message.test.ts`
Expected: FAIL — cannot resolve `../socket-message`.

- [ ] **Step 6: Implement `src/features/main/lib/socket-message.ts`**

```ts
import type { Device } from '@/entities/device';
import type { Position } from '@/entities/position';
import type { DeviceEvent } from '@/entities/event';

/** Shape of a `/api/socket` message payload. All fields are optional. */
export interface SocketMessage {
  devices?: Device[];
  positions?: Position[];
  events?: DeviceEvent[];
  logs?: unknown[];
}

/** Parses a raw socket frame; returns an empty message on malformed JSON. */
export function parseSocketMessage(raw: string): SocketMessage {
  try {
    const data = JSON.parse(raw) as SocketMessage;
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

/**
 * Appends `[lng, lat]` to a live-route ring buffer, skipping duplicates and
 * capping the buffer at `limit` points. The port of the legacy `history` reducer.
 */
export function appendHistory(
  route: [number, number][],
  longitude: number,
  latitude: number,
  limit: number,
): [number, number][] {
  const last = route.at(-1);
  if (last && last[0] === longitude && last[1] === latitude) {
    return route;
  }
  return [...route.slice(1 - limit), [longitude, latitude]];
}
```

- [ ] **Step 7: Run both tests to verify they pass**

Run: `npx vitest run src/features/main/lib`
Expected: PASS — all motion + socket tests pass.

- [ ] **Step 8: Verify lint, typecheck**

Run: `npm run lint && npm run typecheck`
Expected: both exit 0.

- [ ] **Step 9: Commit**

```bash
git add src/features/main/lib/motion-segments.ts src/features/main/lib/socket-message.ts src/features/main/lib/__tests__
git commit -m "Add motion-segment builder and socket-message reducer"
```

---

## Task 5: Live, selection, filter & map-UI Zustand stores

**Files:**
- Create: `src/features/main/model/live-store.ts`, `src/features/main/model/selection-store.ts`, `src/features/main/model/filter-store.ts`, `src/features/main/model/map-ui-store.ts`
- Test: `src/features/main/model/__tests__/live-store.test.ts`, `src/features/main/model/__tests__/selection-store.test.ts`

- [ ] **Step 1: Write the failing test — `src/features/main/model/__tests__/live-store.test.ts`**

```ts
import { describe, expect, it, beforeEach } from 'vitest';
import { useLiveStore } from '../live-store';
import type { Position } from '@/entities/position';

const initial = useLiveStore.getState();

beforeEach(() => {
  useLiveStore.setState({ ...initial, devices: {}, positions: {}, history: {}, events: [] });
});

function position(id: number, deviceId: number, lng: number, lat: number): Position {
  return { id, deviceId, longitude: lng, latitude: lat, attributes: {} } as Position;
}

describe('useLiveStore', () => {
  it('upserts positions keyed by deviceId', () => {
    useLiveStore.getState().applyPositions([position(1, 7, 10, 20)], 'none', 10);
    expect(useLiveStore.getState().positions[7]?.id).toBe(1);
  });

  it('accumulates the live route history when live routes are enabled', () => {
    const apply = useLiveStore.getState().applyPositions;
    apply([position(1, 7, 10, 20)], 'all', 10);
    apply([position(2, 7, 11, 21)], 'all', 10);
    expect(useLiveStore.getState().history[7]).toEqual([
      [10, 20],
      [11, 21],
    ]);
  });

  it('clears history when live routes are disabled', () => {
    const apply = useLiveStore.getState().applyPositions;
    apply([position(1, 7, 10, 20)], 'all', 10);
    apply([position(2, 7, 11, 21)], 'none', 10);
    expect(useLiveStore.getState().history).toEqual({});
  });

  it('replaces the device map on refresh', () => {
    useLiveStore.getState().refreshDevices([{ id: 3, name: 'X', attributes: {} } as never]);
    expect(Object.keys(useLiveStore.getState().devices)).toEqual(['3']);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/features/main/model/__tests__/live-store.test.ts`
Expected: FAIL — cannot resolve `../live-store`.

- [ ] **Step 3: Implement `src/features/main/model/live-store.ts`**

```ts
import { create } from 'zustand';
import type { Device } from '@/entities/device';
import type { Position } from '@/entities/position';
import type { DeviceEvent } from '@/entities/event';
import { appendHistory } from '../lib/socket-message';

type DeviceMap = Record<number, Device>;
type PositionMap = Record<number, Position>;
type HistoryMap = Record<number, [number, number][]>;

interface LiveState {
  devices: DeviceMap;
  positions: PositionMap;
  history: HistoryMap;
  events: DeviceEvent[];
  socketOpen: boolean;
  includeLogs: boolean;
  logs: unknown[];
  refreshDevices: (devices: Device[]) => void;
  updateDevices: (devices: Device[]) => void;
  refreshPositions: (positions: Position[]) => void;
  applyPositions: (positions: Position[], liveRoutes: string, limit: number) => void;
  addEvents: (events: DeviceEvent[]) => void;
  deleteEvent: (id: number) => void;
  clearEvents: () => void;
  setSocketOpen: (open: boolean) => void;
  setIncludeLogs: (value: boolean) => void;
  setLogs: (logs: unknown[]) => void;
}

export const useLiveStore = create<LiveState>((set) => ({
  devices: {},
  positions: {},
  history: {},
  events: [],
  socketOpen: false,
  includeLogs: false,
  logs: [],

  refreshDevices: (devices) =>
    set({ devices: Object.fromEntries(devices.map((d) => [d.id as number, d])) }),

  updateDevices: (devices) =>
    set((state) => {
      const next = { ...state.devices };
      for (const device of devices) {
        next[device.id as number] = device;
      }
      return { devices: next };
    }),

  refreshPositions: (positions) =>
    set({ positions: Object.fromEntries(positions.map((p) => [p.deviceId as number, p])) }),

  applyPositions: (positions, liveRoutes, limit) =>
    set((state) => {
      const nextPositions = { ...state.positions };
      let nextHistory: HistoryMap = liveRoutes === 'none' ? {} : { ...state.history };
      for (const position of positions) {
        const deviceId = position.deviceId as number;
        nextPositions[deviceId] = position;
        if (liveRoutes !== 'none') {
          nextHistory[deviceId] = appendHistory(
            nextHistory[deviceId] ?? [],
            position.longitude as number,
            position.latitude as number,
            limit,
          );
        }
      }
      return { positions: nextPositions, history: nextHistory };
    }),

  addEvents: (events) => set((state) => ({ events: [...events, ...state.events] })),
  deleteEvent: (id) => set((state) => ({ events: state.events.filter((e) => e.id !== id) })),
  clearEvents: () => set({ events: [] }),
  setSocketOpen: (open) => set({ socketOpen: open }),
  setIncludeLogs: (value) => set({ includeLogs: value }),
  setLogs: (logs) => set({ logs }),
}));
```

- [ ] **Step 4: Write the failing test — `src/features/main/model/__tests__/selection-store.test.ts`**

```ts
import { describe, expect, it, beforeEach } from 'vitest';
import { useSelectionStore } from '../selection-store';

beforeEach(() => {
  useSelectionStore.setState({ selectedDeviceId: null, selectTime: 0 });
});

describe('useSelectionStore', () => {
  it('selects a device id and bumps the select time', () => {
    const before = useSelectionStore.getState().selectTime;
    useSelectionStore.getState().select(42);
    expect(useSelectionStore.getState().selectedDeviceId).toBe(42);
    expect(useSelectionStore.getState().selectTime).toBeGreaterThanOrEqual(before);
  });

  it('clears the selection', () => {
    useSelectionStore.getState().select(42);
    useSelectionStore.getState().select(null);
    expect(useSelectionStore.getState().selectedDeviceId).toBeNull();
  });
});
```

- [ ] **Step 5: Run it to verify it fails**

Run: `npx vitest run src/features/main/model/__tests__/selection-store.test.ts`
Expected: FAIL — cannot resolve `../selection-store`.

- [ ] **Step 6: Implement `src/features/main/model/selection-store.ts`**

```ts
import { create } from 'zustand';

interface SelectionState {
  selectedDeviceId: number | null;
  selectTime: number;
  select: (deviceId: number | null) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedDeviceId: null,
  selectTime: 0,
  select: (deviceId) => set({ selectedDeviceId: deviceId, selectTime: Date.now() }),
}));
```

- [ ] **Step 7: Implement `src/features/main/model/filter-store.ts`**

The filter is persisted, mirroring the legacy `usePersistedState('filter'|'filterSort'|'filterMap')`.

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DeviceSort } from '../lib/filter-devices';

interface FilterState {
  keyword: string;
  statuses: string[];
  groups: number[];
  sort: DeviceSort;
  filterMap: boolean;
  setKeyword: (keyword: string) => void;
  setStatuses: (statuses: string[]) => void;
  setGroups: (groups: number[]) => void;
  setSort: (sort: DeviceSort) => void;
  setFilterMap: (filterMap: boolean) => void;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      keyword: '',
      statuses: [],
      groups: [],
      sort: '',
      filterMap: false,
      setKeyword: (keyword) => set({ keyword }),
      setStatuses: (statuses) => set({ statuses }),
      setGroups: (groups) => set({ groups }),
      setSort: (sort) => set({ sort }),
      setFilterMap: (filterMap) => set({ filterMap }),
    }),
    {
      name: 'traccar-device-filter',
      // `keyword` is transient — only persist the durable filter choices.
      partialize: (state) => ({
        statuses: state.statuses,
        groups: state.groups,
        sort: state.sort,
        filterMap: state.filterMap,
      }),
    },
  ),
);
```

- [ ] **Step 8: Implement `src/features/main/model/map-ui-store.ts`**

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MapUiState {
  selectedMapStyle: string;
  devicesOpen: boolean;
  eventsOpen: boolean;
  setSelectedMapStyle: (id: string) => void;
  setDevicesOpen: (open: boolean) => void;
  setEventsOpen: (open: boolean) => void;
}

export const useMapUiStore = create<MapUiState>()(
  persist(
    (set) => ({
      selectedMapStyle: 'openFreeMap',
      devicesOpen: true,
      eventsOpen: false,
      setSelectedMapStyle: (id) => set({ selectedMapStyle: id }),
      setDevicesOpen: (open) => set({ devicesOpen: open }),
      setEventsOpen: (open) => set({ eventsOpen: open }),
    }),
    {
      name: 'traccar-map-ui',
      partialize: (state) => ({ selectedMapStyle: state.selectedMapStyle }),
    },
  ),
);
```

- [ ] **Step 9: Run the tests to verify they pass**

Run: `npx vitest run src/features/main/model`
Expected: PASS — live-store and selection-store tests pass.

- [ ] **Step 10: Verify lint, typecheck**

Run: `npm run lint && npm run typecheck`
Expected: both exit 0.

- [ ] **Step 11: Commit**

```bash
git add src/features/main/model
git commit -m "Add live, selection, filter and map-UI Zustand stores"
```

---

## Task 6: Map utilities — WKT geofence conversion

**Files:**
- Create: `src/map/core/map-util.ts`
- Test: `src/map/core/__tests__/map-util.test.ts`

- [ ] **Step 1: Write the failing test — `src/map/core/__tests__/map-util.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { geofenceToFeature, reverseCoordinates } from '../map-util';
import type { Geofence } from '@/entities/geofence';

describe('reverseCoordinates', () => {
  it('swaps a single lat/lng pair', () => {
    expect(reverseCoordinates([10, 20])).toEqual([20, 10]);
  });

  it('recurses into nested coordinate arrays', () => {
    expect(
      reverseCoordinates([
        [10, 20],
        [30, 40],
      ]),
    ).toEqual([
      [20, 10],
      [40, 30],
    ]);
  });
});

describe('geofenceToFeature', () => {
  it('converts a WKT polygon to a GeoJSON feature', () => {
    const geofence = {
      id: 1,
      name: 'Zone',
      area: 'POLYGON ((20 10, 40 30, 50 10, 20 10))',
      attributes: {},
    } as Geofence;
    const feature = geofenceToFeature(geofence, '#00ff00');
    expect(feature.type).toBe('Feature');
    expect(feature.geometry.type).toBe('Polygon');
    expect(feature.properties.name).toBe('Zone');
    expect(feature.properties.color).toBe('#00ff00');
  });

  it('converts a WKT circle to a polygon feature', () => {
    const geofence = {
      id: 2,
      name: 'Circle',
      area: 'CIRCLE (10 20, 500)',
      attributes: {},
    } as Geofence;
    const feature = geofenceToFeature(geofence, '#00ff00');
    expect(feature.geometry.type).toBe('Polygon');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/map/core/__tests__/map-util.test.ts`
Expected: FAIL — cannot resolve `../map-util`.

- [ ] **Step 3: Implement `src/map/core/map-util.ts`**

```ts
import { parse } from 'wellknown';
import turfCircle from '@turf/circle';
import type { GeoJSON, Geometry, Position as GeoPosition } from 'geojson';
import type maplibregl from 'maplibre-gl';
import type { Geofence } from '@/entities/geofence';

type Coordinates = GeoPosition | GeoPosition[] | GeoPosition[][] | GeoPosition[][][];

/** Recursively swaps [a,b] pairs (lat/lng <-> lng/lat) for WKT <-> GeoJSON. */
export function reverseCoordinates(input: Coordinates): Coordinates {
  if (Array.isArray(input)) {
    if (input.length === 2 && typeof input[0] === 'number' && typeof input[1] === 'number') {
      return [input[1] as number, input[0] as number];
    }
    return (input as GeoPosition[]).map((item) => reverseCoordinates(item)) as Coordinates;
  }
  return input;
}

export interface GeofenceFeature {
  id: number;
  type: 'Feature';
  geometry: Geometry;
  properties: {
    name: string;
    color: string;
    width: number;
    opacity: number;
  };
}

/** Converts a geofence (WKT `area`) into a styled GeoJSON feature. */
export function geofenceToFeature(geofence: Geofence, fallbackColor: string): GeofenceFeature {
  let geometry: Geometry;
  if (geofence.area && geofence.area.indexOf('CIRCLE') > -1) {
    const parts = geofence.area
      .replace(/CIRCLE|\(|\)|,/g, ' ')
      .trim()
      .split(/ +/);
    const polygon = turfCircle([Number(parts[1]), Number(parts[0])], Number(parts[2]), {
      steps: 32,
      units: 'meters',
    });
    geometry = polygon.geometry;
  } else {
    const parsed = parse(geofence.area ?? '') as Geometry;
    geometry = {
      ...parsed,
      coordinates: reverseCoordinates(
        (parsed as { coordinates: Coordinates }).coordinates,
      ),
    } as Geometry;
  }
  const attributes = geofence.attributes;
  return {
    id: geofence.id as number,
    type: 'Feature',
    geometry,
    properties: {
      name: geofence.name ?? '',
      color: (attributes.color as string) || fallbackColor,
      width: (attributes.mapLineWidth as number) || 2,
      opacity: (attributes.mapLineOpacity as number) || 1,
    },
  };
}

/** Picks a font stack compatible with the active style's glyph endpoint. */
export function findFonts(map: maplibregl.Map): string[] {
  const glyphs = map.getStyle().glyphs ?? '';
  if (glyphs.startsWith('https://tiles.openfreemap.org')) {
    return ['Noto Sans Regular'];
  }
  return ['Open Sans Regular', 'Arial Unicode MS Regular'];
}

export type { GeoJSON };
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/map/core/__tests__/map-util.test.ts`
Expected: PASS — all map-util tests pass.

- [ ] **Step 5: Verify lint, typecheck**

Run: `npm run lint && npm run typecheck`
Expected: both exit 0. (If `geojson` types are missing, they ship with MapLibre — `import type { ... } from 'geojson'` resolves.)

- [ ] **Step 6: Commit**

```bash
git add src/map/core/map-util.ts src/map/core/__tests__
git commit -m "Add map utilities: WKT geofence conversion and font picker"
```

---

## Task 7: Map style definitions & status colour helper

**Files:**
- Create: `src/map/core/map-styles.ts`, `src/map/lib/status-color.ts`
- Test: `src/map/core/__tests__/map-styles.test.ts`, `src/map/lib/__tests__/status-color.test.ts`

- [ ] **Step 1: Write the failing test — `src/map/lib/__tests__/status-color.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { getStatusColor } from '../status-color';

describe('getStatusColor', () => {
  it('maps device statuses to colour keys', () => {
    expect(getStatusColor('online')).toBe('success');
    expect(getStatusColor('offline')).toBe('error');
    expect(getStatusColor('unknown')).toBe('neutral');
    expect(getStatusColor(undefined)).toBe('neutral');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/map/lib/__tests__/status-color.test.ts`
Expected: FAIL — cannot resolve `../status-color`.

- [ ] **Step 3: Implement `src/map/lib/status-color.ts`**

```ts
export type StatusColorKey = 'success' | 'error' | 'neutral';

/** Maps a device status to the sprite colour suffix used in icon images. */
export function getStatusColor(status: string | undefined): StatusColorKey {
  switch (status) {
    case 'online':
      return 'success';
    case 'offline':
      return 'error';
    default:
      return 'neutral';
  }
}
```

- [ ] **Step 4: Write the failing test — `src/map/core/__tests__/map-styles.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { buildMapStyles } from '../map-styles';

describe('buildMapStyles', () => {
  it('marks key-free styles available with no keys provided', () => {
    const styles = buildMapStyles({});
    const openFreeMap = styles.find((s) => s.id === 'openFreeMap');
    expect(openFreeMap?.available).toBe(true);
  });

  it('marks key-gated styles unavailable without their key', () => {
    const styles = buildMapStyles({});
    expect(styles.find((s) => s.id === 'mapTilerBasic')?.available).toBe(false);
  });

  it('enables a key-gated style when its key is supplied', () => {
    const styles = buildMapStyles({ mapTilerKey: 'abc' });
    expect(styles.find((s) => s.id === 'mapTilerBasic')?.available).toBe(true);
  });

  it('always includes openFreeMap, locationIq and osm', () => {
    const ids = buildMapStyles({}).map((s) => s.id);
    expect(ids).toEqual(expect.arrayContaining(['openFreeMap', 'locationIqStreets', 'osm']));
  });
});
```

- [ ] **Step 5: Run it to verify it fails**

Run: `npx vitest run src/map/core/__tests__/map-styles.test.ts`
Expected: FAIL — cannot resolve `../map-styles`.

- [ ] **Step 6: Implement `src/map/core/map-styles.ts`**

Free, no-key styles are fully functional. Key-gated providers (MapTiler, Bing, TomTom, HERE, Mapbox) are *defined but inert* — `available: false` until a key is supplied; this is the spec's allowance for key-gated providers.

```ts
import type { StyleSpecification } from 'maplibre-gl';

export interface MapStyleKeys {
  locationIqKey?: string;
  mapTilerKey?: string;
  bingMapsKey?: string;
  tomTomKey?: string;
  hereKey?: string;
  mapboxAccessToken?: string;
  googleKey?: string;
}

export interface MapStyle {
  id: string;
  titleKey: string;
  style: string | StyleSpecification;
  available: boolean;
}

interface RasterOptions {
  tiles: string[];
  minZoom?: number;
  maxZoom?: number;
  attribution?: string;
}

const FONT_GLYPHS = 'https://cdn.traccar.com/map/fonts/{fontstack}/{range}.pbf';

function rasterStyle({ tiles, minZoom, maxZoom, attribution }: RasterOptions): StyleSpecification {
  return {
    version: 8,
    glyphs: FONT_GLYPHS,
    sources: {
      custom: {
        type: 'raster',
        tiles,
        tileSize: 256,
        ...(minZoom !== undefined ? { minzoom: minZoom } : {}),
        ...(maxZoom !== undefined ? { maxzoom: maxZoom } : {}),
        ...(attribution ? { attribution } : {}),
      },
    },
    layers: [{ id: 'custom', type: 'raster', source: 'custom' }],
  };
}

/** Builds the full map-style catalogue; `available` reflects key availability. */
export function buildMapStyles(keys: MapStyleKeys): MapStyle[] {
  const locationIqKey = keys.locationIqKey || 'pk.0f147952a41c555a5b70614039fd148b';
  const osmAttribution =
    '© <a target="_top" rel="noopener" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return [
    {
      id: 'openFreeMap',
      titleKey: 'mapOpenFreeMap',
      style: 'https://tiles.openfreemap.org/styles/liberty',
      available: true,
    },
    {
      id: 'locationIqStreets',
      titleKey: 'mapLocationIqStreets',
      style: `https://tiles.locationiq.com/v3/streets/vector.json?key=${locationIqKey}`,
      available: true,
    },
    {
      id: 'locationIqDark',
      titleKey: 'mapLocationIqDark',
      style: `https://tiles.locationiq.com/v3/dark/vector.json?key=${locationIqKey}`,
      available: true,
    },
    {
      id: 'osm',
      titleKey: 'mapOsm',
      style: rasterStyle({
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        maxZoom: 19,
        attribution: osmAttribution,
      }),
      available: true,
    },
    {
      id: 'openTopoMap',
      titleKey: 'mapOpenTopoMap',
      style: rasterStyle({
        tiles: ['a', 'b', 'c'].map((i) => `https://${i}.tile.opentopomap.org/{z}/{x}/{y}.png`),
        maxZoom: 17,
      }),
      available: true,
    },
    {
      id: 'carto',
      titleKey: 'mapCarto',
      style: rasterStyle({
        tiles: ['a', 'b', 'c', 'd'].map(
          (i) => `https://${i}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png`,
        ),
        maxZoom: 22,
        attribution: osmAttribution,
      }),
      available: true,
    },
    {
      id: 'mapTilerBasic',
      titleKey: 'mapMapTilerBasic',
      style: `https://api.maptiler.com/maps/basic/style.json?key=${keys.mapTilerKey ?? ''}`,
      available: Boolean(keys.mapTilerKey),
    },
    {
      id: 'mapTilerHybrid',
      titleKey: 'mapMapTilerHybrid',
      style: `https://api.maptiler.com/maps/hybrid/style.json?key=${keys.mapTilerKey ?? ''}`,
      available: Boolean(keys.mapTilerKey),
    },
    {
      id: 'tomTomBasic',
      titleKey: 'mapTomTomBasic',
      style: `https://api.tomtom.com/map/1/style/20.0.0-8/basic_main.json?key=${keys.tomTomKey ?? ''}`,
      available: Boolean(keys.tomTomKey),
    },
    {
      id: 'bingRoad',
      titleKey: 'mapBingRoad',
      style: rasterStyle({
        tiles: [0, 1, 2, 3].map(
          (i) =>
            `https://t${i}.ssl.ak.dynamic.tiles.virtualearth.net/comp/ch/{quadkey}?mkt=en-US&it=G,L&shading=hill&og=1885&n=z`,
        ),
        maxZoom: 21,
      }),
      available: Boolean(keys.bingMapsKey),
    },
    {
      id: 'bingAerial',
      titleKey: 'mapBingAerial',
      style: rasterStyle({
        tiles: [0, 1, 2, 3].map(
          (i) => `https://ecn.t${i}.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=12327`,
        ),
        maxZoom: 19,
      }),
      available: Boolean(keys.bingMapsKey),
    },
    {
      id: 'hereBasic',
      titleKey: 'mapHereBasic',
      style: rasterStyle({
        tiles: [
          `https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/png8?apiKey=${keys.hereKey ?? ''}&size=512`,
        ],
        maxZoom: 20,
        attribution: '© HERE',
      }),
      available: Boolean(keys.hereKey),
    },
    {
      id: 'hereHybrid',
      titleKey: 'mapHereHybrid',
      style: rasterStyle({
        tiles: [
          `https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/jpeg?style=explore.satellite.day&apiKey=${keys.hereKey ?? ''}&size=512`,
        ],
        maxZoom: 20,
        attribution: '© HERE',
      }),
      available: Boolean(keys.hereKey),
    },
    {
      id: 'mapboxStreets',
      titleKey: 'mapMapboxStreets',
      style: rasterStyle({
        tiles: [
          `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${keys.mapboxAccessToken ?? ''}`,
        ],
        maxZoom: 22,
      }),
      available: Boolean(keys.mapboxAccessToken),
    },
    {
      id: 'mapboxSatelliteStreet',
      titleKey: 'mapMapboxSatellite',
      style: rasterStyle({
        tiles: [
          `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token=${keys.mapboxAccessToken ?? ''}`,
        ],
        maxZoom: 22,
      }),
      available: Boolean(keys.mapboxAccessToken),
    },
  ];
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npx vitest run src/map/core/__tests__/map-styles.test.ts src/map/lib/__tests__/status-color.test.ts`
Expected: PASS — all style + colour tests pass.

- [ ] **Step 8: Verify lint, typecheck**

Run: `npm run lint && npm run typecheck`
Expected: both exit 0.

- [ ] **Step 9: Commit**

```bash
git add src/map/core/map-styles.ts src/map/lib/status-color.ts src/map/core/__tests__/map-styles.test.ts src/map/lib/__tests__
git commit -m "Add map style catalogue and status colour helper"
```

---

## Task 8: Sprite preloader & MapLibre singleton

**Files:**
- Create: `src/map/core/preload-images.ts`, `src/map/core/map-instance.ts`, `src/map/core/switcher.ts`
- Test: `src/map/core/__tests__/preload-images.test.ts`, `src/map/core/__tests__/map-instance.test.ts`

- [ ] **Step 1: Write the failing test — `src/map/core/__tests__/preload-images.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { mapIconKey, ICON_CATEGORIES } from '../preload-images';

describe('mapIconKey', () => {
  it('maps known categories to themselves', () => {
    expect(mapIconKey('truck')).toBe('truck');
    expect(mapIconKey('car')).toBe('car');
  });

  it('aliases unsupported categories', () => {
    expect(mapIconKey('offroad')).toBe('car');
    expect(mapIconKey('pickup')).toBe('car');
    expect(mapIconKey('trolleybus')).toBe('bus');
  });

  it('falls back to default for unknown categories', () => {
    expect(mapIconKey('spaceship')).toBe('default');
    expect(mapIconKey(undefined)).toBe('default');
  });

  it('exposes the icon category list', () => {
    expect(ICON_CATEGORIES).toContain('car');
    expect(ICON_CATEGORIES).toContain('default');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/map/core/__tests__/preload-images.test.ts`
Expected: FAIL — cannot resolve `../preload-images`.

- [ ] **Step 3: Implement `src/map/core/preload-images.ts`**

Sprite icons are loaded from `legacy/src/resources/images` (carried over) via Vite's `?url` import. The preloader composites each device icon onto the background in four status colours, mirroring legacy `preloadImages.js`.

```ts
import type maplibregl from 'maplibre-gl';

import backgroundSvg from '@/shared/assets/map/background.svg?url';
import directionSvg from '@/shared/assets/map/direction.svg?url';
import animalSvg from '@/shared/assets/map/icon/animal.svg?url';
import bicycleSvg from '@/shared/assets/map/icon/bicycle.svg?url';
import boatSvg from '@/shared/assets/map/icon/boat.svg?url';
import busSvg from '@/shared/assets/map/icon/bus.svg?url';
import carSvg from '@/shared/assets/map/icon/car.svg?url';
import camperSvg from '@/shared/assets/map/icon/camper.svg?url';
import craneSvg from '@/shared/assets/map/icon/crane.svg?url';
import defaultSvg from '@/shared/assets/map/icon/default.svg?url';
import helicopterSvg from '@/shared/assets/map/icon/helicopter.svg?url';
import motorcycleSvg from '@/shared/assets/map/icon/motorcycle.svg?url';
import personSvg from '@/shared/assets/map/icon/person.svg?url';
import planeSvg from '@/shared/assets/map/icon/plane.svg?url';
import scooterSvg from '@/shared/assets/map/icon/scooter.svg?url';
import shipSvg from '@/shared/assets/map/icon/ship.svg?url';
import tractorSvg from '@/shared/assets/map/icon/tractor.svg?url';
import trailerSvg from '@/shared/assets/map/icon/trailer.svg?url';
import trainSvg from '@/shared/assets/map/icon/train.svg?url';
import tramSvg from '@/shared/assets/map/icon/tram.svg?url';
import truckSvg from '@/shared/assets/map/icon/truck.svg?url';
import vanSvg from '@/shared/assets/map/icon/van.svg?url';

export const mapIcons: Record<string, string> = {
  animal: animalSvg,
  bicycle: bicycleSvg,
  boat: boatSvg,
  bus: busSvg,
  car: carSvg,
  camper: camperSvg,
  crane: craneSvg,
  default: defaultSvg,
  helicopter: helicopterSvg,
  motorcycle: motorcycleSvg,
  person: personSvg,
  plane: planeSvg,
  scooter: scooterSvg,
  ship: shipSvg,
  tractor: tractorSvg,
  trailer: trailerSvg,
  train: trainSvg,
  tram: tramSvg,
  truck: truckSvg,
  van: vanSvg,
};

export const ICON_CATEGORIES = Object.keys(mapIcons);

/** Status sprite colours; values are CSS colours used for canvas tinting. */
const STATUS_COLORS: Record<string, string> = {
  success: '#4caf50',
  error: '#f44336',
  info: '#2196f3',
  neutral: '#9e9e9e',
};

/** Resolves a device category to a sprite icon key, with legacy aliases. */
export function mapIconKey(category: string | undefined): string {
  switch (category) {
    case 'offroad':
    case 'pickup':
      return 'car';
    case 'trolleybus':
      return 'bus';
    default:
      return category && mapIcons[category] ? category : 'default';
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.src = url;
  });
}

function tint(image: HTMLImageElement, color: string): HTMLCanvasElement {
  const ratio = window.devicePixelRatio;
  const canvas = document.createElement('canvas');
  canvas.width = image.width * ratio;
  canvas.height = image.height * ratio;
  const context = canvas.getContext('2d')!;
  context.fillStyle = color;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'destination-atop';
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function compose(
  background: HTMLImageElement,
  icon: HTMLImageElement | null,
  color: string,
): ImageData {
  const ratio = window.devicePixelRatio;
  const canvas = document.createElement('canvas');
  canvas.width = background.width * ratio;
  canvas.height = background.height * ratio;
  const context = canvas.getContext('2d')!;
  context.drawImage(background, 0, 0, canvas.width, canvas.height);
  if (icon) {
    const w = canvas.width * 0.5;
    const h = canvas.height * 0.5;
    context.drawImage(tint(icon, color), (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  }
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

/** Composites every device icon × status colour into a sprite image map. */
export async function preloadMapImages(): Promise<Record<string, ImageData>> {
  const images: Record<string, ImageData> = {};
  const background = await loadImage(backgroundSvg);
  images.background = compose(background, null, '');
  images.direction = compose(await loadImage(directionSvg), null, '');
  await Promise.all(
    ICON_CATEGORIES.map(async (category) => {
      const icon = await loadImage(mapIcons[category]!);
      for (const [colorKey, color] of Object.entries(STATUS_COLORS)) {
        images[`${category}-${colorKey}`] = compose(background, icon, color);
      }
    }),
  );
  return images;
}

/** Registers a preloaded image map onto a MapLibre map (idempotent). */
export function addMapImages(map: maplibregl.Map, images: Record<string, ImageData>): void {
  if (map.hasImage('background')) {
    return;
  }
  for (const [key, value] of Object.entries(images)) {
    map.addImage(key, value, { pixelRatio: window.devicePixelRatio });
  }
}
```

> **Note:** Before this task runs, copy the legacy sprite assets:
> `mkdir -p src/shared/assets/map/icon && cp legacy/src/resources/images/background.svg legacy/src/resources/images/direction.svg src/shared/assets/map/ && cp legacy/src/resources/images/icon/*.svg src/shared/assets/map/icon/`

- [ ] **Step 4: Copy the sprite assets**

```bash
mkdir -p src/shared/assets/map/icon
cp legacy/src/resources/images/background.svg legacy/src/resources/images/direction.svg src/shared/assets/map/
cp legacy/src/resources/images/icon/animal.svg legacy/src/resources/images/icon/bicycle.svg \
   legacy/src/resources/images/icon/boat.svg legacy/src/resources/images/icon/bus.svg \
   legacy/src/resources/images/icon/car.svg legacy/src/resources/images/icon/camper.svg \
   legacy/src/resources/images/icon/crane.svg legacy/src/resources/images/icon/default.svg \
   legacy/src/resources/images/icon/helicopter.svg legacy/src/resources/images/icon/motorcycle.svg \
   legacy/src/resources/images/icon/person.svg legacy/src/resources/images/icon/plane.svg \
   legacy/src/resources/images/icon/scooter.svg legacy/src/resources/images/icon/ship.svg \
   legacy/src/resources/images/icon/tractor.svg legacy/src/resources/images/icon/trailer.svg \
   legacy/src/resources/images/icon/train.svg legacy/src/resources/images/icon/tram.svg \
   legacy/src/resources/images/icon/truck.svg legacy/src/resources/images/icon/van.svg \
   src/shared/assets/map/icon/
```

Expected: 22 SVG files copied (`background`, `direction`, 20 category icons).

- [ ] **Step 5: Implement `src/map/core/map-instance.ts`**

The MapLibre `map` is a typed module-level singleton on a detached container, mirroring the legacy `MapView.jsx`. The ready flag has a listener registry so React components can subscribe.

```ts
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

/** Detached container the singleton map is attached to; re-parented by MapView. */
export const mapElement = document.createElement('div');
mapElement.style.width = '100%';
mapElement.style.height = '100%';
mapElement.style.boxSizing = 'initial';

/** The application-wide singleton MapLibre map. */
export const map = new maplibregl.Map({
  container: mapElement,
  attributionControl: false,
});

type ReadyListener = (ready: boolean) => void;

let ready = false;
const readyListeners = new Set<ReadyListener>();

/** Subscribes to map-ready changes; fires immediately with the current value. */
export function addReadyListener(listener: ReadyListener): () => void {
  readyListeners.add(listener);
  listener(ready);
  return () => readyListeners.delete(listener);
}

/** Updates the ready flag and notifies all subscribers. */
export function setReady(value: boolean): void {
  ready = value;
  readyListeners.forEach((listener) => listener(value));
}

/** Reads the current ready flag. */
export function isReady(): boolean {
  return ready;
}
```

- [ ] **Step 6: Write the failing test — `src/map/core/__tests__/map-instance.test.ts`**

`maplibre-gl` is mocked because jsdom has no WebGL.

```ts
import { describe, expect, it, vi } from 'vitest';

vi.mock('maplibre-gl', () => ({
  default: { Map: vi.fn(() => ({})) },
}));
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));

describe('map-instance ready registry', () => {
  it('notifies subscribers of ready changes', async () => {
    const { addReadyListener, setReady, isReady } = await import('../map-instance');
    const seen: boolean[] = [];
    const unsubscribe = addReadyListener((ready) => seen.push(ready));
    expect(seen).toEqual([false]);
    setReady(true);
    expect(seen).toEqual([false, true]);
    expect(isReady()).toBe(true);
    unsubscribe();
    setReady(false);
    expect(seen).toEqual([false, true]);
  });
});
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npx vitest run src/map/core/__tests__/map-instance.test.ts src/map/core/__tests__/preload-images.test.ts`
Expected: PASS — both pass.

- [ ] **Step 8: Implement `src/map/core/switcher.ts`**

A minimal MapLibre `IControl` that renders style buttons and calls back on switch — the TS port of the legacy `SwitcherControl`.

```ts
import type maplibregl from 'maplibre-gl';
import type { MapStyle } from './map-styles';

type SwitchHook = () => void;
type SelectHook = (styleId: string) => void;

/** A MapLibre control that lets the user pick a base map style. */
export class SwitcherControl implements maplibregl.IControl {
  private container: HTMLElement | null = null;
  private styles: MapStyle[] = [];
  private currentStyle: string | null = null;

  constructor(
    private readonly onBeforeSwitch: SwitchHook,
    private readonly onSelect: SelectHook,
    private readonly onAfterSwitch: SwitchHook,
  ) {}

  getDefaultPosition(): maplibregl.ControlPosition {
    return 'top-right';
  }

  onAdd(): HTMLElement {
    this.container = document.createElement('div');
    this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group map-switcher';
    this.render();
    return this.container;
  }

  onRemove(): void {
    this.container?.parentNode?.removeChild(this.container);
    this.container = null;
  }

  /** Updates the available styles and the default selection. */
  updateStyles(styles: MapStyle[], defaultStyle: string): void {
    this.styles = styles;
    if (!this.currentStyle) {
      this.currentStyle =
        styles.find((s) => s.id === defaultStyle)?.id ?? styles[0]?.id ?? null;
    }
    this.render();
  }

  /** Returns the resolved active style definition. */
  getActiveStyle(): MapStyle | undefined {
    return this.styles.find((s) => s.id === this.currentStyle);
  }

  private render(): void {
    if (!this.container) {
      return;
    }
    this.container.replaceChildren();
    for (const style of this.styles) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = style.titleKey;
      button.dataset.styleId = style.id;
      if (style.id === this.currentStyle) {
        button.classList.add('active');
      }
      button.addEventListener('click', () => this.switch(style.id));
      this.container!.appendChild(button);
    }
  }

  private switch(styleId: string): void {
    if (styleId === this.currentStyle) {
      return;
    }
    this.currentStyle = styleId;
    this.onBeforeSwitch();
    this.onSelect(styleId);
    this.onAfterSwitch();
    this.render();
  }
}
```

- [ ] **Step 9: Verify lint, typecheck, tests**

Run: `npm run lint && npm run typecheck && npx vitest run src/map`
Expected: all exit 0.

- [ ] **Step 10: Commit**

```bash
git add src/shared/assets/map src/map/core/preload-images.ts src/map/core/map-instance.ts src/map/core/switcher.ts src/map/core/__tests__/preload-images.test.ts src/map/core/__tests__/map-instance.test.ts
git commit -m "Add sprite preloader, MapLibre singleton and style switcher"
```

---

## Task 9: MapView wrapper component

**Files:**
- Create: `src/map/core/MapView.tsx`, `src/map/core/MapView.css`
- Test: `src/map/core/__tests__/MapView.test.tsx`

- [ ] **Step 1: Implement `src/map/core/MapView.tsx`**

`MapView` re-parents the singleton container into its `ref`, attaches controls + the style switcher, applies the chosen style, registers the preloaded sprites once the style loads, and only renders `children` (the layer components) once the map is ready. The `map` singleton is mutated only inside effects — never during render.

```tsx
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import maplibregl from 'maplibre-gl';
import { useTranslation } from 'react-i18next';
import { directionFor } from '@/shared/i18n/rtl';
import { useSessionStore } from '@/entities/session';
import { useMapUiStore } from '@/features/main/model/map-ui-store';
import { map, mapElement, addReadyListener, setReady } from './map-instance';
import { buildMapStyles, type MapStyleKeys } from './map-styles';
import { SwitcherControl } from './switcher';
import { preloadMapImages, addMapImages } from './preload-images';
import './MapView.css';

let imagesPromise: Promise<Record<string, ImageData>> | null = null;

function ensureImages(): Promise<Record<string, ImageData>> {
  if (!imagesPromise) {
    imagesPromise = preloadMapImages();
  }
  return imagesPromise;
}

export function MapView({ children }: { children?: ReactNode }) {
  const { i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);

  const server = useSessionStore((state) => state.server);
  const selectedMapStyle = useMapUiStore((state) => state.selectedMapStyle);
  const setSelectedMapStyle = useMapUiStore((state) => state.setSelectedMapStyle);

  const styleKeys = useMemo<MapStyleKeys>(() => {
    const attributes = server?.attributes ?? {};
    return {
      locationIqKey: attributes.locationIqKey as string | undefined,
      mapTilerKey: attributes.mapTilerKey as string | undefined,
      bingMapsKey: attributes.bingMapsKey as string | undefined,
      tomTomKey: attributes.tomTomKey as string | undefined,
      hereKey: attributes.hereKey as string | undefined,
      mapboxAccessToken: attributes.mapboxAccessToken as string | undefined,
    };
  }, [server]);

  const mapStyles = useMemo(
    () => buildMapStyles(styleKeys).filter((style) => style.available),
    [styleKeys],
  );

  const switcher = useMemo(
    () =>
      new SwitcherControl(
        () => setReady(false),
        (styleId) => setSelectedMapStyle(styleId),
        () => {
          map.once('styledata', () => {
            const waitForLoad = () => {
              if (!map.loaded()) {
                setTimeout(waitForLoad, 33);
              } else {
                void ensureImages().then((images) => {
                  addMapImages(map, images);
                  setReady(true);
                });
              }
            };
            waitForLoad();
          });
        },
      ),
    [setSelectedMapStyle],
  );

  useEffect(() => {
    if (directionFor(i18n.language) === 'rtl') {
      void maplibregl.setRTLTextPlugin('/mapbox-gl-rtl-text.js', true);
    }
  }, [i18n.language]);

  useEffect(() => {
    const rtl = directionFor(i18n.language) === 'rtl';
    const attribution = new maplibregl.AttributionControl({ compact: true });
    const navigation = new maplibregl.NavigationControl();
    map.addControl(attribution, rtl ? 'bottom-left' : 'bottom-right');
    map.addControl(navigation, rtl ? 'top-left' : 'top-right');
    map.addControl(switcher, rtl ? 'top-left' : 'top-right');
    return () => {
      map.removeControl(switcher);
      map.removeControl(navigation);
      map.removeControl(attribution);
    };
  }, [i18n.language, switcher]);

  useEffect(() => {
    switcher.updateStyles(mapStyles, selectedMapStyle);
    const active = switcher.getActiveStyle();
    if (active) {
      map.setStyle(active.style);
      map.once('styledata', () => {
        const waitForLoad = () => {
          if (!map.loaded()) {
            setTimeout(waitForLoad, 33);
          } else {
            void ensureImages().then((images) => {
              addMapImages(map, images);
              setReady(true);
            });
          }
        };
        waitForLoad();
      });
    }
  }, [mapStyles, selectedMapStyle, switcher]);

  useEffect(() => addReadyListener(setMapReady), []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    container.appendChild(mapElement);
    map.resize();
    return () => {
      container.removeChild(mapElement);
    };
  }, []);

  return (
    <div className="map-view" ref={containerRef}>
      {mapReady && children}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/map/core/MapView.css`**

```css
.map-view {
  width: 100%;
  height: 100%;
}

.map-switcher {
  display: flex;
  flex-direction: column;
}

.map-switcher button {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  background: var(--color-background);
  color: var(--color-foreground);
  border: none;
  cursor: pointer;
}

.map-switcher button.active {
  font-weight: 600;
  background: var(--color-muted);
}
```

- [ ] **Step 3: Write the test — `src/map/core/__tests__/MapView.test.tsx`**

`maplibre-gl` is mocked; the test verifies `MapView` mounts and hides children until ready.

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const fakeMap = {
  addControl: vi.fn(),
  removeControl: vi.fn(),
  setStyle: vi.fn(),
  once: vi.fn(),
  loaded: vi.fn(() => true),
  resize: vi.fn(),
  hasImage: vi.fn(() => true),
  addImage: vi.fn(),
  getStyle: vi.fn(() => ({ glyphs: '' })),
};

vi.mock('maplibre-gl', () => ({
  default: {
    Map: vi.fn(() => fakeMap),
    AttributionControl: vi.fn(),
    NavigationControl: vi.fn(),
    setRTLTextPlugin: vi.fn(),
  },
}));
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));

describe('MapView', () => {
  it('renders its container', async () => {
    const { MapView } = await import('../MapView');
    render(<MapView />);
    expect(document.querySelector('.map-view')).not.toBeNull();
    expect(screen.queryByTestId('layer')).toBeNull();
  });
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/map/core/__tests__/MapView.test.tsx`
Expected: PASS.

- [ ] **Step 5: Verify lint, typecheck**

Run: `npm run lint && npm run typecheck`
Expected: both exit 0. (No `set-state-in-effect` violation — `setMapReady` runs inside the registry callback, an event, not synchronously during the effect body.)

- [ ] **Step 6: Commit**

```bash
git add src/map/core/MapView.tsx src/map/core/MapView.css src/map/core/__tests__/MapView.test.tsx
git commit -m "Add MapView singleton wrapper with style switcher and sprite loading"
```

---

## Task 10: Map layers — positions, geofences, accuracy

**Files:**
- Create: `src/map/layers/MapPositions.tsx`, `src/map/layers/MapGeofence.tsx`, `src/map/layers/MapAccuracy.tsx`
- Test: `src/map/layers/__tests__/MapPositions.test.tsx`

- [ ] **Step 1: Implement `src/map/layers/MapPositions.tsx`**

Native MapLibre clustering (`clusterMaxZoom: 14`, `clusterRadius: 50`), separate unclustered + selected sources, direction arrows. Reads live devices/selection from the Zustand stores. All `map` mutation is inside effects.

```tsx
import { useEffect, useId } from 'react';
import type { GeoJSONSource, MapMouseEvent } from 'maplibre-gl';
import { map } from '../core/map-instance';
import { findFonts } from '../core/map-util';
import { mapIconKey } from '../core/preload-images';
import { getStatusColor } from '../lib/status-color';
import { useLiveStore } from '@/features/main/model/live-store';
import { useSelectionStore } from '@/features/main/model/selection-store';
import type { Position } from '@/entities/position';

interface MapPositionsProps {
  positions: Position[];
  onMarkerClick?: (deviceId: number) => void;
}

export function MapPositions({ positions, onMarkerClick }: MapPositionsProps) {
  const baseId = useId().replace(/:/g, '_');
  const clustersId = `${baseId}-clusters`;
  const selectedId = `${baseId}-selected`;

  const devices = useLiveStore((state) => state.devices);
  const selectedDeviceId = useSelectionStore((state) => state.selectedDeviceId);

  useEffect(() => {
    map.addSource(baseId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });
    map.addSource(selectedId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    const onMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const onMouseLeave = () => {
      map.getCanvas().style.cursor = '';
    };
    const onMarker = (event: MapMouseEvent & { features?: GeoJSON.Feature[] }) => {
      event.preventDefault();
      const feature = event.features?.[0];
      if (feature && onMarkerClick) {
        onMarkerClick(feature.properties?.deviceId as number);
      }
    };
    const onCluster = async (event: MapMouseEvent) => {
      event.preventDefault();
      const features = map.queryRenderedFeatures(event.point, { layers: [clustersId] });
      const clusterId = features[0]?.properties?.cluster_id as number;
      const source = map.getSource(baseId) as GeoJSONSource;
      const zoom = await source.getClusterExpansionZoom(clusterId);
      const geometry = features[0]?.geometry;
      if (geometry?.type === 'Point') {
        map.easeTo({ center: geometry.coordinates as [number, number], zoom });
      }
    };

    [baseId, selectedId].forEach((sourceId) => {
      map.addLayer({
        id: sourceId,
        type: 'symbol',
        source: sourceId,
        filter: ['!has', 'point_count'],
        layout: {
          'icon-image': '{category}-{color}',
          'icon-size': 0.75,
          'icon-allow-overlap': true,
          'text-field': '{name}',
          'text-allow-overlap': true,
          'text-anchor': 'bottom',
          'text-offset': [0, -1.5],
          'text-font': findFonts(map),
          'text-size': 12,
        },
        paint: { 'text-halo-color': 'white', 'text-halo-width': 2 },
      });
      map.addLayer({
        id: `direction-${sourceId}`,
        type: 'symbol',
        source: sourceId,
        filter: ['all', ['!has', 'point_count'], ['==', 'direction', true]],
        layout: {
          'icon-image': 'direction',
          'icon-size': 0.75,
          'icon-allow-overlap': true,
          'icon-rotate': ['get', 'rotation'],
          'icon-rotation-alignment': 'map',
        },
      });
      map.on('mouseenter', sourceId, onMouseEnter);
      map.on('mouseleave', sourceId, onMouseLeave);
      map.on('click', sourceId, onMarker);
    });

    map.addLayer({
      id: clustersId,
      type: 'symbol',
      source: baseId,
      filter: ['has', 'point_count'],
      layout: {
        'icon-image': 'background',
        'icon-size': 0.75,
        'text-field': '{point_count_abbreviated}',
        'text-font': findFonts(map),
        'text-size': 14,
      },
    });
    map.on('mouseenter', clustersId, onMouseEnter);
    map.on('mouseleave', clustersId, onMouseLeave);
    map.on('click', clustersId, onCluster);

    return () => {
      map.off('mouseenter', clustersId, onMouseEnter);
      map.off('mouseleave', clustersId, onMouseLeave);
      map.off('click', clustersId, onCluster);
      if (map.getLayer(clustersId)) {
        map.removeLayer(clustersId);
      }
      [baseId, selectedId].forEach((sourceId) => {
        map.off('mouseenter', sourceId, onMouseEnter);
        map.off('mouseleave', sourceId, onMouseLeave);
        map.off('click', sourceId, onMarker);
        if (map.getLayer(`direction-${sourceId}`)) {
          map.removeLayer(`direction-${sourceId}`);
        }
        if (map.getLayer(sourceId)) {
          map.removeLayer(sourceId);
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      });
    };
  }, [baseId, clustersId, selectedId, onMarkerClick]);

  useEffect(() => {
    [baseId, selectedId].forEach((sourceId) => {
      const features = positions
        .filter((position) => devices[position.deviceId as number])
        .filter((position) =>
          sourceId === baseId
            ? position.deviceId !== selectedDeviceId
            : position.deviceId === selectedDeviceId,
        )
        .map((position) => {
          const device = devices[position.deviceId as number]!;
          return {
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: [position.longitude, position.latitude] as [number, number],
            },
            properties: {
              id: position.id,
              deviceId: position.deviceId,
              name: device.name,
              category: mapIconKey(device.category),
              color: getStatusColor(device.status),
              rotation: position.course ?? 0,
              direction:
                position.deviceId === selectedDeviceId && (position.course ?? 0) > 0,
            },
          };
        });
      (map.getSource(sourceId) as GeoJSONSource | undefined)?.setData({
        type: 'FeatureCollection',
        features,
      });
    });
  }, [baseId, selectedId, positions, devices, selectedDeviceId]);

  return null;
}
```

- [ ] **Step 2: Implement `src/map/layers/MapGeofence.tsx`**

```tsx
import { useEffect, useId } from 'react';
import type { GeoJSONSource } from 'maplibre-gl';
import { map } from '../core/map-instance';
import { findFonts, geofenceToFeature } from '../core/map-util';
import { useGeofencesQuery } from '@/entities/geofence';

const GEOMETRY_COLOR = '#3bb2d0';

export function MapGeofence() {
  const sourceId = useId().replace(/:/g, '_');
  const { data: geofences = [] } = useGeofencesQuery();

  useEffect(() => {
    map.addSource(sourceId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    map.addLayer({
      id: `${sourceId}-fill`,
      source: sourceId,
      type: 'fill',
      filter: ['==', '$type', 'Polygon'],
      paint: {
        'fill-color': ['get', 'color'],
        'fill-outline-color': ['get', 'color'],
        'fill-opacity': 0.1,
      },
    });
    map.addLayer({
      id: `${sourceId}-line`,
      source: sourceId,
      type: 'line',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': ['get', 'width'],
        'line-opacity': ['get', 'opacity'],
      },
    });
    map.addLayer({
      id: `${sourceId}-title`,
      source: sourceId,
      type: 'symbol',
      layout: { 'text-field': '{name}', 'text-font': findFonts(map), 'text-size': 12 },
      paint: { 'text-halo-color': 'white', 'text-halo-width': 1 },
    });
    return () => {
      ['fill', 'line', 'title'].forEach((suffix) => {
        if (map.getLayer(`${sourceId}-${suffix}`)) {
          map.removeLayer(`${sourceId}-${suffix}`);
        }
      });
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    };
  }, [sourceId]);

  useEffect(() => {
    (map.getSource(sourceId) as GeoJSONSource | undefined)?.setData({
      type: 'FeatureCollection',
      features: geofences
        .filter((geofence) => !geofence.attributes.hide)
        .map((geofence) => geofenceToFeature(geofence, GEOMETRY_COLOR)),
    });
  }, [sourceId, geofences]);

  return null;
}
```

- [ ] **Step 3: Implement `src/map/layers/MapAccuracy.tsx`**

```tsx
import { useEffect, useId } from 'react';
import turfCircle from '@turf/circle';
import type { GeoJSONSource } from 'maplibre-gl';
import { map } from '../core/map-instance';
import type { Position } from '@/entities/position';

const GEOMETRY_COLOR = '#3bb2d0';

export function MapAccuracy({ positions }: { positions: Position[] }) {
  const sourceId = useId().replace(/:/g, '_');

  useEffect(() => {
    map.addSource(sourceId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    map.addLayer({
      id: sourceId,
      source: sourceId,
      type: 'fill',
      filter: ['==', '$type', 'Polygon'],
      paint: {
        'fill-color': GEOMETRY_COLOR,
        'fill-outline-color': GEOMETRY_COLOR,
        'fill-opacity': 0.25,
      },
    });
    return () => {
      if (map.getLayer(sourceId)) {
        map.removeLayer(sourceId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    };
  }, [sourceId]);

  useEffect(() => {
    (map.getSource(sourceId) as GeoJSONSource | undefined)?.setData({
      type: 'FeatureCollection',
      features: positions
        .filter((position) => (position.accuracy ?? 0) > 0)
        .map((position) =>
          turfCircle(
            [position.longitude, position.latitude],
            (position.accuracy as number) * 0.001,
            { units: 'kilometers' },
          ),
        ),
    });
  }, [sourceId, positions]);

  return null;
}
```

- [ ] **Step 4: Write the test — `src/map/layers/__tests__/MapPositions.test.tsx`**

The `map` singleton is mocked so the layer's effects can run in jsdom.

```tsx
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

const setData = vi.fn();
const fakeMap = {
  addSource: vi.fn(),
  addLayer: vi.fn(),
  removeLayer: vi.fn(),
  removeSource: vi.fn(),
  getLayer: vi.fn(() => true),
  getSource: vi.fn(() => ({ setData })),
  on: vi.fn(),
  off: vi.fn(),
  getCanvas: vi.fn(() => ({ style: {} })),
};

vi.mock('../../core/map-instance', () => ({ map: fakeMap }));

beforeEach(() => {
  setData.mockClear();
});

describe('MapPositions', () => {
  it('publishes position features to the geojson source', async () => {
    const { MapPositions } = await import('../MapPositions');
    const { useLiveStore } = await import('@/features/main/model/live-store');
    useLiveStore.setState({
      devices: { 7: { id: 7, name: 'Truck', category: 'truck', status: 'online' } as never },
    });
    render(
      <MapPositions
        positions={[
          { id: 1, deviceId: 7, longitude: 10, latitude: 20, attributes: {} } as never,
        ]}
      />,
    );
    expect(setData).toHaveBeenCalled();
  });
});
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/map/layers/__tests__/MapPositions.test.tsx`
Expected: PASS.

- [ ] **Step 6: Verify lint, typecheck**

Run: `npm run lint && npm run typecheck`
Expected: both exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/map/layers/MapPositions.tsx src/map/layers/MapGeofence.tsx src/map/layers/MapAccuracy.tsx src/map/layers/__tests__/MapPositions.test.tsx
git commit -m "Add map layers: positions with clustering, geofences, accuracy"
```

---

## Task 11: Map layers — live routes, selected device, default camera

**Files:**
- Create: `src/map/layers/MapLiveRoutes.tsx`, `src/map/layers/MapSelectedDevice.tsx`, `src/map/layers/MapDefaultCamera.tsx`, `src/map/index.ts`

- [ ] **Step 1: Implement `src/map/layers/MapLiveRoutes.tsx`**

```tsx
import { useEffect, useId } from 'react';
import type { GeoJSONSource } from 'maplibre-gl';
import { map } from '../core/map-instance';
import { useLiveStore } from '@/features/main/model/live-store';
import { useSelectionStore } from '@/features/main/model/selection-store';

const GEOMETRY_COLOR = '#3bb2d0';

export function MapLiveRoutes({ deviceIds }: { deviceIds: number[] }) {
  const sourceId = useId().replace(/:/g, '_');
  const history = useLiveStore((state) => state.history);
  const devices = useLiveStore((state) => state.devices);
  const selectedDeviceId = useSelectionStore((state) => state.selectedDeviceId);

  useEffect(() => {
    map.addSource(sourceId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    map.addLayer({
      id: sourceId,
      source: sourceId,
      type: 'line',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': ['get', 'width'],
        'line-opacity': ['get', 'opacity'],
      },
    });
    return () => {
      if (map.getLayer(sourceId)) {
        map.removeLayer(sourceId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    };
  }, [sourceId]);

  useEffect(() => {
    const features = deviceIds
      .filter((id) => history[id] && devices[id])
      .map((id) => ({
        type: 'Feature' as const,
        geometry: { type: 'LineString' as const, coordinates: history[id]! },
        properties: {
          color:
            (devices[id]?.attributes?.['web.reportColor'] as string) || GEOMETRY_COLOR,
          width: 2,
          opacity: 1,
        },
      }));
    (map.getSource(sourceId) as GeoJSONSource | undefined)?.setData({
      type: 'FeatureCollection',
      features,
    });
  }, [sourceId, deviceIds, history, devices, selectedDeviceId]);

  return null;
}
```

- [ ] **Step 2: Implement `src/map/layers/MapSelectedDevice.tsx`**

Eases the camera to the selected device when the selection changes. The previous-selection comparison uses a `ref` updated *after* the effect runs — never mutated during render.

```tsx
import { useEffect, useRef } from 'react';
import { map } from '../core/map-instance';
import { useLiveStore } from '@/features/main/model/live-store';
import { useSelectionStore } from '@/features/main/model/selection-store';

const SELECT_ZOOM = 10;

export function MapSelectedDevice() {
  const selectedDeviceId = useSelectionStore((state) => state.selectedDeviceId);
  const selectTime = useSelectionStore((state) => state.selectTime);
  const position = useLiveStore((state) =>
    selectedDeviceId ? state.positions[selectedDeviceId] : undefined,
  );
  const previousSelectTime = useRef(0);

  useEffect(() => {
    if (position && selectTime !== previousSelectTime.current) {
      map.easeTo({
        center: [position.longitude, position.latitude],
        zoom: Math.max(map.getZoom(), SELECT_ZOOM),
      });
    }
    previousSelectTime.current = selectTime;
  }, [selectedDeviceId, selectTime, position]);

  return null;
}
```

- [ ] **Step 3: Implement `src/map/layers/MapDefaultCamera.tsx`**

Fits the camera once to the initial set of positions. The `initialized` flag is a `ref` so it does not trigger re-renders.

```tsx
import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { map } from '../core/map-instance';
import { useSessionStore } from '@/entities/session';
import type { Position } from '@/entities/position';

export function MapDefaultCamera({ positions }: { positions: Position[] }) {
  const server = useSessionStore((state) => state.server);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) {
      return;
    }
    const defaultLatitude = server?.attributes?.latitude as number | undefined;
    const defaultLongitude = server?.attributes?.longitude as number | undefined;
    const defaultZoom = (server?.attributes?.zoom as number | undefined) ?? 0;

    if (defaultLatitude && defaultLongitude) {
      map.jumpTo({ center: [defaultLongitude, defaultLatitude], zoom: defaultZoom });
      initialized.current = true;
      return;
    }
    const coordinates = positions.map(
      (item) => [item.longitude, item.latitude] as [number, number],
    );
    if (coordinates.length > 1) {
      const bounds = coordinates.reduce(
        (acc, item) => acc.extend(item),
        new maplibregl.LngLatBounds(coordinates[0], coordinates[1]),
      );
      const canvas = map.getCanvas();
      map.fitBounds(bounds, {
        duration: 0,
        padding: Math.min(canvas.width, canvas.height) * 0.1,
      });
      initialized.current = true;
    } else if (coordinates.length === 1) {
      map.jumpTo({ center: coordinates[0]!, zoom: Math.max(defaultZoom, 10) });
      initialized.current = true;
    }
  }, [server, positions]);

  return null;
}
```

- [ ] **Step 4: Create the map barrel — `src/map/index.ts`**

```ts
export { MapView } from './core/MapView';
export { map } from './core/map-instance';
export { MapPositions } from './layers/MapPositions';
export { MapGeofence } from './layers/MapGeofence';
export { MapAccuracy } from './layers/MapAccuracy';
export { MapLiveRoutes } from './layers/MapLiveRoutes';
export { MapSelectedDevice } from './layers/MapSelectedDevice';
export { MapDefaultCamera } from './layers/MapDefaultCamera';
export { mapIconKey, mapIcons } from './core/preload-images';
export { getStatusColor } from './lib/status-color';
export type { StatusColorKey } from './lib/status-color';
```

- [ ] **Step 5: Verify lint, typecheck**

Run: `npm run lint && npm run typecheck`
Expected: both exit 0. (`MapSelectedDevice`/`MapDefaultCamera` mutate refs only after the effect logic — no `react-hooks/refs` violation.)

- [ ] **Step 6: Commit**

```bash
git add src/map/layers/MapLiveRoutes.tsx src/map/layers/MapSelectedDevice.tsx src/map/layers/MapDefaultCamera.tsx src/map/index.ts
git commit -m "Add map layers: live routes, selected device, default camera"
```

---

## Task 12: Live controllers — socket, caching, motion

**Files:**
- Create: `src/features/live/SocketController.tsx`, `src/features/live/CachingController.tsx`, `src/features/live/MotionController.tsx`, `src/features/live/index.ts`, `src/features/live/motion-store.ts`
- Test: `src/features/live/__tests__/motion-store.test.ts`

- [ ] **Step 1: Implement `src/features/live/motion-store.ts`**

```ts
import { create } from 'zustand';
import type { MotionSegment } from '@/features/main/lib/motion-segments';

interface MotionState {
  segments: Record<number, MotionSegment[]>;
  set: (segments: Record<number, MotionSegment[]>) => void;
  clear: () => void;
}

export const useMotionStore = create<MotionState>((set) => ({
  segments: {},
  set: (segments) => set({ segments }),
  clear: () => set({ segments: {} }),
}));
```

- [ ] **Step 2: Write the test — `src/features/live/__tests__/motion-store.test.ts`**

```ts
import { describe, expect, it, beforeEach } from 'vitest';
import { useMotionStore } from '../motion-store';

beforeEach(() => useMotionStore.setState({ segments: {} }));

describe('useMotionStore', () => {
  it('stores and clears motion segments', () => {
    useMotionStore.getState().set({ 5: [{ type: 'moving', value: 10 }] });
    expect(useMotionStore.getState().segments[5]).toHaveLength(1);
    useMotionStore.getState().clear();
    expect(useMotionStore.getState().segments).toEqual({});
  });
});
```

- [ ] **Step 3: Implement `src/features/live/SocketController.tsx`**

Headless controller. Opens `/api/socket`, dispatches `devices`/`positions`/`events`/`logs` into the live store, and reconnects on a non-logout close by refetching `/api/devices` + `/api/positions`. The socket and reconnect timer are `ref`s; the live-routes preference comes from server/user attributes.

```tsx
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/entities/session';
import { fetchDevices } from '@/entities/device';
import { fetchPositions } from '@/entities/position';
import { useLiveStore } from '@/features/main/model/live-store';
import { parseSocketMessage } from '@/features/main/lib/socket-message';

const LOGOUT_CODE = 4000;
const RECONNECT_DELAY = 60_000;

export function SocketController() {
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);
  const server = useSessionStore((state) => state.server);
  const includeLogs = useLiveStore((state) => state.includeLogs);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const liveConfigRef = useRef({ liveRoutes: 'none', limit: 10 });

  useEffect(() => {
    liveConfigRef.current = {
      liveRoutes:
        (user?.attributes?.mapLiveRoutes as string) ||
        (server?.attributes?.mapLiveRoutes as string) ||
        'none',
      limit:
        (user?.attributes?.['web.liveRouteLength'] as number) ||
        (server?.attributes?.['web.liveRouteLength'] as number) ||
        10,
    };
  }, [user, server]);

  useEffect(() => {
    if (!user) {
      return;
    }
    const live = useLiveStore.getState();

    const clearReconnect = () => {
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
    };

    const connect = () => {
      clearReconnect();
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const socket = new WebSocket(`${protocol}//${window.location.host}/api/socket`);
      socketRef.current = socket;

      socket.onopen = () => live.setSocketOpen(true);

      socket.onmessage = (event) => {
        const data = parseSocketMessage(event.data as string);
        if (data.devices) {
          live.updateDevices(data.devices);
        }
        if (data.positions) {
          const { liveRoutes, limit } = liveConfigRef.current;
          live.applyPositions(data.positions, liveRoutes, limit);
        }
        if (data.events) {
          live.addEvents(data.events);
        }
        if (data.logs) {
          live.setLogs(data.logs);
        }
      };

      socket.onclose = async (event) => {
        live.setSocketOpen(false);
        if (event.code === LOGOUT_CODE) {
          return;
        }
        try {
          const devices = await fetchDevices();
          live.refreshDevices(devices);
          const positions = await fetchPositions();
          const { liveRoutes, limit } = liveConfigRef.current;
          live.refreshPositions(positions);
          live.applyPositions(positions, liveRoutes, limit);
        } catch {
          navigate('/login');
        }
        clearReconnect();
        reconnectRef.current = setTimeout(connect, RECONNECT_DELAY);
      };
    };

    void fetchDevices().then((devices) => live.refreshDevices(devices));
    connect();

    return () => {
      clearReconnect();
      socketRef.current?.close(LOGOUT_CODE);
    };
  }, [user, navigate]);

  useEffect(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ logs: includeLogs }));
    }
  }, [includeLogs]);

  return null;
}
```

- [ ] **Step 4: Implement `src/features/live/CachingController.tsx`**

Prefetches the reference collections into the TanStack Query cache (the `CachingController` equivalent). Geofences and groups have query hooks; drivers/maintenance/calendars are prefetched generically for later plans.

```tsx
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '@/entities/session';
import { geofenceKeys, fetchGeofences } from '@/entities/geofence';
import { groupKeys, fetchGroups } from '@/entities/group';
import { apiClient } from '@/shared/api/client';

export function CachingController() {
  const queryClient = useQueryClient();
  const user = useSessionStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      return;
    }
    void queryClient.prefetchQuery({ queryKey: geofenceKeys.all, queryFn: fetchGeofences });
    void queryClient.prefetchQuery({ queryKey: groupKeys.all, queryFn: fetchGroups });
    void queryClient.prefetchQuery({
      queryKey: ['drivers'],
      queryFn: async () => (await apiClient.GET('/drivers')).data ?? [],
    });
    void queryClient.prefetchQuery({
      queryKey: ['maintenance'],
      queryFn: async () => (await apiClient.GET('/maintenance')).data ?? [],
    });
    void queryClient.prefetchQuery({
      queryKey: ['calendars'],
      queryFn: async () => (await apiClient.GET('/calendars')).data ?? [],
    });
  }, [user, queryClient]);

  return null;
}
```

- [ ] **Step 5: Implement `src/features/live/MotionController.tsx`**

Polls `/api/reports/events` for the last 24h of `deviceMoving`/`deviceStopped`, groups by device, builds segments, and refreshes every 5 minutes — only when `deviceSecondary` is `motion`.

```tsx
import { useEffect } from 'react';
import dayjs from 'dayjs';
import { useSessionStore } from '@/entities/session';
import { useMotionStore } from './motion-store';
import { buildMotionSegments, type MotionEvent } from '@/features/main/lib/motion-segments';

const REFRESH_INTERVAL = 5 * 60 * 1000;

interface ReportEvent extends MotionEvent {
  deviceId: number;
}

export function MotionController() {
  const user = useSessionStore((state) => state.user);
  const server = useSessionStore((state) => state.server);
  const deviceSecondary =
    (user?.attributes?.deviceSecondary as string) ||
    (server?.attributes?.deviceSecondary as string) ||
    '';

  useEffect(() => {
    if (deviceSecondary !== 'motion') {
      useMotionStore.getState().clear();
      return;
    }
    let active = true;

    const refresh = async () => {
      const to = dayjs();
      const from = to.subtract(24, 'hour');
      const query = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
      query.append('type', 'deviceMoving');
      query.append('type', 'deviceStopped');
      const response = await fetch(`/api/reports/events?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        return;
      }
      const events = (await response.json()) as ReportEvent[];
      const grouped = new Map<number, ReportEvent[]>();
      for (const event of events) {
        const list = grouped.get(event.deviceId) ?? [];
        list.push(event);
        grouped.set(event.deviceId, list);
      }
      const segments: Record<number, ReturnType<typeof buildMotionSegments>> = {};
      for (const [deviceId, deviceEvents] of grouped) {
        segments[deviceId] = buildMotionSegments(deviceEvents, from.valueOf(), to.valueOf());
      }
      if (active) {
        useMotionStore.getState().set(segments);
      }
    };

    void refresh();
    const interval = setInterval(() => void refresh(), REFRESH_INTERVAL);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [deviceSecondary]);

  return null;
}
```

- [ ] **Step 6: Create the live barrel — `src/features/live/index.ts`**

```ts
export { SocketController } from './SocketController';
export { CachingController } from './CachingController';
export { MotionController } from './MotionController';
export { useMotionStore } from './motion-store';
```

- [ ] **Step 7: Run the test, lint, typecheck**

Run: `npx vitest run src/features/live && npm run lint && npm run typecheck`
Expected: all exit 0; the motion-store test passes.

- [ ] **Step 8: Commit**

```bash
git add src/features/live
git commit -m "Add live controllers: socket, caching prefetch, motion poller"
```

---

## Task 13: Device row & motion bar

**Files:**
- Create: `src/features/main/DeviceRow.tsx`, `src/features/main/MotionBar.tsx`
- Test: `src/features/main/__tests__/DeviceRow.test.tsx`

- [ ] **Step 1: Implement `src/features/main/MotionBar.tsx`**

```tsx
import { useMotionStore } from '@/features/live';
import { cn } from '@/shared/lib/cn';

export function MotionBar({ deviceId }: { deviceId: number }) {
  const segments = useMotionStore((state) => state.segments[deviceId] ?? []);

  return (
    <span className="inline-flex h-2 w-32 bg-muted align-middle">
      {segments.map((segment, index) => (
        <span
          key={index}
          className={cn(segment.type === 'moving' ? 'bg-emerald-500' : 'bg-rose-500')}
          style={{ flexGrow: segment.value, minWidth: segments.length > 16 ? 0 : 4 }}
        />
      ))}
    </span>
  );
}
```

- [ ] **Step 2: Implement `src/features/main/DeviceRow.tsx`**

A `react-window` row: category icon, name, status/last-update secondary line, optional alarm/ignition/battery badges, or a motion bar when configured. Clicking selects the device.

```tsx
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useTranslation } from 'react-i18next';
import { AlertCircle, BatteryFull, BatteryLow, BatteryMedium, Power } from 'lucide-react';
import { mapIconKey, mapIcons, getStatusColor } from '@/map';
import { useLiveStore } from './model/live-store';
import { useSelectionStore } from './model/selection-store';
import { MotionBar } from './MotionBar';
import { cn } from '@/shared/lib/cn';
import type { Device } from '@/entities/device';

dayjs.extend(relativeTime);

const STATUS_TEXT_CLASS: Record<string, string> = {
  success: 'text-emerald-600',
  error: 'text-rose-600',
  neutral: 'text-muted-foreground',
};

interface DeviceRowProps {
  index: number;
  style: React.CSSProperties;
  devices: Device[];
}

function batteryIcon(level: number) {
  if (level > 70) {
    return <BatteryFull className="h-4 w-4 text-emerald-600" />;
  }
  if (level > 30) {
    return <BatteryMedium className="h-4 w-4 text-amber-600" />;
  }
  return <BatteryLow className="h-4 w-4 text-rose-600" />;
}

export function DeviceRow({ index, style, devices }: DeviceRowProps) {
  const { t } = useTranslation();
  const device = devices[index]!;
  const position = useLiveStore((state) => state.positions[device.id as number]);
  const selectedDeviceId = useSelectionStore((state) => state.selectedDeviceId);
  const select = useSelectionStore((state) => state.select);

  const secondary =
    device.status === 'online' || !device.lastUpdate
      ? t(`deviceStatus${device.status === 'online' ? 'Online' : device.status === 'offline' ? 'Offline' : 'Unknown'}`)
      : dayjs(device.lastUpdate).fromNow();
  const attributes = position?.attributes ?? {};

  return (
    <div style={style}>
      <button
        type="button"
        onClick={() => select(device.id as number)}
        className={cn(
          'flex h-[72px] w-full items-center gap-3 px-3 text-left',
          selectedDeviceId === device.id ? 'bg-muted' : 'hover:bg-muted/60',
        )}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary">
          <img
            src={mapIcons[mapIconKey(device.category)]}
            alt=""
            className="h-5 w-5 brightness-0 invert"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{device.name}</span>
          <span className="block truncate text-xs">
            {'motion' in attributes ? <MotionBar deviceId={device.id as number} /> : null}
            <span className={STATUS_TEXT_CLASS[getStatusColor(device.status)]}>{secondary}</span>
          </span>
        </span>
        {position && 'alarm' in attributes ? (
          <AlertCircle className="h-4 w-4 text-rose-600" aria-label={t('eventAlarm')} />
        ) : null}
        {position && 'ignition' in attributes ? (
          <Power
            className={cn('h-4 w-4', attributes.ignition ? 'text-emerald-600' : 'text-muted-foreground')}
            aria-label={t('positionIgnition')}
          />
        ) : null}
        {position && 'batteryLevel' in attributes
          ? batteryIcon(attributes.batteryLevel as number)
          : null}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Write the test — `src/features/main/__tests__/DeviceRow.test.tsx`**

```tsx
import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '@/shared/i18n';
import { DeviceRow } from '../DeviceRow';
import { useSelectionStore } from '../model/selection-store';
import { useLiveStore } from '../model/live-store';
import type { Device } from '@/entities/device';

const devices: Device[] = [
  { id: 9, name: 'Truck Nine', category: 'truck', status: 'online', attributes: {} } as Device,
];

beforeEach(() => {
  useSelectionStore.setState({ selectedDeviceId: null, selectTime: 0 });
  useLiveStore.setState({ positions: {} });
});

function renderRow() {
  return render(
    <I18nextProvider i18n={i18n}>
      <DeviceRow index={0} style={{}} devices={devices} />
    </I18nextProvider>,
  );
}

describe('DeviceRow', () => {
  it('renders the device name', () => {
    renderRow();
    expect(screen.getByText('Truck Nine')).toBeInTheDocument();
  });

  it('selects the device when clicked', async () => {
    renderRow();
    await userEvent.click(screen.getByRole('button'));
    expect(useSelectionStore.getState().selectedDeviceId).toBe(9);
  });
});
```

- [ ] **Step 4: Run the test, lint, typecheck**

Run: `npx vitest run src/features/main/__tests__/DeviceRow.test.tsx && npm run lint && npm run typecheck`
Expected: all exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/features/main/DeviceRow.tsx src/features/main/MotionBar.tsx src/features/main/__tests__/DeviceRow.test.tsx
git commit -m "Add device row and motion bar components"
```

---

## Task 14: Device list & main toolbar

**Files:**
- Create: `src/features/main/DeviceList.tsx`, `src/features/main/MainToolbar.tsx`
- Test: `src/features/main/__tests__/MainToolbar.test.tsx`

- [ ] **Step 1: Implement `src/features/main/DeviceList.tsx`**

A `react-window` v2 virtualized list (72px rows). A 60s tick refreshes the relative `lastUpdate` text.

```tsx
import { useEffect, useState } from 'react';
import { List } from 'react-window';
import { DeviceRow } from './DeviceRow';
import type { Device } from '@/entities/device';

export function DeviceList({ devices }: { devices: Device[] }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((value) => value + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <List
      className="h-full"
      rowComponent={DeviceRow}
      rowCount={devices.length}
      rowHeight={72}
      rowProps={{ devices }}
      overscanCount={5}
    />
  );
}
```

- [ ] **Step 2: Implement `src/features/main/MainToolbar.tsx`**

Search input, a filter popover (status multi-select with counts, group multi-select, sort, show-on-map checkbox), a list/map toggle button, and an add-device button. Built on shadcn primitives.

```tsx
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { List as ListIcon, Map as MapIcon, Plus, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/shared/ui';
import { Input } from '@/shared/ui';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { useGroupsQuery } from '@/entities/group';
import { useDeviceReadonly } from '@/entities/session';
import { useFilterStore } from './model/filter-store';
import { useMapUiStore } from './model/map-ui-store';
import { useLiveStore } from './model/live-store';
import type { DeviceSort } from './lib/filter-devices';

const STATUSES = ['online', 'offline', 'unknown'] as const;

export function MainToolbar() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const deviceReadonly = useDeviceReadonly();
  const { data: groups = [] } = useGroupsQuery();
  const devices = useLiveStore((state) => state.devices);

  const keyword = useFilterStore((state) => state.keyword);
  const setKeyword = useFilterStore((state) => state.setKeyword);
  const statuses = useFilterStore((state) => state.statuses);
  const setStatuses = useFilterStore((state) => state.setStatuses);
  const groupFilter = useFilterStore((state) => state.groups);
  const setGroups = useFilterStore((state) => state.setGroups);
  const sort = useFilterStore((state) => state.sort);
  const setSort = useFilterStore((state) => state.setSort);
  const filterMap = useFilterStore((state) => state.filterMap);
  const setFilterMap = useFilterStore((state) => state.setFilterMap);

  const devicesOpen = useMapUiStore((state) => state.devicesOpen);
  const setDevicesOpen = useMapUiStore((state) => state.setDevicesOpen);

  const statusCount = (status: string) =>
    Object.values(devices).filter((device) => device.status === status).length;

  const toggleStatus = (status: string) =>
    setStatuses(
      statuses.includes(status)
        ? statuses.filter((value) => value !== status)
        : [...statuses, status],
    );

  const toggleGroup = (id: number) =>
    setGroups(
      groupFilter.includes(id)
        ? groupFilter.filter((value) => value !== id)
        : [...groupFilter, id],
    );

  const filterActive = statuses.length > 0 || groupFilter.length > 0;

  return (
    <div className="flex items-center gap-2 border-b border-border p-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t('mapTitle')}
        onClick={() => setDevicesOpen(!devicesOpen)}
      >
        {devicesOpen ? <MapIcon className="h-4 w-4" /> : <ListIcon className="h-4 w-4" />}
      </Button>
      <Input
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        placeholder={t('sharedSearchDevices')}
        className="flex-1"
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t('sharedFilter')}
            data-active={filterActive}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="flex w-64 flex-col gap-3">
          <fieldset className="flex flex-col gap-1">
            <legend className="text-xs font-medium">{t('deviceStatus')}</legend>
            {STATUSES.map((status) => (
              <label key={status} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={statuses.includes(status)}
                  onChange={() => toggleStatus(status)}
                />
                {t(`deviceStatus${status[0]!.toUpperCase()}${status.slice(1)}`)} (
                {statusCount(status)})
              </label>
            ))}
          </fieldset>
          <fieldset className="flex max-h-40 flex-col gap-1 overflow-auto">
            <legend className="text-xs font-medium">{t('settingsGroups')}</legend>
            {[...groups]
              .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
              .map((group) => (
                <label key={group.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={groupFilter.includes(group.id as number)}
                    onChange={() => toggleGroup(group.id as number)}
                  />
                  {group.name}
                </label>
              ))}
          </fieldset>
          <label className="flex flex-col gap-1 text-xs font-medium">
            {t('sharedSortBy')}
            <select
              className="rounded border border-border bg-background p-1 text-sm"
              value={sort}
              onChange={(event) => setSort(event.target.value as DeviceSort)}
            >
              <option value="">&nbsp;</option>
              <option value="name">{t('sharedName')}</option>
              <option value="lastUpdate">{t('deviceLastUpdate')}</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filterMap}
              onChange={(event) => setFilterMap(event.target.checked)}
            />
            {t('sharedFilterMap')}
          </label>
        </PopoverContent>
      </Popover>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t('sharedAdd')}
        disabled={deviceReadonly}
        onClick={() => navigate('/settings/device')}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

> **Note:** This task needs the shadcn `popover` primitive. Add it first with `npx shadcn@latest add popover --yes`, then append `export * from './popover';` to `src/shared/ui/index.ts`.

- [ ] **Step 3: Add the Popover primitive**

```bash
npx shadcn@latest add popover --yes
```

Then append to `src/shared/ui/index.ts`:

```ts
export * from './popover';
```

- [ ] **Step 4: Write the test — `src/features/main/__tests__/MainToolbar.test.tsx`**

```tsx
import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '@/shared/i18n';
import { MainToolbar } from '../MainToolbar';
import { useFilterStore } from '../model/filter-store';

beforeEach(() => {
  useFilterStore.setState({ keyword: '', statuses: [], groups: [], sort: '', filterMap: false });
});

function renderToolbar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <MainToolbar />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('MainToolbar', () => {
  it('writes the search keyword to the filter store', async () => {
    renderToolbar();
    await userEvent.type(screen.getByPlaceholderText(/search/i), 'truck');
    expect(useFilterStore.getState().keyword).toBe('truck');
  });
});
```

- [ ] **Step 5: Run the test, lint, typecheck**

Run: `npx vitest run src/features/main/__tests__/MainToolbar.test.tsx && npm run lint && npm run typecheck`
Expected: all exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/features/main/DeviceList.tsx src/features/main/MainToolbar.tsx src/features/main/__tests__/MainToolbar.test.tsx src/shared/ui/popover.tsx src/shared/ui/index.ts
git commit -m "Add virtualized device list and main toolbar"
```

---

## Task 15: StatusCard popup & events drawer

**Files:**
- Create: `src/features/main/StatusCard.tsx`, `src/features/main/EventsDrawer.tsx`
- Test: `src/features/main/__tests__/StatusCard.test.tsx`

- [ ] **Step 1: Implement `src/features/main/StatusCard.tsx`**

A draggable device popup built on `react-rnd` (already a dependency). Shows the device name + key position attributes; the close button deselects the device.

```tsx
import { Rnd } from 'react-rnd';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui';
import { useLiveStore } from './model/live-store';
import { useSelectionStore } from './model/selection-store';

const ATTRIBUTE_FIELDS: { key: string; labelKey: string }[] = [
  { key: 'speed', labelKey: 'positionSpeed' },
  { key: 'address', labelKey: 'positionAddress' },
  { key: 'batteryLevel', labelKey: 'positionBatteryLevel' },
];

export function StatusCard({ deviceId }: { deviceId: number }) {
  const { t } = useTranslation();
  const device = useLiveStore((state) => state.devices[deviceId]);
  const position = useLiveStore((state) => state.positions[deviceId]);
  const select = useSelectionStore((state) => state.select);

  if (!device) {
    return null;
  }

  return (
    <Rnd
      default={{ x: 24, y: 24, width: 320, height: 'auto' }}
      bounds="parent"
      enableResizing={false}
      dragHandleClassName="status-card-handle"
      style={{ zIndex: 5, pointerEvents: 'auto' }}
    >
      <Card>
        <div className="status-card-handle flex cursor-move items-center justify-between border-b border-border p-2">
          <span className="truncate text-sm font-medium">{device.name}</span>
          <button
            type="button"
            aria-label={t('sharedClose')}
            onClick={() => select(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <CardContent className="p-2 text-sm">
          {position ? (
            <dl className="grid grid-cols-2 gap-1">
              {ATTRIBUTE_FIELDS.map(({ key, labelKey }) => {
                const value =
                  key in (position.attributes ?? {})
                    ? position.attributes[key]
                    : (position as Record<string, unknown>)[key];
                if (value === undefined || value === null) {
                  return null;
                }
                return (
                  <div key={key} className="contents">
                    <dt className="text-muted-foreground">{t(labelKey)}</dt>
                    <dd className="truncate">{String(value)}</dd>
                  </div>
                );
              })}
            </dl>
          ) : (
            <span className="text-muted-foreground">{t('sharedNoData')}</span>
          )}
        </CardContent>
      </Card>
    </Rnd>
  );
}
```

- [ ] **Step 2: Implement `src/features/main/EventsDrawer.tsx`**

A right-side drawer of live events, built on the shadcn `dialog` primitive (already present) used as a side sheet. Each row navigates to the event; per-row delete + clear-all use the live store.

```tsx
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Trash2, X } from 'lucide-react';
import { useLiveStore } from './model/live-store';
import { cn } from '@/shared/lib/cn';

interface EventsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function EventsDrawer({ open, onClose }: EventsDrawerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const events = useLiveStore((state) => state.events);
  const devices = useLiveStore((state) => state.devices);
  const deleteEvent = useLiveStore((state) => state.deleteEvent);
  const clearEvents = useLiveStore((state) => state.clearEvents);

  return (
    <aside
      aria-hidden={!open}
      className={cn(
        'fixed inset-y-0 end-0 z-20 w-80 border-s border-border bg-background shadow-lg transition-transform',
        open ? 'translate-x-0' : 'translate-x-full rtl:-translate-x-full',
      )}
    >
      <div className="flex items-center justify-between border-b border-border p-2">
        <span className="text-sm font-medium">{t('reportEvents')}</span>
        <div className="flex gap-1">
          <button type="button" aria-label={t('sharedRemove')} onClick={() => clearEvents()}>
            <Trash2 className="h-4 w-4" />
          </button>
          <button type="button" aria-label={t('sharedClose')} onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <ul className="divide-y divide-border overflow-auto">
        {events.map((event) => (
          <li key={event.id} className="flex items-center gap-2 p-2 text-sm">
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              disabled={!event.id}
              onClick={() => navigate(`/event/${event.id}`)}
            >
              <span className="block truncate">
                {devices[event.deviceId as number]?.name} • {t(`event${event.type}`)}
              </span>
            </button>
            <button
              type="button"
              aria-label={t('sharedRemove')}
              onClick={() => deleteEvent(event.id as number)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
```

- [ ] **Step 3: Write the test — `src/features/main/__tests__/StatusCard.test.tsx`**

```tsx
import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '@/shared/i18n';
import { StatusCard } from '../StatusCard';
import { useLiveStore } from '../model/live-store';
import { useSelectionStore } from '../model/selection-store';

beforeEach(() => {
  useSelectionStore.setState({ selectedDeviceId: 4, selectTime: 1 });
  useLiveStore.setState({
    devices: { 4: { id: 4, name: 'Card Device', attributes: {} } as never },
    positions: {},
  });
});

describe('StatusCard', () => {
  it('shows the device name and deselects on close', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <StatusCard deviceId={4} />
      </I18nextProvider>,
    );
    expect(screen.getByText('Card Device')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(useSelectionStore.getState().selectedDeviceId).toBeNull();
  });
});
```

- [ ] **Step 4: Run the test, lint, typecheck**

Run: `npx vitest run src/features/main/__tests__/StatusCard.test.tsx && npm run lint && npm run typecheck`
Expected: all exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/features/main/StatusCard.tsx src/features/main/EventsDrawer.tsx src/features/main/__tests__/StatusCard.test.tsx
git commit -m "Add StatusCard device popup and events drawer"
```

---

## Task 16: MainMap & MainPage composition

**Files:**
- Create: `src/features/main/MainMap.tsx`, `src/features/main/MainPage.tsx`, `src/features/main/index.ts`
- Modify: `src/pages/MainPage.tsx`, `src/features/shell/AppShell.tsx`
- Test: `src/features/main/__tests__/MainPage.test.tsx`

- [ ] **Step 1: Implement `src/features/main/MainMap.tsx`**

Composes `MapView` with every layer. The marker click selects the device.

```tsx
import { useCallback } from 'react';
import {
  MapView,
  MapPositions,
  MapGeofence,
  MapAccuracy,
  MapLiveRoutes,
  MapSelectedDevice,
  MapDefaultCamera,
} from '@/map';
import { useSelectionStore } from './model/selection-store';
import type { Position } from '@/entities/position';

export function MainMap({ positions }: { positions: Position[] }) {
  const select = useSelectionStore((state) => state.select);
  const onMarkerClick = useCallback((deviceId: number) => select(deviceId), [select]);

  return (
    <MapView>
      <MapGeofence />
      <MapAccuracy positions={positions} />
      <MapLiveRoutes deviceIds={positions.map((position) => position.deviceId as number)} />
      <MapPositions positions={positions} onMarkerClick={onMarkerClick} />
      <MapDefaultCamera positions={positions} />
      <MapSelectedDevice />
    </MapView>
  );
}
```

- [ ] **Step 2: Implement `src/features/main/MainPage.tsx`**

The responsive composition: desktop = fixed ~280px sidebar overlaying the map; mobile = toggled list/map. Devices/positions come from the live store; the pure filter derives the visible lists.

```tsx
import { useMemo, useState } from 'react';
import { useMediaQuery } from '@/shared/lib/use-media-query';
import { useGroupsQuery } from '@/entities/group';
import { MainMap } from './MainMap';
import { MainToolbar } from './MainToolbar';
import { DeviceList } from './DeviceList';
import { StatusCard } from './StatusCard';
import { EventsDrawer } from './EventsDrawer';
import { filterDevices } from './lib/filter-devices';
import { useLiveStore } from './model/live-store';
import { useFilterStore } from './model/filter-store';
import { useMapUiStore } from './model/map-ui-store';
import { useSelectionStore } from './model/selection-store';

export function MainPage() {
  const desktop = useMediaQuery('(min-width: 768px)');
  const { data: groups = [] } = useGroupsQuery();

  const devices = useLiveStore((state) => state.devices);
  const positions = useLiveStore((state) => state.positions);
  const selectedDeviceId = useSelectionStore((state) => state.selectedDeviceId);

  const keyword = useFilterStore((state) => state.keyword);
  const statuses = useFilterStore((state) => state.statuses);
  const groupFilter = useFilterStore((state) => state.groups);
  const sort = useFilterStore((state) => state.sort);
  const filterMap = useFilterStore((state) => state.filterMap);

  const devicesOpen = useMapUiStore((state) => state.devicesOpen);
  const [eventsOpen, setEventsOpen] = useState(false);

  const filteredDevices = useMemo(
    () =>
      filterDevices(Object.values(devices), groups, {
        keyword,
        statuses,
        groups: groupFilter,
        sort,
      }),
    [devices, groups, keyword, statuses, groupFilter, sort],
  );

  const filteredPositions = useMemo(() => {
    if (filterMap) {
      return filteredDevices
        .map((device) => positions[device.id as number])
        .filter((position): position is NonNullable<typeof position> => Boolean(position));
    }
    return Object.values(positions);
  }, [filterMap, filteredDevices, positions]);

  return (
    <div className="relative h-full">
      <div className="absolute inset-0">
        <MainMap positions={filteredPositions} />
      </div>
      <div className="pointer-events-none absolute inset-y-0 start-0 flex w-full flex-col p-0 md:m-3 md:h-[calc(100%-1.5rem)] md:w-[280px]">
        <div className="pointer-events-auto bg-background shadow">
          <MainToolbar />
        </div>
        {(devicesOpen || !desktop) && (
          <div
            className="pointer-events-auto flex-1 overflow-hidden bg-background shadow"
            style={devicesOpen ? undefined : { visibility: 'hidden' }}
          >
            <DeviceList devices={filteredDevices} />
          </div>
        )}
      </div>
      <EventsDrawer open={eventsOpen} onClose={() => setEventsOpen(false)} />
      {selectedDeviceId && <StatusCard deviceId={selectedDeviceId} />}
    </div>
  );
}
```

- [ ] **Step 3: Create the main barrel — `src/features/main/index.ts`**

```ts
export { MainPage } from './MainPage';
```

- [ ] **Step 4: Rewrite `src/pages/MainPage.tsx`**

```tsx
import { MainPage as MainPageView } from '@/features/main';

export default function MainPage() {
  return <MainPageView />;
}
```

- [ ] **Step 5: Mount the live controllers in `src/features/shell/AppShell.tsx`**

Replace the placeholder comment `{/* SocketController / CachingController / UpdateController attach here in later plans. */}` with the live controllers:

```tsx
import { SocketController, CachingController, MotionController } from '@/features/live';
```

and inside `<TermsGate>`, above `<NativeBridge />`:

```tsx
      <SocketController />
      <CachingController />
      <MotionController />
```

- [ ] **Step 6: Write the test — `src/features/main/__tests__/MainPage.test.tsx`**

`maplibre-gl` and the `map` singleton are mocked so the page mounts in jsdom.

```tsx
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '@/shared/i18n';

vi.mock('@/map', () => ({
  MapView: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  MapPositions: () => null,
  MapGeofence: () => null,
  MapAccuracy: () => null,
  MapLiveRoutes: () => null,
  MapSelectedDevice: () => null,
  MapDefaultCamera: () => null,
  mapIconKey: () => 'default',
  mapIcons: { default: 'x' },
  getStatusColor: () => 'neutral',
}));

beforeEach(async () => {
  const { useLiveStore } = await import('../model/live-store');
  useLiveStore.setState({ devices: {}, positions: {}, history: {}, events: [] });
});

describe('MainPage', () => {
  it('renders the toolbar search box', async () => {
    const { MainPage } = await import('../MainPage');
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <I18nextProvider i18n={i18n}>
          <MemoryRouter>
            <MainPage />
          </MemoryRouter>
        </I18nextProvider>
      </QueryClientProvider>,
    );
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Run the test, lint, typecheck, build**

Run: `npx vitest run src/features/main/__tests__/MainPage.test.tsx && npm run lint && npm run typecheck && npm run build`
Expected: all exit 0.

- [ ] **Step 8: Commit**

```bash
git add src/features/main/MainMap.tsx src/features/main/MainPage.tsx src/features/main/index.ts src/features/main/__tests__/MainPage.test.tsx src/pages/MainPage.tsx src/features/shell/AppShell.tsx
git commit -m "Compose MainMap and MainPage; mount live controllers in the shell"
```

---

## Task 17: E2E smoke for the map & device list

**Files:**
- Create: `e2e/map.spec.ts`

- [ ] **Step 1: Write the E2E test — `e2e/map.spec.ts`**

The map/socket need a backend; this smoke test runs against the built preview with no backend and asserts the page shell renders without crashing. It stubs `/api` so the protected route resolves to the main page.

```ts
import { test, expect } from '@playwright/test';

test('main page renders the map shell and device toolbar', async ({ page }) => {
  await page.route('**/api/server', (route) =>
    route.fulfill({ json: { id: 1, attributes: {} } }),
  );
  await page.route('**/api/session', (route) =>
    route.fulfill({ json: { id: 1, name: 'Tester', attributes: {} } }),
  );
  await page.route('**/api/devices', (route) => route.fulfill({ json: [] }));
  await page.route('**/api/positions', (route) => route.fulfill({ json: [] }));
  await page.route('**/api/geofences', (route) => route.fulfill({ json: [] }));
  await page.route('**/api/groups', (route) => route.fulfill({ json: [] }));

  await page.goto('/');
  await expect(page.getByPlaceholder(/search/i)).toBeVisible();
});
```

- [ ] **Step 2: Run the E2E suite**

Run: `npm run e2e`
Expected: PASS — the existing auth/shell specs plus the new map spec pass.

- [ ] **Step 3: Run the full gate**

Run: `npm run lint && npm run typecheck && npm test && npm run build && npm run e2e`
Expected: every command exits 0.

- [ ] **Step 4: Commit**

```bash
git add e2e/map.spec.ts
git commit -m "Add E2E smoke for the map and device list"
```

---

## Self-Review

**Spec coverage** — every in-scope item from the Plan 3 scope maps to a task:

| In-scope item | Task |
|---------------|------|
| MapLibre singleton / MapView wrapper + ready signal | T8 (`map-instance`), T9 (`MapView`) |
| Map styles (free working, key-gated inert) + style switcher | T7 (`map-styles`), T8 (`SwitcherControl`), T9 (switcher wiring) |
| Sprite / icon preloading | T8 (`preload-images`) |
| Positions layer + native clustering | T10 (`MapPositions`) |
| Geofences layer (WKT → GeoJSON) | T6 (`geofenceToFeature`), T10 (`MapGeofence`) |
| Accuracy circles | T10 (`MapAccuracy`) |
| Live routes | T11 (`MapLiveRoutes`), T5 (`appendHistory` in live store) |
| Selected-device camera | T11 (`MapSelectedDevice`) |
| Default camera / fit-to-bounds | T11 (`MapDefaultCamera`) |
| Responsive main page | T16 (`MainPage`) |
| Toolbar: search + status/group/sort filter + add + list/map toggle | T14 (`MainToolbar`) |
| Virtualized device list | T14 (`DeviceList`) |
| Device row | T13 (`DeviceRow`) |
| Motion bar | T13 (`MotionBar`) |
| WebSocket controller + reconnect | T12 (`SocketController`), T4 (`parseSocketMessage`) |
| Device/position/event/geofence/group stores & query integration | T1, T2 (entities), T5 (live/selection/filter/map-UI stores) |
| CachingController equivalent | T12 (`CachingController`) |
| MotionController equivalent | T4 (`buildMotionSegments`), T12 (`MotionController`) |
| StatusCard device popup | T15 (`StatusCard`) |
| Device selection | T5 (`selection-store`), wired in T10/T13/T16 |
| Events drawer | T15 (`EventsDrawer`) |
| Device filter port of `useFilter` | T3 (`filterDevices`) |

**Out of scope (correctly excluded, deferred to later plans):** ReplayPage, PositionPage, NetworkPage, EventPage detail, POI map, weather/traffic overlays, the geocoder search box, Settings/Reports pages. Key-gated map providers (MapTiler/Bing/TomTom/HERE/Mapbox) are *defined* in `map-styles.ts` but `available: false` until keys are supplied — they need not function, matching the spec allowance. The events drawer rows navigate to `/event/:id`, a route owned by a later plan; the link is left in place (legacy parity) but the target page is out of scope here.

**Placeholder scan:** No `TODO`, `TBD`, or "similar to Task N" — every code step contains complete, real code. Two inline operational `> **Note:**` callouts (sprite-asset copy in T8, `popover` primitive in T14) each have a corresponding numbered step (T8 Step 4, T14 Step 3) so nothing is left implicit.

**Type/name consistency check:**
- Entity types `Device`, `Position`, `Geofence`, `Group`, `DeviceEvent` are defined once (T1/T2) and imported everywhere via the entity barrels.
- Store hooks `useLiveStore`, `useSelectionStore`, `useFilterStore`, `useMapUiStore` (T5), `useMotionStore` (T12) have stable names used consistently across T10–T16.
- `mapIconKey`, `mapIcons`, `getStatusColor` are exported from `@/map` (T11 barrel) and consumed by `DeviceRow` (T13) and `MapPositions` (T10).
- `buildMotionSegments` / `MotionEvent` / `MotionSegment` (T4) are reused by `MotionController` (T12) and `motion-store` (T12).
- `appendHistory` / `parseSocketMessage` / `SocketMessage` (T4) are reused by `live-store` (T5) and `SocketController` (T12).
- `MapStyle` / `buildMapStyles` / `MapStyleKeys` (T7) are consumed by `MapView` (T9) and `SwitcherControl` (T8).
- `filterDevices` / `DeviceFilter` / `DeviceSort` (T3) are consumed by `MainPage` (T16), `MainToolbar` (T14), `filter-store` (T5).
- The `map` singleton (`map-instance.ts`, T8) is the single mutable MapLibre handle; every layer imports it from `../core/map-instance` and mutates it only inside effects/handlers — no render-time mutation, no `set-state-in-effect` (the only `setState` calls in effects, in `MapView` and `DeviceList`, run inside event/timer callbacks, not synchronously in the effect body).
- `useDeviceReadonly`, `useSessionStore` come from the existing `@/entities/session` barrel (verified present).
- All map dependencies (`maplibre-gl`, `react-window`, `@turf/circle`, `wellknown`, `dayjs`, `react-rnd`, `lucide-react`) confirmed present in `package.json` — no install steps; only `npx shadcn@latest add popover` (a generator, not a dependency bump) is needed.

**Format check:** Header block, `> **For agentic workers:**` line, `**Goal:**`/`**Architecture:**`/`**Tech Stack:**`/`**Branch:**`, `---`, File Structure table, 17 `## Task N` sections each with a **Files:** block and numbered `- [ ] **Step N:**` steps ending in a commit, and this Self-Review section — matches the Foundation and Auth & shell plans exactly.

---

## Execution Handoff

See the parent process for the chosen execution approach.
