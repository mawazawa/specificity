import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";

interface SimpleSpecInputProps {
  onSubmit: (input: string) => void;
  isLoading: boolean;
  defaultValue?: string;
}

export const SimpleSpecInput = ({ onSubmit, isLoading, defaultValue }: SimpleSpecInputProps) => {
  const [input, setInput] = useState(defaultValue || "");

  // Update input when defaultValue changes
  useEffect(() => {
    if (defaultValue) {
      setInput(defaultValue);
    }
  }, [defaultValue]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed) {
      toast({ title: "Please describe your product idea", variant: "destructive" });
      return;
    }
    if (trimmed.length < 25) {
      toast({ title: "Please provide more details (at least 25 characters)", variant: "destructive" });
      return;
    }
    if (trimmed.length > 5000) {
      toast({ title: "Description too long (maximum 5000 characters)", variant: "destructive" });
      return;
    }
    onSubmit(trimmed);
  };

  const charCount = input.length;
  const charMin = 25;
  const charMax = 5000;
  const isValid = charCount >= charMin && charCount <= charMax;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4" data-spec-input>
      {/* Simple Textarea */}
      <div className="relative">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your product idea in a few sentences...

Example: Build a mobile fitness app where users can log workouts, track progress, compete with friends, and get AI-powered coaching recommendations."
          className="min-h-[160px] text-base resize-none bg-background/50 border-border/50 focus:border-primary focus:ring-primary"
          disabled={isLoading}
        />

        {/* Character Counter */}
        <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
          <span className={charCount < charMin ? "text-destructive" : charCount > charMax ? "text-destructive" : "text-foreground/60"}>
            {charCount}
          </span>
          <span className="text-muted-foreground/50"> / {charMax}</span>
          {charCount < charMin && (
            <span className="ml-2 text-destructive">({charMin - charCount} more needed)</span>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={!isValid || isLoading}
        size="lg"
        className="w-full text-base font-medium h-14 group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-shimmer opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
        <span className="relative flex items-center justify-center gap-2">
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Your Spec...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate My Specification ($20)
            </>
          )}
        </span>
      </Button>

      {/* Info Text */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          30-minute delivery
        </span>
        <span className="flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Money-back guarantee
        </span>
        <span className="flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          15 comprehensive sections
        </span>
      </div>
    </div>
  );
};
