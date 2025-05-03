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

        // Extract main content
        const mainContent = [];
        
        // Try to find the main content container
        const mainElement = doc.querySelector('main') || 
                          doc.querySelector('article') || 
                          doc.querySelector('#content') || 
                          doc.querySelector('.content');

        const contentElement = mainElement || doc.body;

        // Function to process a node and its children recursively
        const processNode = async (node) => {
            // Skip script and style elements
            if (node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE') {
                return;
            }

            // Process current node if it's a heading, paragraph, or image
            if (node.nodeName.match(/^H[1-6]$/) || node.nodeName === 'P') {
                const text = node.textContent.trim();
                if (text) {
                    mainContent.push({
                        type: node.nodeName.toLowerCase(),
                        text
                    });
                }
            } else if (node.nodeName === 'IMG') {
                const src = node.getAttribute('src');
                if (src && !src.startsWith('data:')) {
                    try {
                        const absoluteSrc = src.startsWith('http') ? src : new URL(src, formattedUrl).href;
                        // Test if image is accessible
                        const imgResponse = await fetch(absoluteSrc, { method: 'HEAD' }).catch(() => null);
                        if (imgResponse?.ok) {
                            mainContent.push({
                                type: 'image',
                                src: absoluteSrc,
                                alt: node.getAttribute('alt') || ''
                            });
                        }
                    } catch (e) {
                        console.error('Failed to process image:', e);
                    }
                }
            }

            // Process child nodes to maintain order
            for (const child of node.childNodes) {
                if (child.nodeType === 1) { // Element node
                    await processNode(child);
                }
            }
        };

        // Function to process all the links 
        const processLinks = async (node) => {
            if (node.nodeName === 'A') {
                const href = node.getAttribute('href');
                if (href && !href.startsWith('http') && !href.startsWith('mailto:')) {
                    // Convert relative URL to absolute URL
                    try {
                        const absoluteHref = new URL(href, formattedUrl).href;
                        node.setAttribute('href', absoluteHref);
                        mainContent.push({
                            type: 'link',
                            text: node.textContent.trim(),
                            href: absoluteHref,
                            image: node.querySelector('img') ? node.querySelector('img').getAttribute('src') : null
                        });
                    } catch (e) {
                        console.error('Failed to process link:', e);
                    }
                }
            }

            for (const child of node.childNodes) {
                if (child.nodeType === 1) { // Element node
                    await processLinks(child);
                }
            }
        };

        // Function to process all the mails
        const processMails = async (node) => {
            if (node.nodeName === 'A' && node.getAttribute('href')?.startsWith('mailto:')) {
                const mailto = node.getAttribute('href').replace('mailto:', '');
                node.setAttribute('href', `mailto:${mailto}`);
                mainContent.push({
                    type: 'email',
                    text: node.textContent.trim(),
                    href: `mailto:${mailto}`
                });
            }

            for (const child of node.childNodes) {
                if (child.nodeType === 1) { // Element node
                    await processMails(child);
                }
            }
        };

        // Process the content
        await processNode(contentElement);
        await processLinks(contentElement);
        await processMails(contentElement);

        return Response.json({
            success: 1,
            link: formattedUrl,
            meta,
            content: mainContent
        });
    } catch (error) {
        console.error('Error fetching URL:', error);
        return Response.json({
            success: 0,
            error: error.message || "Could not fetch URL metadata"
        });
    }
}