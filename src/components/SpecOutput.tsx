import { Card } from "@/components/ui/card";
import { FileText, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface SpecOutputProps {
  spec: string;
}

export const SpecOutput = ({ spec }: SpecOutputProps) => {
  if (!spec) return null;

  return (
    <Card className="p-8 bg-gradient-card backdrop-blur-sm border-primary/30">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-primary">
            Generated Specification
          </h2>
          <CheckCircle2 className="w-5 h-5 text-agent-dev ml-auto" />
        </div>

        <div className="prose prose-invert prose-lg max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-primary mb-4" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-accent mt-8 mb-4" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-xl font-bold text-foreground mt-6 mb-3" {...props} />,
              p: ({ node, ...props }) => <p className="text-foreground leading-relaxed mb-4" {...props} />,
              ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-2 mb-4" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-2 mb-4" {...props} />,
              li: ({ node, ...props }) => <li className="text-foreground" {...props} />,
              code: ({ node, inline, ...props }: any) => 
                inline ? (
                  <code className="bg-secondary px-2 py-1 rounded text-primary font-mono text-sm" {...props} />
                ) : (
                  <code className="block bg-secondary p-4 rounded-lg text-foreground font-mono text-sm overflow-x-auto" {...props} />
                ),
              blockquote: ({ node, ...props }) => (
                <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4" {...props} />
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
