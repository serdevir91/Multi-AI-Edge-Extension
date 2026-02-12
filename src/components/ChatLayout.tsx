import React, { useState, useEffect } from 'react';
import { Settings, MessageSquare, Moon, Sun, ChevronLeft, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { APIKeyInput } from './Settings/APIKeyInput';
import { ChatHistory } from './ChatHistory';
import type { Conversation, CustomProviderConfig, Model } from '../lib/ai/types';
import { useTheme } from '../hooks/useTheme';

interface ChatLayoutProps {
    children: React.ReactNode;
    conversations: Conversation[];
    activeConversationId: string | null;
    onSelectConversation: (id: string) => void;
    onDeleteConversation: (id: string) => void;
    onNewChat: () => void;
}

export function ChatLayout({
    children,
    conversations,
    activeConversationId,
    onSelectConversation,
    onDeleteConversation,
    onNewChat,
}: ChatLayoutProps) {
    const [sidebarView, setSidebarView] = useState<'none' | 'history' | 'settings'>('none');
    const { theme, toggleTheme } = useTheme();
    const [customProviders, setCustomProviders] = useState<CustomProviderConfig[]>([]);
    const [newProvider, setNewProvider] = useState({ name: '', baseUrl: '', models: '' });

    useEffect(() => {
        chrome.storage.local.get('customProviders').then(result => {
            setCustomProviders((result.customProviders as CustomProviderConfig[] | undefined) || []);
        });
    }, []);

    const addCustomProvider = async () => {
        if (!newProvider.name || !newProvider.baseUrl) return;

        const id = `custom_${newProvider.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
        const models: Model[] = newProvider.models
            ? newProvider.models.split(',').map(m => m.trim()).filter(Boolean).map(m => ({ id: m, name: m }))
            : [];

        const config: CustomProviderConfig = {
            id,
            name: newProvider.name,
            baseUrl: newProvider.baseUrl.replace(/\/$/, ''),
            apiKeyStorageKey: `${id}_apiKey`,
            models,
        };

        const updated = [...customProviders, config];
        setCustomProviders(updated);
        await chrome.storage.local.set({ customProviders: updated });
        setNewProvider({ name: '', baseUrl: '', models: '' });
    };

    const removeCustomProvider = async (id: string) => {
        const updated = customProviders.filter(p => p.id !== id);
        setCustomProviders(updated);
        await chrome.storage.local.set({ customProviders: updated });
        await chrome.storage.local.remove(`${id}_apiKey`);
    };

    const toggleSidebar = (view: 'history' | 'settings') => {
        setSidebarView(sidebarView === view ? 'none' : view);
    };

    return (
        <div className="flex h-screen w-full flex-col bg-slate-50 dark:bg-[#131314] text-slate-900 dark:text-gray-100 transition-colors">
            <header className="flex h-12 items-center justify-between border-b bg-white dark:bg-[#1e1f20] dark:border-[#3c4043] px-3 shadow-sm shrink-0 transition-colors">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleSidebar('history')}
                        className="h-8 w-8 dark:text-gray-400 dark:hover:text-white"
                        title="Chat History"
                    >
                        <MessageSquare className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Multi-AI</span>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onNewChat}
                        className="h-8 w-8 dark:text-gray-400 dark:hover:text-white"
                        title="New Chat"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleSidebar('settings')}
                        className="h-8 w-8 dark:text-gray-400 dark:hover:text-white"
                        title="Settings"
                    >
                        <Settings className="h-4 w-4" />
                    </Button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Chat History Sidebar */}
                {sidebarView === 'history' && (
                    <aside className="absolute left-0 top-0 bottom-0 w-64 border-r bg-white dark:bg-[#1e1f20] dark:border-[#3c4043] p-3 z-20 shadow-xl overflow-y-auto transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold dark:text-white">Chat History</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSidebarView('none')}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        </div>
                        <ChatHistory
                            conversations={conversations}
                            activeConversationId={activeConversationId}
                            onSelect={(id) => { onSelectConversation(id); setSidebarView('none'); }}
                            onDelete={onDeleteConversation}
                            onNewChat={() => { onNewChat(); setSidebarView('none'); }}
                        />
                    </aside>
                )}

                {/* Settings Sidebar */}
                {sidebarView === 'settings' && (
                    <aside className="absolute right-0 top-0 bottom-0 w-72 border-l bg-white dark:bg-[#1e1f20] dark:border-[#3c4043] p-4 z-20 shadow-xl overflow-y-auto transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-semibold dark:text-white">Settings</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSidebarView('none')}>
                                <ChevronLeft className="h-4 w-4 rotate-180" />
                            </Button>
                        </div>

                        {/* Theme Toggle */}
                        <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-[#282a2c]">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Appearance</div>
                            <button
                                onClick={toggleTheme}
                                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3c4043] text-sm transition-colors"
                            >
                                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                            </button>
                        </div>

                        {/* API Keys */}
                        <div className="space-y-3 mb-4">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Built-in Providers</div>
                            <APIKeyInput service="gemini" label="Gemini API Key" />
                            <APIKeyInput service="openai" label="OpenAI API Key" />
                            <APIKeyInput service="claude" label="Claude API Key" />
                            <APIKeyInput service="perplexity" label="Perplexity API Key" />
                            <APIKeyInput service="groq" label="Groq API Key" />
                            <APIKeyInput service="deepseek" label="DeepSeek API Key" />
                            <APIKeyInput service="mistral" label="Mistral API Key" />
                        </div>

                        {/* Custom Providers */}
                        <div className="space-y-3 mb-4">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Custom Providers</div>

                            {customProviders.map(cp => (
                                <div key={cp.id} className="p-2 rounded-lg bg-gray-50 dark:bg-[#282a2c] text-xs space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium dark:text-gray-200">{cp.name}</span>
                                        <button
                                            onClick={() => removeCustomProvider(cp.id)}
                                            className="text-red-400 hover:text-red-500 text-[10px]"
                                        >Remove</button>
                                    </div>
                                    <div className="text-gray-400 truncate">{cp.baseUrl}</div>
                                    <APIKeyInput service={cp.id} label={`${cp.name} API Key`} />
                                </div>
                            ))}

                            <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#282a2c] space-y-2">
                                <div className="text-xs font-medium dark:text-gray-300">Add Custom Provider</div>
                                <input
                                    value={newProvider.name}
                                    onChange={e => setNewProvider(p => ({ ...p, name: e.target.value }))}
                                    placeholder="Provider Name"
                                    className="w-full px-2 py-1.5 text-xs rounded border bg-white dark:bg-[#1e1f20] dark:border-[#3c4043] dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <input
                                    value={newProvider.baseUrl}
                                    onChange={e => setNewProvider(p => ({ ...p, baseUrl: e.target.value }))}
                                    placeholder="Base URL (e.g. http://localhost:1234/v1)"
                                    className="w-full px-2 py-1.5 text-xs rounded border bg-white dark:bg-[#1e1f20] dark:border-[#3c4043] dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <input
                                    value={newProvider.models}
                                    onChange={e => setNewProvider(p => ({ ...p, models: e.target.value }))}
                                    placeholder="Model IDs (comma separated, optional)"
                                    className="w-full px-2 py-1.5 text-xs rounded border bg-white dark:bg-[#1e1f20] dark:border-[#3c4043] dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <button
                                    onClick={addCustomProvider}
                                    disabled={!newProvider.name || !newProvider.baseUrl}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Add Provider
                                </button>
                            </div>
                        </div>

                        <div className="p-2.5 bg-gray-50 dark:bg-[#282a2c] rounded-lg text-[10px] text-gray-500 dark:text-gray-500">
                            Keys are stored locally in your browser. Custom providers use OpenAI-compatible API format.
                        </div>
                    </aside>
                )}

                {/* Overlay */}
                {sidebarView !== 'none' && (
                    <div
                        className="absolute inset-0 bg-black/20 z-10"
                        onClick={() => setSidebarView('none')}
                    />
                )}

                <main className="flex-1 flex flex-col overflow-hidden relative w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
