import { JSDOM } from 'jsdom';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const url = searchParams.get('url');

        // Ensure URL has a protocol prefix
        const formattedUrl = url.startsWith('http://') || url.startsWith('https://')
            ? url
            : `https://${url}`;

        // Fetch the URL
        const response = await fetch(formattedUrl);

        const html = await response.text();

        // Parse HTML using JSDOM
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        // Extract metadata
        const meta = {
            title: doc.querySelector('title')?.textContent || '',
            description: doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
                doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '',
            image: {
                url: doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || ''
            }
        };

        return Response.json({
            success: 1,
            link: url,
            meta
        });
    } catch (error) {
        console.error('Error fetching URL:', error);
        return Response.json({
            success: 0,
            error: error.message || "Could not fetch URL metadata"
        });
    }
}