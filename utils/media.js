function trimTrailingSlash(value) {
  return value ? value.trim().replace(/\/+$/, '') : '';
}

export function getPublicMediaBaseUrl() {
  return trimTrailingSlash(process.env.CLOUDFLARE_PUBLIC_URL);
}

export function getObjectKey(value) {
  if (!value || typeof value !== 'string') return '';

  const trimmed = value.trim();
  const publicBaseUrl = getPublicMediaBaseUrl();

  if (publicBaseUrl && trimmed.startsWith(`${publicBaseUrl}/`)) {
    return decodeURIComponent(trimmed.slice(publicBaseUrl.length + 1));
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/^\/+/, '');
  }

  try {
    const url = new URL(trimmed);
    const pathParts = url.pathname.split('/').filter(Boolean);

    if (url.hostname.endsWith('.r2.cloudflarestorage.com')) {
      const bucket = process.env.CLOUDFLARE_R2_BUCKET?.trim();
      if (bucket && pathParts[0] === bucket) {
        return pathParts.slice(1).map(decodeURIComponent).join('/');
      }
    }

    if (url.hostname.endsWith('.r2.dev')) {
      return pathParts.map(decodeURIComponent).join('/');
    }
  } catch {
    return '';
  }

  return '';
}

export function getPublicMediaUrl(value) {
  if (!value || typeof value !== 'string') return value;

  const trimmed = value.trim();
  const objectKey = getObjectKey(trimmed);
  const publicBaseUrl = getPublicMediaBaseUrl();

  if (objectKey && publicBaseUrl) {
    return `${publicBaseUrl}/${objectKey}`;
  }

  return trimmed;
}
