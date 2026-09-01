/** Minimal WebMCP types for Fog (see https://webmachinelearning.github.io/webmcp/) */

export type JsonSchema = Record<string, unknown>;

export interface ToolAnnotations {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
}

export interface ModelContextTool<TInput extends Record<string, unknown> = Record<string, unknown>> {
  name: string;
  title?: string;
  description: string;
  inputSchema?: JsonSchema;
  annotations?: ToolAnnotations;
  execute: (
    input: TInput,
    options: { signal: AbortSignal },
  ) => Promise<unknown> | unknown;
}

export interface ModelContextRegisterToolOptions {
  signal?: AbortSignal;
  exposedTo?: string[];
}

export interface ModelContext {
  registerTool(
    tool: ModelContextTool,
    options?: ModelContextRegisterToolOptions,
  ): Promise<void>;
  getTools?(options?: { fromOrigins?: string[] }): Promise<unknown[]>;
  executeTool?(
    tool: unknown,
    input?: Record<string, unknown>,
    options?: { signal?: AbortSignal },
  ): Promise<string | null>;
  ontoolchange?: ((event: Event) => void) | null;
}

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
}

export function getModelContext(): ModelContext | undefined {
  const legacy = (navigator as Navigator & { modelContext?: ModelContext }).modelContext;
  return document.modelContext ?? legacy;
}

export function isWebMcpSupported(): boolean {
  const ctx = getModelContext();
  return Boolean(ctx && "registerTool" in ctx);
}
