import type { AIService, Model, Attachment } from './types';

export class GeminiAdapter implements AIService {
    constructor(private apiKey: string) { }

    async getModels(): Promise<Model[]> {
        if (!this.apiKey) return [];

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`;
        const response = await fetch(url);
        if (!response.ok) return [];

        const data = await response.json();
        return (data.models || [])
            .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
            .map((m: any) => ({
                id: m.name.replace('models/', ''),
                name: m.displayName
            }));
    }

    async sendMessage(message: string, modelId: string, systemPrompt?: string, attachment?: Attachment): Promise<string> {
        if (!this.apiKey) throw new Error("Gemini API Key is missing");

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${this.apiKey}`;

        const parts: any[] = [];

        // Add image if present
        if (attachment?.type === 'image' && attachment.content) {
            const base64Match = attachment.content.match(/^data:(.+?);base64,(.+)$/);
            if (base64Match) {
                parts.push({
                    inline_data: {
                        mime_type: base64Match[1],
                        data: base64Match[2]
                    }
                });
            }
        }

        // Add text and file content
        const textContent = systemPrompt ? `${systemPrompt}\n\n${message}` : message;
        if (attachment?.type === 'text' && attachment.content) {
            parts.push({ text: `${textContent}\n\n[Attached File: ${attachment.name}]\n${attachment.content}` });
        } else {
            parts.push({ text: textContent });
        }

        const payload = {
            contents: [{ role: "user", parts }]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "Gemini API Error");
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    }
}
