# 🚀 Publishing to Chrome & Edge Web Stores

This guide explains how to publish your **Multi-AI Edge Extension** to the Chrome Web Store and Microsoft Edge Add-ons code.

## 📦 Preparation

1.  **Package**: A zip file `Multi-AI-Edge-Extension.zip` has been created in the project root. This contains your production build.
2.  **Icons**: Professional icons (16, 48, 128px) are included in the package.
3.  **Manifest**: `manifest.json` is configured for Manifest V3.

---

## 🌐 Chrome Web Store (Google)

1.  **Go to Dashboard**: Visit the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard).
2.  **Register**: You need a developer account (one-time $5 fee).
3.  **Create New Item**: Click **"New Item"**.
4.  **Upload**: Drag and drop the `Multi-AI-Edge-Extension.zip` file.
5.  **Fill Store Listing**:
    *   **Description**: Copy from `README.md`.
    *   **Category**: "Productivity" or "Search Tools".
    *   **Language**: English (United States) or Turkish.
    *   **Graphics**:
        *   **Icon**: Upload `public/icon512.png` (512x512).
        *   **Screenshots**: Upload screenshots from `docs/screenshots` folder (1280x800 recommended).
        *   **Marquee**: Optional but recommended (440x280).
6.  **Privacy Practices**:
    *   **Host Permissions**: Justification required. Explain you need `*://*/*` to specific AI APIs (Gemini, OpenAI, etc.) if they are not hardcoded. Since we use `fetch` to these APIs, you might need to list them or keep "all hosts" if you allow custom providers.
    *   **Data Usage**: Check "Does not collect user data" if true (keys are stored locally).
7.  **Submit**: Click **"Submit for Review"**. Review takes 1-3 days.

---

## 🌊 Microsoft Edge Add-ons

1.  **Go to Dashboard**: Visit the [Microsoft Partner Center](https://partner.microsoft.com/en-us/dashboard/microsoftedge).
2.  **Register**: You need a developer account (free or small fee depending on type).
3.  **Create New Extension**: Click **"Create new extension"**.
4.  **Upload**: Drag and drop the `Multi-AI-Edge-Extension.zip` file.
5.  **Availability**: Choose markets (e.g., All markets).
6.  **Properties**:
    *   **Category**: "Productivity".
    *   **Support Info**: Your email/website.
7.  **Store Listing**:
    *   Similar to Chrome, fill in description and upload icons/screenshots.
    *   **Search terms**: "AI, Gemini, OpenAI, Chatbot, Sidebar".
8.  **Submit**: Click **"Publish"**. Review takes 1-3 days.

---

## ⚠️ Important Notes

*   **API Keys**: Remind users in the description that **they need their own API keys**. The extension does NOT come with free keys.
*   **Privacy Policy**: Stores require a Privacy Policy URL. Since you don't collect data, you can create a simple GitHub Page (e.g., `https://serdevir91.github.io/Multi-AI-Edge-Extension/privacy`) stating that data is stored locally.
*   **Updates**: To update, increment the `version` in `manifest.json`, run `npm run build`, zip again, and upload closer via the dashboard.
