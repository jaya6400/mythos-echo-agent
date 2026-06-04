import { CreatorAsset } from "../types";

const LANGUAGE_SCRIPT_REGEX: Record<string, RegExp> = {
  hi: /[\u0900-\u097f]/,
  ta: /[\u0b80-\u0bff]/,
};

const RAW_FIELD_LABEL_PATTERN =
  /\b(?:Name|Pantheon|Attributes|Description|Title|Context|Snippet|Text)\s*(?:\((?:hi|hindi|ta|tamil|en|english)\))?\s*:\s*/gi;

export const safeJsonParse = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const normalizeTargetLanguage = (targetLanguage: string) => targetLanguage?.toLowerCase()?.trim() || "en";

export const containsTargetScript = (text: string, targetLanguage: string) => {
  const normalizedTarget = normalizeTargetLanguage(targetLanguage);
  const scriptRegex = LANGUAGE_SCRIPT_REGEX[normalizedTarget];
  if (scriptRegex) return scriptRegex.test(text);
  return !Object.values(LANGUAGE_SCRIPT_REGEX).some((regex) => regex.test(text));
};

export const detectLanguageHint = (text: string) => {
  if (LANGUAGE_SCRIPT_REGEX.hi.test(text)) return "Hindi";
  if (LANGUAGE_SCRIPT_REGEX.ta.test(text)) return "Tamil";
  return "English";
};

export const normalizeAttributeTokens = (text: string) =>
  text
    .split(/[,|]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((token) => token.replace(/^#/, "").replace(/[^A-Za-z0-9_\u0900-\u097f\u0b80-\u0bff]+/g, ""));

export const isTargetLanguageText = (text: string, targetLanguage: string) => {
  if (!text) return false;
  return containsTargetScript(text, targetLanguage);
};

export const cleanRawFieldText = (value: string) =>
  value
    .replace(RAW_FIELD_LABEL_PATTERN, "")
    .replace(/\s*\|\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const uniqueClean = (items: string[]) =>
  Array.from(
    new Set(
      items
        .map((item) => cleanRawFieldText(item).replace(/^#/, "").trim())
        .filter(Boolean)
    )
  );

export const extractLabeledValue = (text: string, label: string, language?: string) => {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const languageGroup = language ? `\\((?:${language})\\)` : "(?:\\((?:hi|hindi|ta|tamil|en|english)\\))?";
  const pattern = new RegExp(`${escapedLabel}\\s*${languageGroup}\\s*:\\s*([^|\\n\\r]+)`, "i");
  return text.match(pattern)?.[1]?.trim() || "";
};

export const extractLocalizedText = (text: string, targetLanguage: string) => {
  const normalizedTarget = normalizeTargetLanguage(targetLanguage);
  const languagePattern = normalizedTarget === "hi" ? "hi|hindi" : normalizedTarget === "ta" ? "ta|tamil" : "en|english";

  const name =
    extractLabeledValue(text, "Name", languagePattern) ||
    extractLabeledValue(text, "Title", languagePattern);
  const description =
    extractLabeledValue(text, "Description", languagePattern) ||
    extractLabeledValue(text, "Text", languagePattern) ||
    extractLabeledValue(text, "Snippet", languagePattern);
  const attributes =
    extractLabeledValue(text, "Attributes", languagePattern) ||
    extractLabeledValue(text, "Powers", languagePattern);
  const pantheon = extractLabeledValue(text, "Pantheon", languagePattern);

  return {
    name: cleanRawFieldText(name),
    pantheon: cleanRawFieldText(pantheon),
    attributes: uniqueClean(attributes.split(/[,|]/)),
    description: cleanRawFieldText(description),
  };
};

export const extractEnglishMetadata = (text: string) => {
  const metadataPattern = /Name:\s*(.+?)\s*\|\s*Pantheon:\s*(.+?)\s*\|\s*Attributes:\s*(.+?)\s*\|\s*Description:\s*(.+?)(?=\s*\|\s*Name\s*\(|$)/i;
  const match = text.match(metadataPattern);
  if (!match) {
    return {
      name: cleanRawFieldText(extractLabeledValue(text, "Name")),
      pantheon: cleanRawFieldText(extractLabeledValue(text, "Pantheon")),
      attributes: uniqueClean(extractLabeledValue(text, "Attributes").split(/[,|]/)),
      description: cleanRawFieldText(extractLabeledValue(text, "Description")),
    };
  }

  const [, name, pantheon, attributes, description] = match;
  return {
    name: cleanRawFieldText(name),
    pantheon: cleanRawFieldText(pantheon),
    attributes: uniqueClean(attributes.split(/[,|]/)),
    description: cleanRawFieldText(description),
  };
};

export const extractTargetLanguageLines = (text: string, targetLanguage: string) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => isTargetLanguageText(line, targetLanguage));

export const createCreatorAsset = (
  name: string,
  pantheon: string,
  attributes: string,
  description: string,
  sourceSnippet: string,
  targetLanguage: string = "en"
): CreatorAsset => {
  const tagCandidates = normalizeAttributeTokens(attributes);
  const elementTags = [name, pantheon, ...tagCandidates]
    .filter(Boolean)
    .map((item) => item.toLowerCase().replace(/[^A-Za-z0-9_\u0900-\u097f\u0b80-\u0bff]+/g, ""))
    .slice(0, 12);

  const attributePhrase = attributes || "legendary traits";
  
  return {
    hook: `${name} is a ${pantheon || "mythology"} icon with ${attributePhrase} - built for a fast, high-impact creator hook.`,
    narrative: `Bring ${name} to life with a dynamic voiceover: from the ${pantheon || "mythology"} heritage, through ${attributePhrase.toLowerCase()}, into a cinematic moment. ${description}`,
    metadataTags: Array.from(new Set(elementTags)),
    language: detectLanguageHint(sourceSnippet),
    sourceSnippet,
  };
};

export const extractMetadataRows = (text: string, targetLanguage: string): CreatorAsset[] => {
  const normalizedTarget = normalizeTargetLanguage(targetLanguage);
  const assets: CreatorAsset[] = [];

  if (normalizedTarget === "hi" || normalizedTarget === "ta") {
    const localized = extractLocalizedText(text, normalizedTarget);
    if (localized.name || localized.description) {
      assets.push(createCreatorAsset(localized.name, localized.pantheon, localized.attributes.join(", "), localized.description, text, normalizedTarget));
      return assets;
    }
  }

  const english = extractEnglishMetadata(text);
  if (english.name || english.description) {
    assets.push(createCreatorAsset(english.name, english.pantheon, english.attributes.join(", "), english.description, text, normalizedTarget));
  }

  return assets;
};

export const findTranslationPayload = (payload: any, targetLanguage: string): any | null => {
  if (!payload || typeof payload !== "object") return null;

  const normalizedTarget = normalizeTargetLanguage(targetLanguage);
  const aliases: Record<string, string[]> = {
    en: ["en", "english"],
    hi: ["hi", "hindi"],
    ta: ["ta", "tamil"],
  };
  const preferred = aliases[normalizedTarget] || [normalizedTarget];

  const translationSources = payload.translations ?? payload.translation ?? payload.translated ?? payload.translated_text;
  if (!translationSources) return null;

  if (typeof translationSources === "string") {
    return translationSources;
  }

  if (Array.isArray(translationSources)) {
    for (const item of translationSources) {
      if (item && typeof item === "object") {
        const langValue = (item.language || item.lang || item.locale || "").toString().toLowerCase();
        if (preferred.includes(langValue)) {
          return item.text ?? item.content ?? item.description ?? item.name ?? item;
        }
      }
    }
    return translationSources[0] ?? null;
  }

  if (typeof translationSources === "object") {
    for (const alias of preferred) {
      if (alias in translationSources) {
        return translationSources[alias];
      }
    }

    for (const key of Object.keys(translationSources)) {
      if (preferred.some((alias) => key.toLowerCase().includes(alias))) {
        return translationSources[key];
      }
    }

    return translationSources;
  }

  return null;
};

export const flattenResponse = (payload: any, targetLanguage: string): any[] => {
  if (payload == null) return [];
  if (Array.isArray(payload)) {
    const languageSpecific = payload.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        ((item.language && item.language.toString().toLowerCase() === targetLanguage) ||
          (item.lang && item.lang.toString().toLowerCase() === targetLanguage) ||
          (item.locale && item.locale.toString().toLowerCase() === targetLanguage))
    );
    return (languageSpecific.length > 0 ? languageSpecific : payload).flatMap((item) => flattenResponse(item, targetLanguage));
  }

  if (typeof payload === "string") {
    const parsed = safeJsonParse(payload);
    if (parsed && parsed !== payload) {
      return flattenResponse(parsed, targetLanguage);
    }
    return [payload];
  }

  if (typeof payload === "object") {
    const translationPayload = findTranslationPayload(payload, targetLanguage);
    if (translationPayload) {
      return flattenResponse(translationPayload, targetLanguage);
    }

    if (payload.results) return flattenResponse(payload.results, targetLanguage);
    if (payload.data) return flattenResponse(payload.data, targetLanguage);
    if (payload.result) return flattenResponse(payload.result, targetLanguage);
    if (payload.content) return flattenResponse(payload.content, targetLanguage);
    if (payload.resources) return flattenResponse(payload.resources, targetLanguage);
    if (payload.snippets) return flattenResponse(payload.snippets, targetLanguage);
    if (payload.script_segments) return flattenResponse(payload.script_segments, targetLanguage);
    if (payload.text) return flattenResponse(payload.text, targetLanguage);
    if (payload._source) return flattenResponse(payload._source, targetLanguage);
    if (payload.raw) return flattenResponse(payload.raw, targetLanguage);

    return [payload];
  }

  return [String(payload)];
};

export const parseCreatorAssets = (rawPayload: any, targetLanguage: string = "en"): CreatorAsset[] => {
  const normalizedTarget = normalizeTargetLanguage(targetLanguage);
  const flattened = flattenResponse(rawPayload, normalizedTarget);
  const assets: CreatorAsset[] = [];
  const seen = new Set<string>();

  for (const item of flattened) {
    if (typeof item === "string") {
      for (const asset of extractMetadataRows(item, normalizedTarget)) {
        const key = `${asset.language}:${asset.hook}:${asset.narrative}`;
        if (!seen.has(key)) {
          seen.add(key);
          assets.push(asset);
        }
      }
      continue;
    }

    if (typeof item === "object") {
      if (item.language && typeof item.language === "string" && item.language.toLowerCase().trim() !== normalizedTarget) {
        continue;
      }
      if (item.lang && typeof item.lang === "string" && item.lang.toLowerCase().trim() !== normalizedTarget) {
        continue;
      }

      const snippets = Array.isArray(item.snippets)
        ? item.snippets
        : Array.isArray(item.content?.snippets)
        ? item.content.snippets
        : undefined;

      if (snippets) {
        for (const snippet of snippets) {
          if (typeof snippet === "string") {
            for (const asset of extractMetadataRows(snippet, normalizedTarget)) {
              const key = `${asset.language}:${asset.hook}:${asset.narrative}`;
              if (!seen.has(key)) {
                seen.add(key);
                assets.push(asset);
              }
            }
          }
        }
      }

      if (typeof item.text === "string") {
        for (const asset of extractMetadataRows(item.text, normalizedTarget)) {
          const key = `${asset.language}:${asset.hook}:${asset.narrative}`;
          if (!seen.has(key)) {
            seen.add(key);
            assets.push(asset);
          }
        }
      }

      if (item.name && item.description) {
        const sourceText = [item.name, item.description].filter(Boolean).join(" | ");
        if (!isTargetLanguageText(sourceText, normalizedTarget)) {
          continue;
        }

        const asset = createCreatorAsset(
          String(item.name),
          String(item.pantheon || ""),
          Array.isArray(item.attributes) ? item.attributes.join(", ") : String(item.attributes || ""),
          String(item.description),
          sourceText,
          normalizedTarget
        );
        const key = `${asset.language}:${asset.hook}:${asset.narrative}`;
        if (!seen.has(key)) {
          seen.add(key);
          assets.push(asset);
        }
      }
    }
  }

  return assets;
};

export const filterSegmentsForLanguage = (segments: any[], targetLanguage: string) =>
  segments
    .flatMap((segment) => {
      if (typeof segment !== "string") return [segment];
      return extractTargetLanguageLines(segment, targetLanguage).map(cleanRawFieldText).filter(Boolean);
    })
    .filter(Boolean);
