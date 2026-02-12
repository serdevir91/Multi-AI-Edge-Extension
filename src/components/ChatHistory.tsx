import type { Conversation } from '../lib/ai/types';
import { MessageSquare, Trash2, Plus } from 'lucide-react';

interface ChatHistoryProps {
    conversations: Conversation[];
    activeConversationId: string | null;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onNewChat: () => void;
}

export function ChatHistory({
    conversations,
    activeConversationId,
    onSelect,
    onDelete,
    onNewChat,
}: ChatHistoryProps) {
    const formatDate = (timestamp: number) => {
        const d = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return d.toLocaleDateString();
    };

    return (
        <div className="flex flex-col h-full">
            <button
                onClick={onNewChat}
                className="flex items-center gap-2 w-full px-3 py-2.5 mb-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
                <Plus className="h-4 w-4" />
                New Chat
            </button>

            <div className="flex-1 overflow-y-auto space-y-1">
                {conversations.length === 0 ? (
                    <div className="text-xs text-gray-500 dark:text-gray-500 text-center py-4">
                        No conversations yet
                    </div>
                ) : (
                    conversations.map((convo) => (
                        <div
                            key={convo.id}
                            className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${activeConversationId === convo.id
                                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                                }`}
                            onClick={() => onSelect(convo.id)}
                        >
                            <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
                            <div className="flex-1 min-w-0">
                                <div className="truncate text-xs font-medium">{convo.title}</div>
                                <div className="text-[10px] opacity-50">{formatDate(convo.updatedAt)}</div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(convo.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
                                title="Delete"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
