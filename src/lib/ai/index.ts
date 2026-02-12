import { GeminiAdapter } from './gemini';
import { OpenAIAdapter } from './openai';
import { ClaudeAdapter } from './claude';
import { CustomProviderAdapter } from './customProvider';
import { PerplexityAdapter, GroqAdapter, DeepSeekAdapter, MistralAdapter } from './cloudProviders';
import type { AIService, CustomProviderConfig } from './types';

export async function createAIService(provider: string, apiKey: string): Promise<AIService> {
    switch (provider) {
        case 'gemini':
            return new GeminiAdapter(apiKey);
        case 'openai':
            return new OpenAIAdapter(apiKey);
        case 'claude':
            return new ClaudeAdapter(apiKey);
        case 'perplexity':
            return new PerplexityAdapter(apiKey);
        case 'groq':
            return new GroqAdapter(apiKey);
        case 'deepseek':
            return new DeepSeekAdapter(apiKey);
        case 'mistral':
            return new MistralAdapter(apiKey);
        default: {
            // Try to find custom provider config
            const result = await chrome.storage.local.get('customProviders');
            const customProviders = (result.customProviders as CustomProviderConfig[] | undefined) || [];
            const config = customProviders.find(p => p.id === provider);

            if (config) {
                return new CustomProviderAdapter(apiKey, config.baseUrl, config.models);
            }

            throw new Error(`Provider "${provider}" not found`);
        }
    }
}

export * from './types';
export * from './gemini';
export * from './openai';
export * from './claude';
export * from './cloudProviders';
export * from './customProvider';
