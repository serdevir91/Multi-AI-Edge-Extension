import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

interface OverlayProps {
    onCapture: (rect: { x: number, y: number, width: number, height: number }) => void;
    onClose: () => void;
}

const ScreenshotOverlay: React.FC<OverlayProps> = ({ onCapture, onClose }) => {
    const [startPos, setStartPos] = useState<{ x: number, y: number } | null>(null);
    const [currentPos, setCurrentPos] = useState<{ x: number, y: number } | null>(null);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <div
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 999999, cursor: 'crosshair', background: 'rgba(0,0,0,0.3)'
            }}
            onMouseDown={(e) => {
                setStartPos({ x: e.clientX, y: e.clientY });
                setCurrentPos({ x: e.clientX, y: e.clientY });
            }}
            onMouseMove={(e) => {
                if (startPos) {
                    setCurrentPos({ x: e.clientX, y: e.clientY });
                }
            }}
            onMouseUp={() => {
                if (startPos && currentPos) {
                    const rect = {
                        x: Math.min(startPos.x, currentPos.x),
                        y: Math.min(startPos.y, currentPos.y),
                        width: Math.abs(currentPos.x - startPos.x),
                        height: Math.abs(currentPos.y - startPos.y)
                    };
                    if (rect.width > 10 && rect.height > 10) {
                        onCapture(rect);
                    } else {
                        onClose();
                    }
                    setStartPos(null);
                }
            }}
        >
            {/* Selection Box */}
            {startPos && currentPos && (
                <div style={{
                    position: 'absolute',
                    left: Math.min(startPos.x, currentPos.x),
                    top: Math.min(startPos.y, currentPos.y),
                    width: Math.abs(currentPos.x - startPos.x),
                    height: Math.abs(currentPos.y - startPos.y),
                    border: '2px solid #3b82f6',
                    background: 'rgba(59, 130, 246, 0.15)',
                    borderRadius: 4,
                }} />
            )}
            <div style={{
                position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.75)', color: 'white', padding: '6px 16px',
                borderRadius: 8, fontSize: 13, fontFamily: 'system-ui',
                backdropFilter: 'blur(4px)',
            }}>
                Drag to select area · ESC to cancel
            </div>
        </div>
    );
};

export function mountOverlay() {
    const id = 'multi-ai-edge-overlay-host';
    let host = document.getElementById(id);

    if (host) {
        host.remove();
    }

    host = document.createElement('div');
    host.id = id;
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });
    const root = createRoot(shadow);

    const handleCapture = (rect: { x: number, y: number, width: number, height: number }) => {
        const payload = {
            x: rect.x * window.devicePixelRatio,
            y: rect.y * window.devicePixelRatio,
            width: rect.width * window.devicePixelRatio,
            height: rect.height * window.devicePixelRatio
        };

        chrome.runtime.sendMessage({ type: 'SCREENSHOT_CAPTURED', payload });
        root.unmount();
        host?.remove();
    };

    const handleClose = () => {
        root.unmount();
        host?.remove();
    };

    root.render(<ScreenshotOverlay onCapture={handleCapture} onClose={handleClose} />);
}
