export function apiPath(path: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  return `${basePath}${path}`;
}
