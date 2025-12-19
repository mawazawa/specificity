import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2, Mic, Sparkles, Square } from "lucide-react";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { supabase } from "@/integrations/supabase/client";

interface SimpleSpecInputProps {
  onSubmit: (input: string) => void;
  isLoading: boolean;
  defaultValue?: string;
}

export const SimpleSpecInput = ({ onSubmit, isLoading, defaultValue }: SimpleSpecInputProps) => {
  const [input, setInput] = useState(defaultValue || "");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Update input when defaultValue changes
  useEffect(() => {
    if (defaultValue !== undefined) {
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
    // Show confirmation dialog before charging
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    onSubmit(input.trim());
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      toast({ title: "Voice input not supported", variant: "destructive" });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({ title: "Recording started" });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({ title: "Failed to start recording", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({ title: "Processing audio..." });
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        try {
          const base64Audio = (reader.result as string).split(',')[1];
          const { data, error } = await supabase.functions.invoke('voice-to-text', {
            body: { audio: base64Audio }
          });

          if (error) {
            throw error;
          }

          if (data?.text) {
            setInput(prev => prev + (prev ? ' ' : '') + data.text);
            toast({ title: "Transcription complete", description: data.text.substring(0, 60) + '...' });
          } else {
            throw new Error('No transcription returned');
          }
        } catch (error) {
          console.error('Voice-to-text error:', error);
          toast({
            title: "Failed to transcribe audio",
            description: error instanceof Error ? error.message : 'Unknown error',
            variant: "destructive"
          });
        }
      };
    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast({
        title: "Failed to transcribe audio",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    }
  };

  const charCount = input.length;
  const charMin = 25;
  const charMax = 5000;
  const isValid = charCount >= charMin && charCount <= charMax;

  return (
    <>
      <ConfirmationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        onConfirm={handleConfirm}
        inputPreview={input}
      />

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

      {/* Action Buttons */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isLoading}
          size="lg"
          variant="outline"
          className={`h-14 group relative overflow-hidden ${isRecording ? 'border-destructive text-destructive' : ''}`}
        >
          <span className="relative flex items-center justify-center gap-2">
            {isRecording ? (
              <>
                <Square className="w-5 h-5" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                Voice Input
              </>
            )}
          </span>
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={!isValid || isLoading}
          size="lg"
          className="h-14 text-base font-medium group relative overflow-hidden"
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
      </div>

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
    </>
  );
};
