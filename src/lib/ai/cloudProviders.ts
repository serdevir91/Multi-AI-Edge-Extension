import type { AIService, Model, Attachment } from './types';

// Perplexity uses OpenAI-compatible API with different base URL and model list
export class PerplexityAdapter implements AIService {
    constructor(private apiKey: string) { }

    async getModels(): Promise<Model[]> {
        return [
            { id: 'sonar-pro', name: 'Sonar Pro' },
            { id: 'sonar', name: 'Sonar' },
            { id: 'sonar-reasoning-pro', name: 'Sonar Reasoning Pro' },
            { id: 'sonar-reasoning', name: 'Sonar Reasoning' },
        ];
    }

    async sendMessage(message: string, modelId: string, systemPrompt?: string, attachment?: Attachment): Promise<string> {
        if (!this.apiKey) throw new Error("Perplexity API Key is missing");

        const url = "https://api.perplexity.ai/chat/completions";

        let userContent: any;
        if (attachment?.type === 'image' && attachment.content) {
            userContent = [
                { type: "image_url", image_url: { url: attachment.content } },
                { type: "text", text: message || "What do you see in this image?" }
            ];
        } else if (attachment?.type === 'text' && attachment.content) {
            userContent = `${message}\n\n[Attached File: ${attachment.name}]\n${attachment.content}`;
        } else {
            userContent = message;
        }

        const payload = {
            model: modelId,
            messages: [
                { role: "system", content: systemPrompt || "You are a helpful assistant." },
                { role: "user", content: userContent }
            ]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error((err as any).error?.message || "Perplexity API Error");
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "No response";
    }
}

// Groq uses OpenAI-compatible API
export class GroqAdapter implements AIService {
    constructor(private apiKey: string) { }

    async getModels(): Promise<Model[]> {
        if (!this.apiKey) return [];
        try {
            const response = await fetch("https://api.groq.com/openai/v1/models", {
                headers: { 'Authorization': `Bearer ${this.apiKey}` }
            });
            if (!response.ok) return [];
            const data = await response.json();
            return (data.data || []).map((m: any) => ({ id: m.id, name: m.id }))
                .sort((a: any, b: any) => a.name.localeCompare(b.name));
        } catch {
            return [
                { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
                { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B' },
                { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
                { id: 'gemma2-9b-it', name: 'Gemma 2 9B' },
            ];
        }
    }

    async sendMessage(message: string, modelId: string, systemPrompt?: string, attachment?: Attachment): Promise<string> {
        if (!this.apiKey) throw new Error("Groq API Key is missing");

        const url = "https://api.groq.com/openai/v1/chat/completions";

        let userContent: any;
        if (attachment?.type === 'image' && attachment.content) {
            userContent = [
                { type: "image_url", image_url: { url: attachment.content } },
                { type: "text", text: message || "What do you see in this image?" }
            ];
        } else if (attachment?.type === 'text' && attachment.content) {
            userContent = `${message}\n\n[Attached File: ${attachment.name}]\n${attachment.content}`;
        } else {
            userContent = message;
        }

        const payload = {
            model: modelId,
            messages: [
                { role: "system", content: systemPrompt || "You are a helpful assistant." },
                { role: "user", content: userContent }
            ]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error((err as any).error?.message || "Groq API Error");
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "No response";
    }
}

// DeepSeek uses OpenAI-compatible API
export class DeepSeekAdapter implements AIService {
    constructor(private apiKey: string) { }

    async getModels(): Promise<Model[]> {
        return [
            { id: 'deepseek-chat', name: 'DeepSeek V3' },
            { id: 'deepseek-reasoner', name: 'DeepSeek R1' },
        ];
    }

    async sendMessage(message: string, modelId: string, systemPrompt?: string, attachment?: Attachment): Promise<string> {
        if (!this.apiKey) throw new Error("DeepSeek API Key is missing");

        const url = "https://api.deepseek.com/chat/completions";

        let userContent: any;
        if (attachment?.type === 'text' && attachment.content) {
            userContent = `${message}\n\n[Attached File: ${attachment.name}]\n${attachment.content}`;
        } else {
            userContent = message;
        }

        const payload = {
            model: modelId,
            messages: [
                { role: "system", content: systemPrompt || "You are a helpful assistant." },
                { role: "user", content: userContent }
            ]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error((err as any).error?.message || "DeepSeek API Error");
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "No response";
    }
}

// Mistral uses its own API format
export class MistralAdapter implements AIService {
    constructor(private apiKey: string) { }

    async getModels(): Promise<Model[]> {
        return [
            { id: 'mistral-large-latest', name: 'Mistral Large' },
            { id: 'mistral-medium-latest', name: 'Mistral Medium' },
            { id: 'mistral-small-latest', name: 'Mistral Small' },
            { id: 'codestral-latest', name: 'Codestral' },
        ];
    }

    async sendMessage(message: string, modelId: string, systemPrompt?: string, attachment?: Attachment): Promise<string> {
        if (!this.apiKey) throw new Error("Mistral API Key is missing");

        const url = "https://api.mistral.ai/v1/chat/completions";

        let userContent: any;
        if (attachment?.type === 'image' && attachment.content) {
            userContent = [
                { type: "image_url", image_url: { url: attachment.content } },
                { type: "text", text: message || "What do you see in this image?" }
            ];
        } else if (attachment?.type === 'text' && attachment.content) {
            userContent = `${message}\n\n[Attached File: ${attachment.name}]\n${attachment.content}`;
        } else {
            userContent = message;
        }

        const payload = {
            model: modelId,
            messages: [
                { role: "system", content: systemPrompt || "You are a helpful assistant." },
                { role: "user", content: userContent }
            ]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error((err as any).error?.message || "Mistral API Error");
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "No response";
    }
}
