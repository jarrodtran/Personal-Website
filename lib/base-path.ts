export function normalizeBasePath(value: string | undefined | null): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") return "";
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
}

export function withBasePath(
  path: string,
  base: string | undefined = process.env.NEXT_PUBLIC_BASE_PATH ??
    process.env.BASE_PATH,
): string {
  const prefix = normalizeBasePath(base);
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  if (!prefix) return path;
  if (path === prefix || path.startsWith(`${prefix}/`)) return path;
  return `${prefix}${path}`;
}
