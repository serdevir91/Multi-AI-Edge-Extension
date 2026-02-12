import { useState, useRef, useEffect } from 'react';
import { ChatLayout } from './components/ChatLayout';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Send, Paperclip, Image as ImageIcon, Bot, User, Loader2, X } from 'lucide-react';
import { useChat } from './hooks/useChat';
import { useLanguage } from './hooks/useLanguage';
import { ModelSelector } from './components/ModelSelector';
import type { Attachment } from './lib/ai/types';
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';

function App() {
  const { t } = useLanguage();
  const [provider, setProvider] = useState<string>('gemini');
  const [input, setInput] = useState('');
  const {
    messages, isLoading, sendMessage,
    availableModels, modelId, setModelId,
    conversations, conversationId,
    switchConversation, startNewChat, removeConversation,
  } = useChat({ provider });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [attachment, setAttachment] = useState<Attachment | null>(null);

  // Load saved provider on startup
  useEffect(() => {
    chrome.storage.local.get('selectedProvider').then(result => {
      if (result.selectedProvider) {
        setProvider(result.selectedProvider as string);
      }
    });
  }, []);

  // Save provider when changed
  useEffect(() => {
    chrome.storage.local.set({ selectedProvider: provider });
  }, [provider]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, attachment]);

  const handleSend = () => {
    if ((!input.trim() && !attachment) || isLoading) return;

    sendMessage(input, attachment || undefined);
    setInput('');
    setAttachment(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 1. Manual Paste Handler (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;

          const reader = new FileReader();
          reader.onload = (ev) => {
            if (ev.target?.result) {
              setAttachment({
                type: 'image',
                content: ev.target.result as string,
                name: `pasted-image-${Date.now()}.png`,
                mimeType: file.type,
              });
            }
          };
          reader.readAsDataURL(file);
          break; // Only handle the first image
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // 2. Smart Watcher: Auto-detect new clipboard images (for Print Screen)
  useEffect(() => {
    let lastPastedImage: string | null = null;

    const checkClipboard = async () => {
      // Removed document.hidden check to allow checking even if panel is not strictly 'visible' in some contexts
      try {
        // This requires 'clipboardRead' permission in manifest
        const items = await navigator.clipboard.read();

        for (const item of items) {
          // Look for image types
          // Note: item.types is an array of MIME types
          const imageType = item.types.find(t => t.startsWith('image/'));

          if (imageType) {
            const blob = await item.getType(imageType);

            if (blob) {
              const reader = new FileReader();
              reader.onload = (ev) => {
                const content = ev.target?.result as string;
                if (!content || content.length < 2000) return;

                // Create a simple signature (content length + start of base64) to prevent dups on reload
                const imageSignature = `${content.length}-${content.substring(0, 50)}`;
                const lastSavedSignature = localStorage.getItem('lastAutoPastedSignature');

                // Check 1: In-memory dedup (current session)
                // Check 2: Persistent dedup (reloads)
                if (content !== lastPastedImage && imageSignature !== lastSavedSignature) {
                  lastPastedImage = content;
                  localStorage.setItem('lastAutoPastedSignature', imageSignature);

                  setAttachment({
                    type: 'image',
                    content: content,
                    name: `auto-pasted-${Date.now()}.png`,
                    mimeType: blob.type,
                  });
                }
              };
              reader.readAsDataURL(blob);
              return; // Stop after finding first image
            }
          }
        }
      } catch (err) {
        // Silently fail if permission denied or no clipboard access
        // console.warn('Auto-paste check failed:', err);
      }
    };

    // Check on focus
    window.addEventListener('focus', checkClipboard);

    // Check periodically (every 1s) to catch "Print Screen" while panel is open
    const intervalId = setInterval(checkClipboard, 1000);

    return () => {
      window.removeEventListener('focus', checkClipboard);
      clearInterval(intervalId);
    };
  }, []);

  // Image upload — separate input for images only
  const handleImageUpload = () => {
    imageInputRef.current?.click();
  };

  // File upload — PDF, text, etc.
  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const onImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setAttachment({
          type: 'image',
          content: ev.target.result as string,
          name: file.name,
          mimeType: file.type,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      // Read PDF as base64 for extraction later
      handlePDFFile(file);
    } else if (file.type.startsWith('image/')) {
      // If user accidentally selects image through file button, still handle it
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setAttachment({
            type: 'image',
            content: ev.target.result as string,
            name: file.name,
            mimeType: file.type,
          });
        }
      };
      reader.readAsDataURL(file);
    } else {
      // Text files
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setAttachment({
            type: 'text',
            content: ev.target.result as string,
            name: file.name,
            mimeType: file.type,
          });
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handlePDFFile = async (file: File) => {
    try {
      const { extractTextFromPDF } = await import('./lib/pdfExtractor');
      const text = await extractTextFromPDF(file);
      setAttachment({
        type: 'text',
        content: text,
        name: file.name,
        mimeType: 'text/plain',
      });
    } catch (err) {
      console.error('PDF extraction failed:', err);
      // Fallback: read as base64 and send raw (Gemini/Claude can process raw PDFs)
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setAttachment({
            type: 'image', // Use image type so it gets sent as base64 inline_data
            content: ev.target.result as string,
            name: file.name,
            mimeType: 'application/pdf',
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => setAttachment(null);

  return (
    <ChatLayout
      conversations={conversations}
      activeConversationId={conversationId}
      onSelectConversation={switchConversation}
      onDeleteConversation={removeConversation}
      onNewChat={startNewChat}
    >


      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-[#131314] transition-colors">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Bot size={28} />
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <b className="text-gray-700 dark:text-gray-300">{t('startChatEmpty').replace('{provider}', provider)}</b>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-2.5 max-w-[92%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white",
                msg.role === 'user'
                  ? "bg-gradient-to-br from-blue-500 to-blue-700"
                  : "bg-gradient-to-br from-emerald-500 to-teal-600"
              )}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className="space-y-1.5 min-w-0">
                {/* Image preview in message */}
                {msg.attachmentPreview && (
                  <img
                    src={msg.attachmentPreview}
                    alt={msg.attachmentName || 'attachment'}
                    className="max-w-[200px] max-h-[150px] rounded-lg border dark:border-[#3c4043] object-cover"
                  />
                )}
                {msg.attachmentName && !msg.attachmentPreview && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Paperclip className="h-3 w-3" />
                    <span>{msg.attachmentName}</span>
                  </div>
                )}
                <div className={cn(
                  "p-3 rounded-2xl text-sm shadow-sm overflow-hidden prose dark:prose-invert max-w-none prose-p:my-1 prose-pre:my-1",
                  msg.role === 'user'
                    ? "bg-blue-600 text-white rounded-tr-sm prose-p:text-white prose-strong:text-white prose-code:text-blue-100"
                    : cn(
                      "bg-white dark:bg-[#1e1f20] border dark:border-[#3c4043] rounded-tl-sm",
                      msg.isError
                        ? "border-red-400 text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400"
                        : "text-gray-800 dark:text-gray-200"
                    )
                )}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0">
              <Bot size={14} />
            </div>
            <div className="p-3 bg-white dark:bg-[#1e1f20] border dark:border-[#3c4043] rounded-2xl rounded-tl-sm text-sm shadow-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t bg-white dark:bg-[#1e1f20] dark:border-[#3c4043] shrink-0 transition-colors">
        {/* Model Selector (Moved to bottom) */}
        <div className="mb-2 flex items-center justify-between">
          <ModelSelector
            provider={provider}
            onProviderChange={setProvider}
            modelId={modelId}
            onModelIdChange={setModelId}
            availableModels={availableModels}
          />
        </div>

        {/* Attachment Preview */}
        {attachment && (
          <div className="flex items-center gap-2 mb-2 p-2 bg-gray-100 dark:bg-[#282a2c] rounded-xl border dark:border-[#3c4043] text-sm">
            {attachment.type === 'image' ? (
              <img src={attachment.content} alt="preview" className="h-10 w-10 object-cover rounded-lg" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Paperclip className="h-4 w-4 text-blue-500" />
              </div>
            )}
            <span className="truncate max-w-[180px] text-xs text-gray-700 dark:text-gray-300 font-medium">{attachment.name}</span>
            <button onClick={removeAttachment} className="ml-auto text-gray-400 hover:text-red-500 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Separate hidden inputs for image and file */}
        <input
          type="file"
          ref={imageInputRef}
          className="hidden"
          accept="image/*"
          onChange={onImageSelected}
        />
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,.txt,.md,.js,.ts,.tsx,.json,.csv,.xml,.html,.css,.py,.java,.c,.cpp"
          onChange={onFileSelected}
        />

        <div className="flex items-end gap-2">
          <div className="flex gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              title={t('uploadFile')}
              className="h-8 w-8 rounded-full dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#3c4043]"
              onClick={handleFileUpload}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title={t('uploadImage')}
              className="h-8 w-8 rounded-full dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#3c4043]"
              onClick={handleImageUpload}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            {/* Screenshot button removed */}
          </div>
          <div className="flex-1 flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('messagePlaceholder').replace('{provider}', provider)}
              className="flex-1 h-9 rounded-xl dark:bg-[#282a2c] dark:border-[#3c4043] dark:text-white dark:placeholder-gray-500 text-sm"
              disabled={isLoading}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={isLoading || (!input.trim() && !attachment)}
              className="h-9 w-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </ChatLayout>
  );
}

export default App;
