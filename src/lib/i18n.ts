export type Language = 'en' | 'tr';

export const translations = {
    en: {
        // General
        appName: "Multi-AI",
        startChat: "Start chat with {provider}",
        startChatEmpty: "Start chat with {provider}",
        messagePlaceholder: "Message with {provider}...",
        uploadFile: "Upload File (PDF, TXT...)",
        uploadImage: "Upload Image",

        // Settings & Sidebar
        settings: "Settings",
        appearance: "Appearance",
        lightMode: "Light Mode",
        darkMode: "Dark Mode",
        language: "Language",
        selectLanguage: "Select Language",

        // Providers
        builtInProviders: "Built-in Providers",
        customProviders: "Custom Providers",
        addCustomProvider: "Add Custom Provider",
        providerName: "Provider Name",
        baseUrl: "Base URL",
        modelIds: "Model IDs",
        addProvider: "Add Provider",
        remove: "Remove",
        enterKey: "Enter key",
        save: "Save",

        // Chat
        chatHistory: "Chat History",
        newChat: "New Chat",

        // Errors/Status
        error: "Error",
        loading: "Loading...",
    },
    tr: {
        // General
        appName: "Multi-AI",
        startChat: "{provider} ile sohbet başlatın",
        startChatEmpty: "{provider} ile sohbet başlatın",
        messagePlaceholder: "{provider} ile mesaj...",
        uploadFile: "Dosya Yükle (PDF, TXT...)",
        uploadImage: "Resim Yükle",

        // Settings & Sidebar
        settings: "Ayarlar",
        appearance: "Görünüm",
        lightMode: "Aydınlık Mod",
        darkMode: "Karanlık Mod",
        language: "Dil",
        selectLanguage: "Dil Seçin",

        // Providers
        builtInProviders: "Dahili Sağlayıcılar",
        customProviders: "Özel Sağlayıcılar",
        addCustomProvider: "Özel Sağlayıcı Ekle",
        providerName: "Sağlayıcı Adı",
        baseUrl: "Temel URL",
        modelIds: "Model Kimlikleri",
        addProvider: "Sağlayıcı Ekle",
        remove: "Kaldır",
        enterKey: "Anahtar girin",
        save: "Kaydet",

        // Chat
        chatHistory: "Sohbet Geçmişi",
        newChat: "Yeni Sohbet",

        // Errors/Status
        error: "Hata",
        loading: "Yükleniyor...",
    }
};
