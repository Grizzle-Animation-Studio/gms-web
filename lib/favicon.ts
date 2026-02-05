/**
 * Utility functions for handling company logos/favicons
 */

/**
 * Get the favicon URL for a given website domain
 * Uses Google's favicon service as a reliable fallback
 * @param website - The website URL or domain (e.g., "www.example.com" or "https://example.com")
 * @returns The favicon URL
 */
export function getFaviconUrl(website: string): string {
    // Clean up the website URL to get just the domain
    let domain = website
        .replace(/^https?:\/\//, '')    // Remove protocol
        .replace(/^www\./, '')          // Remove www.
        .replace(/\/.*$/, '');          // Remove path

    // Use Google's favicon service for reliable favicon retrieval
    // This service caches favicons and handles all the edge cases
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}
