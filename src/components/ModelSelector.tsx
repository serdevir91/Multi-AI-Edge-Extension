import { useState, useEffect } from 'react';
import type { Model, CustomProviderConfig } from '../lib/ai/types';
import { cn } from '../lib/utils';

interface ProviderOption {
    id: string;
    name: string;
}

interface ModelSelectorProps {
    provider: string;
    onProviderChange: (provider: string) => void;
    modelId: string;
    onModelIdChange: (modelId: string) => void;
    availableModels: Model[];
    className?: string;
}

export function ModelSelector({
    provider,
    onProviderChange,
    modelId,
    onModelIdChange,
    availableModels,
    className
}: ModelSelectorProps) {
    const [providers, setProviders] = useState<ProviderOption[]>([
        { id: 'gemini', name: 'Google Gemini' },
        { id: 'openai', name: 'OpenAI' },
        { id: 'claude', name: 'Claude' },
    ]);

    useEffect(() => {
        chrome.storage.local.get('customProviders').then(result => {
            const customProviders = (result.customProviders as CustomProviderConfig[] | undefined) || [];
            const builtins: ProviderOption[] = [
                { id: 'gemini', name: 'Google Gemini' },
                { id: 'openai', name: 'OpenAI' },
                { id: 'claude', name: 'Claude' },
                { id: 'perplexity', name: 'Perplexity' },
                { id: 'groq', name: 'Groq' },
                { id: 'deepseek', name: 'DeepSeek' },
                { id: 'mistral', name: 'Mistral' },
            ];
            const customs: ProviderOption[] = customProviders.map(cp => ({
                id: cp.id,
                name: cp.name,
            }));
            setProviders([...builtins, ...customs]);
        });
    }, []);

    // Listen for storage changes (new provider added)
    useEffect(() => {
        const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
            if (changes.customProviders) {
                const customProviders = (changes.customProviders.newValue as CustomProviderConfig[] | undefined) || [];
                const builtins: ProviderOption[] = [
                    { id: 'gemini', name: 'Google Gemini' },
                    { id: 'openai', name: 'OpenAI' },
                    { id: 'claude', name: 'Claude' },
                    { id: 'perplexity', name: 'Perplexity' },
                    { id: 'groq', name: 'Groq' },
                    { id: 'deepseek', name: 'DeepSeek' },
                    { id: 'mistral', name: 'Mistral' },
                ];
                const customs: ProviderOption[] = customProviders.map(cp => ({
                    id: cp.id,
                    name: cp.name,
                }));
                setProviders([...builtins, ...customs]);
            }
        };

        chrome.storage.onChanged.addListener(listener);
        return () => chrome.storage.onChanged.removeListener(listener);
    }, []);

    return (
        <div className={cn("flex items-center gap-1.5", className)}>
            <select
                value={provider}
                onChange={(e) => onProviderChange(e.target.value)}
                className="h-7 rounded-md text-xs border border-gray-200 dark:border-[#3c4043] bg-white dark:bg-[#282a2c] text-gray-900 dark:text-gray-200 focus:ring-1 focus:ring-blue-500 outline-none px-2 py-1 cursor-pointer"
            >
                {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </select>

            <select
                value={modelId}
                onChange={(e) => onModelIdChange(e.target.value)}
                className="h-7 rounded-md text-xs border border-gray-200 dark:border-[#3c4043] bg-white dark:bg-[#282a2c] text-gray-900 dark:text-gray-200 focus:ring-1 focus:ring-blue-500 outline-none px-2 py-1 cursor-pointer max-w-[160px]"
                disabled={availableModels.length === 0}
            >
                {availableModels.length === 0 && <option value="">Loading...</option>}
                {availableModels.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                ))}
            </select>
        </div>
    );
}
