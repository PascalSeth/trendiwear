"use client";

import React, { useState } from "react";
import { Search, Mic, MicOff, Send, Sparkles, X } from "lucide-react";

interface FollowUpComposerProps {
  onSubmitQuestion: (question: string) => void;
  isLoading: boolean;
  initialQuestion?: string;
  onClearQuestion?: () => void;
}

export function FollowUpComposer({
  onSubmitQuestion,
  isLoading,
  initialQuestion = "",
  onClearQuestion,
}: FollowUpComposerProps) {
  const [question, setQuestion] = useState(initialQuestion);
  const [isListening, setIsListening] = useState(false);

  // Sync state if initialQuestion changes from prompt click
  React.useEffect(() => {
    if (initialQuestion) {
      setQuestion(initialQuestion);
    }
  }, [initialQuestion]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;
    onSubmitQuestion(question.trim());
  };

  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Voice input is not supported in this browser. Please type your investigation question.");
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setQuestion(transcript);
          onSubmitQuestion(transcript);
        }
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <div className="rounded-xl border border-border/70 bg-card p-3 shadow-xs">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isLoading}
            placeholder="Ask a specific investigation... (e.g. 'Are T-shirts gaining interest in my area?')"
            className="w-full pl-9 pr-8 py-2 rounded-lg border border-border bg-background text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          {question && (
            <button
              type="button"
              onClick={() => {
                setQuestion("");
                if (onClearQuestion) onClearQuestion();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Voice Input */}
        <button
          type="button"
          onClick={handleVoiceInput}
          disabled={isLoading}
          className={`p-2 rounded-lg border transition-colors shrink-0 ${
            isListening
              ? "bg-red-500/10 text-red-600 border-red-500/30 animate-pulse"
              : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
          title={isListening ? "Listening..." : "Dictate investigation"}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Submit */}
        <button
          type="submit"
          disabled={!question.trim() || isLoading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50 shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Investigate</span>
        </button>
      </form>
    </div>
  );
}

