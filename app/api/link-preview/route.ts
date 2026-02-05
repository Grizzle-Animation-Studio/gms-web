import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to fetch Open Graph metadata from a URL
 * This is a server-side proxy to avoid CORS issues
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    try {
        // Validate URL
        const targetUrl = new URL(url);

        // Fetch the page
        const response = await fetch(targetUrl.toString(), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; LinkPreviewBot/1.0)',
            },
            signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status}`);
        }

        const html = await response.text();

        // Extract Open Graph and meta tags
        const metadata = extractMetadata(html, targetUrl.toString());

        return NextResponse.json(metadata);
    } catch (error) {
        console.error('Error fetching link preview:', error);
        return NextResponse.json(
            { error: 'Failed to fetch link preview' },
            { status: 500 }
        );
    }
}

function extractMetadata(html: string, url: string) {
    const urlObj = new URL(url);

    // Extract Open Graph tags
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i)?.[1];
    const ogDescription = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i)?.[1];
    const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i)?.[1];
    const ogSiteName = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']*)["']/i)?.[1];

    // Fallback to standard meta tags
    const metaTitle = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1];
    const metaDescription = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1];

    // Get favicon
    let favicon = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']*)["']/i)?.[1];
    if (favicon && !favicon.startsWith('http')) {
        // Make favicon URL absolute
        favicon = new URL(favicon, url).toString();
    }
    if (!favicon) {
        // Default to /favicon.ico
        favicon = `${urlObj.protocol}//${urlObj.host}/favicon.ico`;
    }

    // Make image URL absolute if relative
    let imageUrl = ogImage;
    if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = new URL(imageUrl, url).toString();
    }

    return {
        title: ogTitle || metaTitle || urlObj.hostname,
        description: ogDescription || metaDescription || '',
        image: imageUrl || null,
        favicon: favicon,
        siteName: ogSiteName || urlObj.hostname,
        url: url,
    };
}
