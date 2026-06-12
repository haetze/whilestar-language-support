const PUBLIC_WIZ_BASE_URL = 'https://wiz.cs.tu-dortmund.de';
const PUBLIC_WIZ_URL = new URL(PUBLIC_WIZ_BASE_URL);
const LOCAL_HOST_NAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]']);

function isProgramUrl(url: URL): boolean {
    return url.pathname.includes('/program/');
}

function hasUrlScheme(value: string): boolean {
    return /^[a-z][a-z\d+\-.]*:/iu.test(value);
}

function hasExplicitOrigin(value: string): boolean {
    return hasUrlScheme(value) || value.startsWith('//');
}

function usesLocalOrigin(url: URL): boolean {
    return LOCAL_HOST_NAMES.has(url.hostname.toLowerCase());
}

function usesPublicOrigin(url: URL): boolean {
    return url.hostname.toLowerCase() === PUBLIC_WIZ_URL.hostname.toLowerCase();
}

function withPublicOrigin(url: URL): string {
    const publicUrl = new URL(PUBLIC_WIZ_BASE_URL);
    publicUrl.pathname = url.pathname;
    publicUrl.search = url.search;
    publicUrl.hash = url.hash;
    return publicUrl.toString();
}

export function normalizeStoredProgramUrl(rawUrl: string): string {
    const trimmedUrl = rawUrl.trim();
    if (!trimmedUrl) {
        return trimmedUrl;
    }

    try {
        const url = new URL(trimmedUrl, PUBLIC_WIZ_BASE_URL);
        if (!isProgramUrl(url)) {
            return trimmedUrl;
        }

        if (!hasExplicitOrigin(trimmedUrl) || usesLocalOrigin(url) || usesPublicOrigin(url)) {
            return withPublicOrigin(url);
        }
    } catch {
        return trimmedUrl;
    }

    return trimmedUrl;
}
