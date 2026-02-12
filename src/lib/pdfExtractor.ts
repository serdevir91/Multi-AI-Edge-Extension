import * as pdfjsLib from 'pdfjs-dist';

// Use the worker file from the extension's public/ directory
// This avoids CSP issues with CDN URLs in Chrome extensions
if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.min.mjs');
}

export async function extractTextFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const textParts: string[] = [];
    const totalPages = Math.min(pdf.numPages, 50);

    for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
        textParts.push(`--- Page ${i} ---\n${pageText}`);
    }

    if (pdf.numPages > 50) {
        textParts.push(`\n... (Showing first 50 of ${pdf.numPages} pages)`);
    }

    return textParts.join('\n\n');
}
