import type { Envelope, ErrorCode } from '@pokedex/contracts';

type ErrorEnvelope = Extract<Envelope<unknown>, { success: false }>;

export function successEnvelope<TData>(data: TData): Envelope<TData> {
  return { success: true, data };
}

export function errorEnvelope(code: ErrorCode, message: string): ErrorEnvelope {
  return { success: false, error: { code, message } };
}
