export function impressumPageEnabled(legalPage: string | null): boolean {
  return Boolean(legalPage?.trim());
}
