/** A known-attribute descriptor: a friendly name + value type. */
export interface AttributeDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean';
}

export type AttributeDefinitions = Record<string, AttributeDefinition>;

/**
 * Known device/group attribute definitions. The accordion falls back to the
 * raw key for any attribute not listed here, so this map only needs the
 * common ones; extend it from `legacy/src/common/attributes/` as needed.
 */
export const deviceAttributeDefinitions: AttributeDefinitions = {
  'web.reportColor': { name: 'attributeWebReportColor', type: 'string' },
  devicePassword: { name: 'attributeDevicePassword', type: 'string' },
  'processing.copyAttributes': { name: 'attributeProcessingCopyAttributes', type: 'string' },
  speedLimit: { name: 'attributeSpeedLimit', type: 'number' },
};

export const userAttributeDefinitions: AttributeDefinitions = {
  'web.liveRouteLength': { name: 'attributeWebLiveRouteLength', type: 'number' },
  'web.selectZoom': { name: 'attributeWebSelectZoom', type: 'number' },
  'web.maxZoom': { name: 'attributeWebMaxZoom', type: 'number' },
};
