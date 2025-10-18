import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SpecInputProps {
  onSubmit: (input: string) => void;
  isLoading: boolean;
}

export const SpecInput = ({ onSubmit, isLoading }: SpecInputProps) => {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSubmit = () => {
    if (input.trim()) {
      onSubmit(input);
    }
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
        
        const { data, error } = await supabase.functions.invoke('voice-to-text', {
          body: { audio: base64Audio }
        });

        if (error) throw error;
        
        setInput(prev => prev + (prev ? ' ' : '') + data.text);
        toast({ title: "Transcription complete" });
      };
    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast({ title: "Failed to transcribe audio", variant: "destructive" });
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
          <div className="relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Articulate your vision..."
              className="min-h-[180px] bg-background/30 border-border/20 focus:border-primary/30 resize-none text-base rounded-fluid backdrop-blur-sm transition-all duration-300 focus:bg-background/40 pr-16"
              disabled={isLoading || isRecording}
            />
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading}
              variant="ghost"
              size="icon"
              className={`absolute top-4 right-4 rounded-full transition-all duration-300 ${
                isRecording ? 'bg-destructive/20 text-destructive animate-pulse' : 'hover:bg-accent/10'
              }`}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="w-full group relative overflow-hidden"
            size="lg"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="relative flex items-center justify-center gap-3 uppercase tracking-widest text-sm font-light">
              <Sparkles className="w-4 h-4" />
              {isLoading ? 'Processing' : 'Generate Specification'}
            </span>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {[
            { name: "Gary Tan", role: "YC President", avatar: "🎯" },
            { name: "Sam Altman", role: "OpenAI CEO", avatar: "🤖" },
            { name: "Brian Chesky", role: "Airbnb CEO", avatar: "🏠" },
            { name: "Patrick Collison", role: "Stripe CEO", avatar: "💳" },
            { name: "Paul Graham", role: "YC Founder", avatar: "📚" },
            { name: "Jessica Livingston", role: "YC Partner", avatar: "✨" },
          ].map((advisor, i) => (
            <div key={i} className="group p-4 bg-secondary/10 rounded-fluid border border-border/10 backdrop-blur-sm transition-all duration-300 hover:bg-secondary/20 hover:border-accent/30 hover:scale-105 cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="text-lg">{advisor.avatar}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-foreground/80 font-light truncate">{advisor.name}</div>
                  <div className="text-muted-foreground uppercase tracking-widest text-[10px]">{advisor.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
