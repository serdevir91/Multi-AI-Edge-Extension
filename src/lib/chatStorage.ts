import type { Conversation, ChatMessage } from './ai/types';

const CONVERSATIONS_KEY = 'conversations';
const ACTIVE_CONVERSATION_KEY = 'activeConversationId';

export async function listConversations(): Promise<Conversation[]> {
    const result = await chrome.storage.local.get(CONVERSATIONS_KEY);
    const convos = (result[CONVERSATIONS_KEY] as Conversation[] | undefined) || [];
    return convos.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function loadConversation(id: string): Promise<Conversation | null> {
    const convos = await listConversations();
    return convos.find(c => c.id === id) || null;
}

export async function saveConversation(conversation: Conversation): Promise<void> {
    const convos = await listConversations();
    const index = convos.findIndex(c => c.id === conversation.id);

    if (index >= 0) {
        convos[index] = { ...conversation, updatedAt: Date.now() };
    } else {
        convos.push(conversation);
    }

    const trimmed = convos.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 50);
    await chrome.storage.local.set({ [CONVERSATIONS_KEY]: trimmed });
}

export async function deleteConversation(id: string): Promise<void> {
    const convos = await listConversations();
    const filtered = convos.filter(c => c.id !== id);
    await chrome.storage.local.set({ [CONVERSATIONS_KEY]: filtered });
}

export async function getActiveConversationId(): Promise<string | null> {
    const result = await chrome.storage.local.get(ACTIVE_CONVERSATION_KEY);
    return (result[ACTIVE_CONVERSATION_KEY] as string | undefined) || null;
}

export async function setActiveConversationId(id: string | null): Promise<void> {
    if (id) {
        await chrome.storage.local.set({ [ACTIVE_CONVERSATION_KEY]: id });
    } else {
        await chrome.storage.local.remove(ACTIVE_CONVERSATION_KEY);
    }
}

export function generateConversationTitle(messages: ChatMessage[]): string {
    const firstUserMsg = messages.find(m => m.role === 'user');
    if (!firstUserMsg) return 'New Chat';
    const text = firstUserMsg.content.replace(/\[.*?\]/g, '').trim();
    return text.length > 40 ? text.substring(0, 40) + '...' : text || 'New Chat';
}

export function createNewConversation(provider: string, modelId: string): Conversation {
    return {
        id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: 'New Chat',
        messages: [],
        provider,
        modelId,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
}
