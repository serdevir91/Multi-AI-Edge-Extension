import type { AIService, Model, Attachment } from './types';

export class OpenAIAdapter implements AIService {
    constructor(private apiKey: string, private baseUrl: string = "https://api.openai.com/v1") { }

    async getModels(): Promise<Model[]> {
        if (!this.apiKey) return [];

        const url = `${this.baseUrl}/models`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${this.apiKey}` }
        });

        if (!response.ok) return [];

        const data = await response.json();
        const chatModels = data.data.filter((m: any) => m.id.includes('gpt') || m.id.includes('o1') || m.id.includes('o3') || m.id.includes('o4'));

        return chatModels.map((m: any) => ({
            id: m.id,
            name: m.id
        })).sort((a: any, b: any) => b.id.localeCompare(a.id));
    }

    async sendMessage(message: string, modelId: string, systemPrompt?: string, attachment?: Attachment): Promise<string> {
        if (!this.apiKey) throw new Error("OpenAI API Key is missing");

        const url = `${this.baseUrl}/chat/completions`;

        // Build user content
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
            const err = await response.json();
            throw new Error(err.error?.message || "OpenAI API Error");
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "No response";
    }
}
