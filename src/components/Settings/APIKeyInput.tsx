import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Eye, EyeOff, Save } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

interface APIKeyInputProps {
    service: string;
    label: string;
}

export function APIKeyInput({ service, label }: APIKeyInputProps) {
    const { t } = useLanguage();
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        chrome.storage.local.get([`${service}_apiKey`], (result) => {
            if (result[`${service}_apiKey`]) {
                setApiKey(result[`${service}_apiKey`] as string);
                setIsSaved(true);
            }
        });
    }, [service]);

    const handleSave = () => {
        if (apiKey) {
            chrome.storage.local.set({ [`${service}_apiKey`]: apiKey }, () => {
                setIsSaved(true);
            });
        }
    };

    return (
        <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-400">{label}</label>
            <div className="flex gap-1.5">
                <div className="relative flex-1">
                    <Input
                        type={showKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => { setApiKey(e.target.value); setIsSaved(false); }}
                        placeholder={t('enterKey')}
                        className="pr-8 text-xs h-7 dark:bg-[#1e1f20] dark:border-[#3c4043] dark:text-white"
                    />
                    <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowKey(!showKey)}
                    >
                        {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                </div>
                <Button size="icon" className="h-7 w-7" onClick={handleSave} disabled={isSaved}>
                    <Save size={12} className={isSaved ? "text-green-400" : ""} />
                </Button>
            </div>
        </div>
    );
}
