import type { AIService, Model, Attachment } from './types';

export class ClaudeAdapter implements AIService {
    constructor(private apiKey: string) { }

    async getModels(): Promise<Model[]> {
        return [
            { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
            { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
            { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
            { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
        ];
    }

    async sendMessage(message: string, modelId: string, systemPrompt?: string, attachment?: Attachment): Promise<string> {
        if (!this.apiKey) throw new Error("Claude API Key is missing");

        const url = "https://api.anthropic.com/v1/messages";

        // Build user content
        let userContent: any;

        if (attachment?.type === 'image' && attachment.content) {
            const base64Match = attachment.content.match(/^data:(.+?);base64,(.+)$/);
            if (base64Match) {
                userContent = [
                    {
                        type: "image",
                        source: {
                            type: "base64",
                            media_type: base64Match[1],
                            data: base64Match[2]
                        }
                    },
                    { type: "text", text: message || "What do you see in this image?" }
                ];
            } else {
                userContent = message;
            }
        } else if (attachment?.type === 'text' && attachment.content) {
            userContent = `${message}\n\n[Attached File: ${attachment.name}]\n${attachment.content}`;
        } else {
            userContent = message;
        }

        const payload = {
            model: modelId,
            max_tokens: 4096,
            system: systemPrompt,
            messages: [
                { role: "user", content: userContent }
            ]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "Claude API Error");
        }

        const data = await response.json();
        return data.content?.[0]?.text || "No response";
    }
}
