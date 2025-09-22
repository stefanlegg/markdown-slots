/**
 * Version utilities for the markdown-slots package
 * Provides version reading from deno.json and update checking from JSR
 */

/**
 * Interface for JSR meta.json response
 */
interface JsrMetaResponse {
  latest: string;
  versions: Record<string, unknown>;
}

/**
 * Cache for version check results to avoid excessive API calls
 */
interface VersionCheckCache {
  latestVersion: string;
  timestamp: number;
}

let versionCache: VersionCheckCache | null = null;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

// Flag to disable network requests (useful for testing)
let networkRequestsDisabled = false;

/**
 * Disable network requests (useful for testing)
 */
export function disableNetworkRequests(): void {
  networkRequestsDisabled = true;
}

/**
 * Enable network requests
 */
export function enableNetworkRequests(): void {
  networkRequestsDisabled = false;
}

/**
 * Get the version from deno.json
 * @returns Version string or 'unknown' if not found
 */
export function getVersion(): string {
  try {
    // Read deno.json from the project root
    // Since src/version.ts is one level deep, go up one level to reach project root
    const denoJsonPath = new URL('../deno.json', import.meta.url);
    const denoJsonText = Deno.readTextFileSync(denoJsonPath);
    const denoJson = JSON.parse(denoJsonText);
    return denoJson.version || 'unknown';
  } catch {
    // Try alternative path resolution in case import.meta.url behaves differently
    try {
      const denoJsonText = Deno.readTextFileSync('./deno.json');
      const denoJson = JSON.parse(denoJsonText);
      return denoJson.version || 'unknown';
    } catch {
      // Fallback if we can't read the version
      return 'unknown';
    }
  }
}

/**
 * Fetch the latest version from JSR registry
 * @returns Promise resolving to latest version string or null if failed
 */
export async function getLatestVersion(): Promise<string | null> {
  // Check cache first
  if (versionCache && Date.now() - versionCache.timestamp < CACHE_DURATION) {
    return versionCache.latestVersion;
  }

  // Skip network requests if disabled (for testing)
  if (networkRequestsDisabled) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    const response = await fetch(
      'https://jsr.io/@stefanlegg/markdown-slots/meta.json',
      {
        signal: controller.signal,
        headers: {
          'User-Agent': 'markdown-slots-cli',
        },
      },
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data: JsrMetaResponse = await response.json();
    const latestVersion = data.latest;

    // Update cache
    versionCache = {
      latestVersion,
      timestamp: Date.now(),
    };

    return latestVersion;
  } catch {
    // Network error, timeout, or other failure - fail silently
    return null;
  }
}

/**
 * Compare two semantic version strings
 * @param current Current version (e.g., "0.1.6")
 * @param latest Latest version (e.g., "0.1.7")
 * @returns True if current version is less than latest version
 */
export function isOutdated(current: string, latest: string): boolean {
  // Remove 'v' prefix if present
  const cleanCurrent = current.replace(/^v/, '');
  const cleanLatest = latest.replace(/^v/, '');

  // Split into parts and convert to numbers
  const currentParts = cleanCurrent.split('.').map(Number);
  const latestParts = cleanLatest.split('.').map(Number);

  // Ensure both arrays have the same length
  const maxLength = Math.max(currentParts.length, latestParts.length);
  while (currentParts.length < maxLength) currentParts.push(0);
  while (latestParts.length < maxLength) latestParts.push(0);

  // Compare each part
  for (let i = 0; i < maxLength; i++) {
    if (currentParts[i] < latestParts[i]) {
      return true;
    }
    if (currentParts[i] > latestParts[i]) {
      return false;
    }
  }

  return false; // Versions are equal
}

/**
 * Check if an update is available and return update information
 * @param currentVersion Current version string
 * @returns Object with update information or null if no update needed/available
 */
export async function checkForUpdate(
  currentVersion: string,
): Promise<{ latestVersion: string; updateCommand: string } | null> {
  const latestVersion = await getLatestVersion();

  if (!latestVersion) {
    return null; // Failed to fetch latest version
  }

  if (isOutdated(currentVersion, latestVersion)) {
    return {
      latestVersion,
      updateCommand: `deno install -grf jsr:@stefanlegg/markdown-slots@${latestVersion}/cli`,
    };
  }

  return null; // No update needed
}
