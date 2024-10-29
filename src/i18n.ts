// Using Vite's import.meta.glob to dynamically import all JSON files
const languageModules = import.meta.glob<I18nLanguage>(
    "../public/i18n/*.json",
    { eager: true }
);

// Create I18N object with proper typing
const I18N: Record<string, I18nLanguage> = {};

// Process all imported modules and create properly typed I18N object
for (const path in languageModules) {
    // Extract the filename without extension (e.g., "en_US" from "../public/i18n/en_US.json")
    const match = path.match(/\/([^/]+)\.json$/);
    if (match && match[1]) {
        const langKey = match[1]; // e.g., "en_US"
        I18N[langKey] = languageModules[path];
    }
}

// // Type declaration for window.siyuan
// declare global {
//     interface Window {
//         siyuan: {
//             config: {
//                 lang: string;
//             };
//         };
//     }
// }

// Get the current language with proper typing
const getCurrentLanguage = (): I18nLanguage => {
    const currentLang = window.siyuan.config.lang;
    return currentLang in I18N ? I18N[currentLang] : I18N.en_US;
};

const i18n = getCurrentLanguage();

export { i18n, I18N };

// types.ts
export interface I18nLanguage {
    [key: string]: string;
}
