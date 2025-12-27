import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SpecInputProps {
  onSubmit: (input: string) => void;
  isLoading: boolean;
  defaultValue?: string;
}

export const SpecInput = ({ onSubmit, isLoading, defaultValue }: SpecInputProps) => {
  const [input, setInput] = useState(defaultValue || "");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Update input when defaultValue changes
  useEffect(() => {
    if (defaultValue) {
      setInput(defaultValue);
    }
  }, [defaultValue]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed) {
      toast({ title: "Please enter a specification request", variant: "destructive" });
      return;
    }
    if (trimmed.length < 10) {
      toast({ title: "Input too short (minimum 10 characters)", variant: "destructive" });
      return;
    }
    if (trimmed.length > 5000) {
      toast({ title: "Input too long (maximum 5000 characters)", variant: "destructive" });
      return;
    }
    onSubmit(trimmed);
  };

  const startRecording = async () => {
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
        const base64Audio = (reader.result as string).split(',')[1];
        
        console.log('Transcribing audio, size:', audioBlob.size);
        
        const { data, error } = await supabase.functions.invoke('voice-to-text', {
          body: { audio: base64Audio }
        });

        if (error) {
          console.error('Voice-to-text error:', error);
          throw error;
        }
        
        if (data?.text) {
          console.log('Transcription result:', data.text);
          setInput(prev => prev + (prev ? ' ' : '') + data.text);
          toast({ title: "Transcription complete", description: `${data.text.substring(0, 50)  }...` });
        } else {
          throw new Error('No transcription returned');
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

  const placeholders = [
    "Design a next-gen mobile app for social commerce...",
    "Build a platform for decentralized finance...",
    "Create an AI-powered customer service system...",
    "Develop a real-time collaboration workspace...",
    "Launch a sustainable supply chain tracker...",
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input);
    }
  };

  return (
    <Card className="p-12 bg-gradient-card backdrop-blur-xl border-border/30 rounded-fluid overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-fluid opacity-50 animate-morph" />
      <div className="relative z-10 space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-block">
            <h1 className="text-6xl font-extralight tracking-tight text-primary">
              Specificity AI
            </h1>
          </div>
          <p className="text-muted-foreground text-sm tracking-wider uppercase">
            Precision Intelligence
          </p>
        </div>

        <div className="space-y-6">
          <PlaceholdersAndVanishInput
            placeholders={placeholders}
            onChange={handleInputChange}
            onSubmit={handleFormSubmit}
            value={input}
          />

          <div className="flex gap-3 justify-center">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              // Fix: Only disable when loading AND not recording (so user can always stop recording)
              disabled={isLoading && !isRecording}
              variant="outline"
              size="lg"
              className={`group relative overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.4)] transform hover:translate-y-[-2px] active:translate-y-[0px] transition-all duration-200 ${
                isRecording ? 'bg-destructive/20 text-destructive animate-pulse border-destructive' : ''
              }`}
            >
              <span className="relative flex items-center justify-center gap-2">
                {isRecording ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="6" y="4" width="4" height="16" rx="2" fill="currentColor" opacity="0.8">
                      <animate attributeName="height" values="16;8;16" dur="0.8s" repeatCount="indefinite" />
                      <animate attributeName="y" values="4;8;4" dur="0.8s" repeatCount="indefinite" />
                    </rect>
                    <rect x="14" y="4" width="4" height="16" rx="2" fill="currentColor" opacity="0.6">
                      <animate attributeName="height" values="16;4;16" dur="0.6s" repeatCount="indefinite" />
                      <animate attributeName="y" values="4;10;4" dur="0.6s" repeatCount="indefinite" />
                    </rect>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="6" y="8" width="4" height="8" rx="2" fill="currentColor" opacity="0.4" />
                    <rect x="14" y="6" width="4" height="12" rx="2" fill="currentColor" opacity="0.6" />
                  </svg>
                )}
                {isRecording ? 'Stop Recording' : 'Voice Input'}
              </span>
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="group relative overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.4)] transform hover:translate-y-[-2px] active:translate-y-[0px] transition-all duration-200"
              size="lg"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative flex items-center justify-center gap-3 uppercase tracking-widest text-sm font-light">
                {isLoading ? 'Analyzing Your Idea' : 'Get My Free Spec →'}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
