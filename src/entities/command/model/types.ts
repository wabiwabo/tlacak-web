import type { components } from '@/shared/api/schema';

type SchemaCommand = components['schemas']['Command'];

export type CommandAttributes = Record<string, unknown>;

/** A saved or ad-hoc device command. */
export interface Command extends Omit<SchemaCommand, 'attributes'> {
  attributes: CommandAttributes;
}

/** A command type descriptor from GET /api/commands/types. */
export interface CommandType {
  type: string;
}
