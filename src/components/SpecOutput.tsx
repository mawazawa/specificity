import { Card } from "@/components/ui/card";
import { FileText, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface SpecOutputProps {
  spec: string;
}

export const SpecOutput = ({ spec }: SpecOutputProps) => {
  if (!spec) return null;

  return (
    <Card className="p-10 bg-gradient-card backdrop-blur-xl border-border/20 rounded-fluid">
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <FileText className="w-5 h-5 text-foreground/60" />
          <h2 className="text-sm font-extralight uppercase tracking-widest text-foreground/80">
            Specification
          </h2>
          <CheckCircle2 className="w-4 h-4 text-primary/60 ml-auto" />
        </div>

        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => <h1 className="text-2xl font-light text-primary mb-6 tracking-wide" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-xl font-light text-foreground/90 mt-10 mb-5 tracking-wide" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-base font-light text-foreground/80 mt-8 mb-4" {...props} />,
              p: ({ node, ...props }) => <p className="text-foreground/70 leading-loose mb-6 text-sm" {...props} />,
              ul: ({ node, ...props }) => <ul className="list-none space-y-3 mb-6 ml-4" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-none space-y-3 mb-6 ml-4" {...props} />,
              li: ({ node, ...props }) => <li className="text-foreground/70 text-sm before:content-['—'] before:mr-3 before:text-primary/40" {...props} />,
              code: ({ node, inline, ...props }: any) => 
                inline ? (
                  <code className="bg-secondary/30 px-2 py-1 rounded-lg text-primary/80 font-mono text-xs" {...props} />
                ) : (
                  <code className="block bg-secondary/20 p-6 rounded-fluid text-foreground/70 font-mono text-xs overflow-x-auto border border-border/10" {...props} />
                ),
              blockquote: ({ node, ...props }) => (
                <blockquote className="border-l border-primary/30 pl-6 italic text-muted-foreground/70 my-6 font-light" {...props} />
              ),
            }}
          >
            {spec}
          </ReactMarkdown>
        </div>
      </div>
    </Card>
  );
};
