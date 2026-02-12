import { useState, useCallback, useEffect, useRef } from 'react';
import { createAIService } from '../lib/ai';
import type { ChatMessage, Model, Attachment, Conversation } from '../lib/ai/types';
import {
    saveConversation,
    loadConversation,
    generateConversationTitle,
    createNewConversation,
    getActiveConversationId,
    setActiveConversationId,
    listConversations,
    deleteConversation
} from '../lib/chatStorage';

interface UseChatProps {
    provider: string;
}

export function useChat({ provider }: UseChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [availableModels, setAvailableModels] = useState<Model[]>([]);
    const [modelId, setModelId] = useState<string>('');
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const initialLoadDone = useRef(false);

    // Load conversations list
    const refreshConversations = useCallback(async () => {
        const convos = await listConversations();
        setConversations(convos);
    }, []);

    // Load active conversation on startup
    useEffect(() => {
        if (initialLoadDone.current) return;
        initialLoadDone.current = true;

        const init = async () => {
            // Auto-cleanup: remove any oversized old data that might block storage
            try {
                const result = await chrome.storage.local.get('conversations');
                const convos = result.conversations;
                if (Array.isArray(convos)) {
                    // Check for oversized conversations (containing base64 data)
                    let needsCleanup = false;
                    const cleanConvos = convos.map((c: any) => {
                        if (c.messages) {
                            c.messages = c.messages.map((m: any) => {
                                if (m.attachmentPreview && m.attachmentPreview.length > 1000) {
                                    needsCleanup = true;
                                    const { attachmentPreview, ...rest } = m;
                                    void attachmentPreview;
                                    return rest;
                                }
                                return m;
                            });
                        }
                        return c;
                    });
                    if (needsCleanup) {
                        await chrome.storage.local.set({ conversations: cleanConvos });
                        console.log('Cleaned oversized attachment data from storage');
                    }
                }
            } catch (err) {
                // If storage is completely broken, reset it
                console.warn('Storage cleanup failed, resetting conversations:', err);
                await chrome.storage.local.remove('conversations');
            }

            await refreshConversations();
            const activeId = await getActiveConversationId();
            if (activeId) {
                const convo = await loadConversation(activeId);
                if (convo) {
                    setConversationId(convo.id);
                    setMessages(convo.messages);
                }
            }
        };
        init();
    }, [refreshConversations]);

    // Fetch models when provider changes
    useEffect(() => {
        const fetchModels = async () => {
            setAvailableModels([]);
            try {
                // Get API key for builtin providers
                const storageKey = `${provider}_apiKey`;
                const result = await chrome.storage.local.get([storageKey, `selected_model_${provider}`]);
                const apiKey = result[storageKey];

                if (!apiKey) return;

                const aiService = await createAIService(provider, apiKey as string);
                const models = await aiService.getModels();
                setAvailableModels(models);

                // Restore saved model or use first available
                const savedModel = result[`selected_model_${provider}`] as string;
                if (savedModel && models.find(m => m.id === savedModel)) {
                    setModelId(savedModel);
                } else if (models.length > 0) {
                    setModelId(models[0].id);
                }
            } catch (err) {
                console.error("Failed to fetch models", err);
            }
        };

        fetchModels();
    }, [provider]);

    // Save model selection when it changes
    useEffect(() => {
        if (modelId) {
            chrome.storage.local.set({ [`selected_model_${provider}`]: modelId });
        }
    }, [modelId, provider]);

    // Direct persistence helper used in sendMessage

    const sendMessage = useCallback(async (content: string, attachment?: Attachment) => {
        if (!modelId) {
            setError("No model selected or available.");
            return;
        }

        setIsLoading(true);
        setError(null);

        // Ensure we have an active conversation
        let activeConvoId = conversationId;
        if (!activeConvoId) {
            const newConvo = createNewConversation(provider, modelId);
            activeConvoId = newConvo.id;
            setConversationId(newConvo.id);
            await setActiveConversationId(newConvo.id);
            await saveConversation(newConvo);
        }

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: Date.now(),
            provider,
            modelId,
            attachmentPreview: attachment?.type === 'image' ? attachment.content : undefined,
            attachmentName: attachment?.name,
        };

        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);

        try {
            const storageKey = `${provider}_apiKey`;
            const result = await chrome.storage.local.get(storageKey);
            const apiKey = result[storageKey];

            if (!apiKey) {
                throw new Error(`API Key for ${provider} not found. Please add it in Settings.`);
            }

            const aiService = await createAIService(provider, apiKey as string);
            const response = await aiService.sendMessage(content, modelId, undefined, attachment);

            const aiMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: Date.now(),
                provider,
                modelId
            };

            const finalMessages = [...updatedMessages, aiMessage];
            setMessages(finalMessages);
            await persistMessagesDirectly(activeConvoId, finalMessages);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to send message');
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Error: ${err.message || 'Something went wrong.'}`,
                timestamp: Date.now(),
                isError: true,
                provider,
                modelId
            };
            const finalMessages = [...updatedMessages, errorMessage];
            setMessages(finalMessages);
            await persistMessagesDirectly(activeConvoId, finalMessages);
        } finally {
            setIsLoading(false);
            await refreshConversations();
        }
    }, [provider, modelId, messages, conversationId, refreshConversations]);

    // Direct persistence without depending on state
    // IMPORTANT: Strip large base64 data before saving to avoid storage quota issues
    const persistMessagesDirectly = async (convoId: string, msgs: ChatMessage[]) => {
        // Remove attachmentPreview (large base64 images) before persisting
        const lightMessages = msgs.map(m => {
            if (m.attachmentPreview) {
                const { attachmentPreview, ...rest } = m;
                void attachmentPreview; // Intentionally discarded to save storage
                return rest;
            }
            return m;
        });

        try {
            const convo = await loadConversation(convoId);
            if (convo) {
                convo.messages = lightMessages;
                convo.title = generateConversationTitle(lightMessages);
                convo.updatedAt = Date.now();
                await saveConversation(convo);
            } else {
                const newConvo = createNewConversation(provider, modelId);
                newConvo.id = convoId;
                newConvo.messages = lightMessages;
                newConvo.title = generateConversationTitle(lightMessages);
                await saveConversation(newConvo);
            }
        } catch (err) {
            console.warn('Failed to persist messages (storage quota?):', err);
        }
    };

    const switchConversation = useCallback(async (id: string) => {
        const convo = await loadConversation(id);
        if (convo) {
            setConversationId(convo.id);
            setMessages(convo.messages);
            await setActiveConversationId(convo.id);
        }
    }, []);

    const startNewChat = useCallback(async () => {
        const newConvo = createNewConversation(provider, modelId);
        setConversationId(newConvo.id);
        setMessages([]);
        await setActiveConversationId(newConvo.id);
        await saveConversation(newConvo);
        await refreshConversations();
    }, [provider, modelId, refreshConversations]);

    const removeConversation = useCallback(async (id: string) => {
        await deleteConversation(id);
        if (conversationId === id) {
            setConversationId(null);
            setMessages([]);
            await setActiveConversationId(null);
        }
        await refreshConversations();
    }, [conversationId, refreshConversations]);

    const clearMessages = () => setMessages([]);

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        clearMessages,
        availableModels,
        modelId,
        setModelId,
        conversations,
        conversationId,
        switchConversation,
        startNewChat,
        removeConversation,
        refreshConversations,
    };
}
