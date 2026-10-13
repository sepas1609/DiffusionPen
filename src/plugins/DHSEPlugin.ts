import { DHSEEngine } from '../engine/DHSEEngine';

export interface CommandDefinition {
  id: string;
  title: string;
  handler: (...args: any[]) => Promise<any> | any;
}

export interface PluginContext {
  engine: DHSEEngine;
  registerCommand(cmd: CommandDefinition): void;
  showToast(message: string, type?: 'info' | 'success' | 'error'): void;
}

export interface DHSEPlugin {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  activate(context: PluginContext): Promise<void>;
  deactivate(): Promise<void>;
}

export abstract class BasePlugin implements DHSEPlugin {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly version: string;
  protected context: PluginContext | null = null;

  async activate(context: PluginContext): Promise<void> {
    this.context = context;
  }

  async deactivate(): Promise<void> {
    this.context = null;
  }
}
