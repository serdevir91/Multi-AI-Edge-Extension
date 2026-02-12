import type { AIService, Model, Attachment } from './types';

export class CustomProviderAdapter implements AIService {
    constructor(
        private apiKey: string,
        private baseUrl: string,
        private staticModels?: Model[]
    ) { }

    async getModels(): Promise<Model[]> {
        if (this.staticModels && this.staticModels.length > 0) {
            return this.staticModels;
        }

        if (!this.apiKey) return [];

        try {
            const url = `${this.baseUrl}/models`;
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${this.apiKey}` }
            });

            if (!response.ok) return [];

            const data = await response.json();
            return (data.data || []).map((m: any) => ({
                id: m.id,
                name: m.id
            }));
        } catch {
            return this.staticModels || [];
        }
    }

    async sendMessage(message: string, modelId: string, systemPrompt?: string, attachment?: Attachment): Promise<string> {
        if (!this.apiKey) throw new Error("API Key is missing");

        const url = `${this.baseUrl}/chat/completions`;

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
            throw new Error((err as any).error?.message || "Custom Provider API Error");
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "No response";
    }
}
