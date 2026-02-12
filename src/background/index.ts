console.log('Multi-AI Edge Background Script Loaded - v3 HostPerms');

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error: unknown) => console.error(error));

chrome.runtime.onMessage.addListener((request: any, _sender: any, sendResponse: any) => {
    if (request.type === 'CAPTURE_TAB') {
        console.log('[BG] CAPTURE_TAB received');

        (async () => {
            let tabId: number | undefined;
            try {
                // 1. Get the active tab
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                console.log('[BG] Active tab info:', tab);

                if (!tab?.id) {
                    sendResponse({ success: false, error: 'Aktif sekme bulunamadı' });
                    return;
                }

                // Check for restricted URLs or undefined URL (restricted)
                if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') ||
                    tab.url.startsWith('chrome-extension://') || tab.url.startsWith('extension://') ||
                    tab.url.startsWith('about:') || tab.url.startsWith('file://')) {

                    console.warn('[BG] Restricted URL detected:', tab.url);
                    sendResponse({
                        success: false,
                        error: 'Bu sayfada (Yeni Sekme, Ayarlar vb.) screenshot alınamaz. Lütfen normal bir web sitesine (örn. Google) gidiniz.'
                    });
                    return;
                }

                tabId = tab.id;

                // 2. Attach debugger
                // NOTE: This requires host_permissions for the specific URL
                console.log('[BG] Attaching debugger to tab', tabId);
                await chrome.debugger.attach({ tabId }, '1.3');
                console.log('[BG] Debugger attached successfully');

                // 3. Capture screenshot via CDP
                const result: any = await chrome.debugger.sendCommand(
                    { tabId },
                    'Page.captureScreenshot',
                    { format: 'png', quality: 100, fromSurface: true }
                );

                // 4. Detach debugger
                await chrome.debugger.detach({ tabId });
                console.log('[BG] Debugger detached');

                if (result?.data) {
                    const dataUrl = 'data:image/png;base64,' + result.data;
                    sendResponse({ success: true, dataUrl });
                } else {
                    sendResponse({ success: false, error: 'CDP returned empty data' });
                }
            } catch (err: unknown) {
                // Detach on error
                if (tabId) {
                    try { await chrome.debugger.detach({ tabId }); } catch { /* ignore */ }
                }
                const message = err instanceof Error ? err.message : String(err);
                console.error('[BG] Screenshot Error:', message);

                // User-friendly error mapping
                if (message.includes('permission') || message.includes('Cannot attach')) {
                    sendResponse({
                        success: false,
                        error: 'İzin hatası: Lütfen uzantı ayarlarından "Site erişimi"ni "Tüm siteler" olarak ayarlayın veya gerçek bir web sitesinde deneyin.'
                    });
                } else {
                    sendResponse({ success: false, error: message });
                }
            }
        })();

        return true; // Keep channel open
    }
    return false;
});
