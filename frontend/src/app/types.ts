import { LogStep } from "@/components/Sidebar";

export interface CreatorAsset {
  hook: string;
  narrative: string;
  metadataTags: string[];
  language: string;
  sourceSnippet: string;
  platform?: string;
}

export interface CreatorFields {
  name: string;
  pantheon: string;
  attributes: string[];
  description: string;
  raw: string;
}
