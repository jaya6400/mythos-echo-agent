"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Globe, Loader2, Video, Wand2 } from "lucide-react";

interface QueryFormProps {
  inputText: string;
  setInputText: (val: string) => void;
  language: string;
  setLanguage: (val: string) => void;
  platform: string;
  setPlatform: (val: string) => void;
  isProcessing: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

interface MotionSelectProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  options: { value: string; label: string }[];
  disabled: boolean;
  onChange: (val: string) => void;
}

function MotionSelect({ label, icon, value, options, disabled, onChange }: MotionSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <div className="creator-field relative">
      <label className="creator-label flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        className="creator-select-button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{selected.label}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-teal-200" />
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="creator-select-menu"
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className="creator-select-option"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  <AnimatePresence>
                    {isSelected && (
                      <motion.span
                        layoutId={`${label}-selected-bar`}
                        initial={{ opacity: 0, scaleY: 0.4 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        exit={{ opacity: 0, scaleY: 0.4 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="absolute left-1 top-2 bottom-2 w-1 rounded-full bg-teal-300"
                      />
                    )}
                  </AnimatePresence>
                  <span className="pl-2">{option.label}</span>
                  {isSelected && <Check className="h-4 w-4 text-teal-200" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function QueryForm({
  inputText,
  setInputText,
  language,
  setLanguage,
  platform,
  setPlatform,
  isProcessing,
  onSubmit
}: QueryFormProps) {
  const languageOptions = [
    { value: "en", label: "English creator research" },
    { value: "hi", label: "Hindi creator research" },
  ];

  const platformOptions = [
    { value: "YouTube", label: "YouTube video script" },
    { value: "TikTok", label: "TikTok short form" },
    { value: "Instagram", label: "Instagram reels story" },
    { value: "Podcast", label: "Podcast episode outline" },
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MotionSelect
          label="Script Layout"
          icon={<Globe className="h-3.5 w-3.5 text-teal-200" />}
          value={language}
          options={languageOptions}
          disabled={isProcessing}
          onChange={setLanguage}
        />

        <MotionSelect
          label="Content Platform"
          icon={<Video className="h-3.5 w-3.5 text-teal-200" />}
          value={platform}
          options={platformOptions}
          disabled={isProcessing}
          onChange={setPlatform}
        />
      </div>

      {/* Prompt Input */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter mythology prompt..."
          disabled={isProcessing}
          required
          minLength={5}
          className="creator-input"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isProcessing}
          className="creator-submit"
        >
          {isProcessing ? (
            <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <Loader2 className="w-4 h-4" />
            </motion.span>
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </form>
  );
}
