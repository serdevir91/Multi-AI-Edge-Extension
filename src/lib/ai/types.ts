export interface Model {
    id: string;
    name: string;
}

export interface Attachment {
    type: 'image' | 'text';
    content: string; // Base64 data URL for images, text content for files
    name: string;
    mimeType?: string;
}

export interface AIService {
    getModels(): Promise<Model[]>;
    sendMessage(message: string, modelId: string, systemPrompt?: string, attachment?: Attachment): Promise<string>;
    streamMessage?(message: string, modelId: string, onChunk: (chunk: string) => void): Promise<void>;
}

export type AIProvider = string;

export const BUILTIN_PROVIDERS = ['gemini', 'openai', 'claude'] as const;
export type BuiltinProvider = typeof BUILTIN_PROVIDERS[number];

export interface CustomProviderConfig {
    id: string;
    name: string;
    baseUrl: string;
    apiKeyStorageKey: string;
    models: Model[];
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    provider?: AIProvider;
    modelId?: string;
    isError?: boolean;
    attachmentPreview?: string; // Small preview URL for images
    attachmentName?: string;
}

export interface Conversation {
    id: string;
    title: string;
    messages: ChatMessage[];
    provider: string;
    modelId: string;
    createdAt: number;
    updatedAt: number;
}
