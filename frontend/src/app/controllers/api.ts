import { CreatorAsset } from "../types";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const fetchCreatorAsset = async (
  entityName: string,
  targetLanguage: string = "en",
  platform: string = "YouTube"
): Promise<CreatorAsset | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/mythology/creator-asset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "bypass-tunnel-reminder": "true",
      },
      body: JSON.stringify({
        entity_name: entityName,
        target_language: targetLanguage,
        creator_platform: platform,
      }),
    });

    if (!response.ok) {
      console.warn(`Failed to fetch creator asset for ${entityName}: ${response.status}`);
      return null;
    }

    const result = await response.json();
    if (result.status === "success" && result.data) {
      return result.data as CreatorAsset;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching creator asset for ${entityName}:`, error);
    return null;
  }
};
