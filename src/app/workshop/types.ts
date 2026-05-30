import { ComponentType } from "react";
import { IconProps } from "@phosphor-icons/react";

export interface AnalysisResult {
  score: number;
  missingKeywords: string[];
  redFlags: string[];
  resolvedKeywords?: string[];
  resolvedRedFlags?: string[];
  breakdown?: {
    keywords: number;
    impact: number;
    structure: number;
    readability: number;
  };
}

export interface Toast {
  id: number;
  type: "error" | "success" | "info";
  message: string;
}

export interface SectionConfig {
  key: string;
  title: string;
  icon: ComponentType<IconProps>;
  description: string;
  placeholder: string;
}
