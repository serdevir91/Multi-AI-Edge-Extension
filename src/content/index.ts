import { mountOverlay } from './ScreenshotOverlay';

console.log('Multi-AI Edge Content Script Loaded');

chrome.runtime.onMessage.addListener((request: any, _sender: any, sendResponse: any) => {
    if (request.action === 'MOUNT_OVERLAY') {
        mountOverlay();
        sendResponse({ status: 'Overlay mounted' });
        return true;
    }
    // IMPORTANT: return false/undefined for messages we don't handle
    // so that the background script can respond instead
    return false;
});
