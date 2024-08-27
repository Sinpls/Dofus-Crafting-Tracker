// src/utils/formatters.ts

export function formatNumber(value: number): string {
    return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }