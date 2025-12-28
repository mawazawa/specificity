import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SpecOutput } from "@/components/SpecOutput";
import { Loader2, ArrowLeft, AlertCircle, WifiOff, Lock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { categorizeError, type ErrorCategory } from "@/lib/errors";
import { logger } from "@/lib/logger";

interface SpecError {
  title: string;
  message: string;
  category: ErrorCategory;
  showRetry: boolean;
}

export default function SpecView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [spec, setSpec] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<SpecError | null>(null);

  const fetchSpec = async () => {
    // Handle missing ID
    if (!id) {
      setError({
        title: "Invalid Link",
        message: "No specification ID provided. Please check the URL.",
        category: "client",
        showRetry: false,
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('specifications')
        .select('content')
        .eq('id', id)
        .single();

      if (dbError) {
        const categorized = categorizeError(dbError);
        const lowerMessage = dbError.message?.toLowerCase() || '';

        // Handle specific Supabase error codes
        if (dbError.code === 'PGRST116') {
          // Row not found
          setError({
            title: "Specification Not Found",
            message: "This specification doesn't exist or has been deleted.",
            category: "not_found",
            showRetry: false,
          });
        } else if (lowerMessage.includes('permission') || lowerMessage.includes('rls')) {
          setError({
            title: "Access Denied",
            message: "You don't have permission to view this specification.",
            category: "permission",
            showRetry: false,
          });
        } else {
          setError({
            title: categorized.title,
            message: categorized.message,
            category: categorized.category,
            showRetry: categorized.retryable,
          });
        }
        logger.error('[SpecView] Database error:', dbError);
        return;
      }

      setSpec(data.content);
    } catch (err) {
      const categorized = categorizeError(err);
      setError({
        title: categorized.title,
        message: categorized.message,
        category: categorized.category,
        showRetry: categorized.retryable,
      });
      logger.error('[SpecView] Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpec();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Get appropriate icon based on error category
  const getErrorIcon = (category: ErrorCategory) => {
    switch (category) {
      case 'network':
        return <WifiOff className="w-12 h-12 text-amber-500 mx-auto" />;
      case 'permission':
      case 'auth':
        return <Lock className="w-12 h-12 text-destructive mx-auto" />;
      default:
        return <AlertCircle className="w-12 h-12 text-destructive mx-auto" />;
    }
  };

  if (error || !spec) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 max-w-md w-full text-center space-y-4">
          {error ? getErrorIcon(error.category) : <AlertCircle className="w-12 h-12 text-destructive mx-auto" />}
          <h2 className="text-lg font-semibold">
            {error?.title || "Specification not found"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {error?.message || "The specification you're looking for doesn't exist or you don't have access to it."}
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
            {error?.showRetry && (
              <Button variant="outline" onClick={fetchSpec} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Retry
              </Button>
            )}
            <Button onClick={() => navigate("/specs")}>
              View All Specs
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid-background">
      <div className="container max-w-5xl mx-auto py-12 px-4">
        <SpecOutput spec={spec} readOnly />
      </div>
    </div>
  );
}
