import yaml from "js-yaml";

// Using Vite's import.meta.glob to dynamically import all YAML files
const languageModules = import.meta.glob(
    "../public/i18n/*.yaml",
    { eager: true, query: "?raw", import: "default" } // 'as: "raw"' to load content as a raw string
);

// Create I18N object with proper typing
const I18N: Record<string, I18nLanguage> = {};

// Process all imported modules and create properly typed I18N object
for (const path in languageModules) {
    // Extract the filename without extension (e.g., "en_US" from "../public/i18n/en_US.yaml")
    const match = path.match(/\/([^/]+)\.yaml$/);
    if (match && match[1]) {
        const langKey = match[1]; // e.g., "en_US"
        // Parse YAML content to JSON
        I18N[langKey] = yaml.load(languageModules[path] as string) as I18nLanguage;
    }
}

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
