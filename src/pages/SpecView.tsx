import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SpecOutput } from "@/components/SpecOutput";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function SpecView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [spec, setSpec] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSpec() {
      // Fix: Handle missing ID - was causing infinite loading
      if (!id) {
        setError("No specification ID provided");
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('specifications')
          .select('content')
          .eq('id', id)
          .single();

        if (error) throw error;
        setSpec(data.content);
      } catch (err) {
        setError("Failed to load specification");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSpec();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Fix: Add back navigation and helpful error UI
  if (error || !spec) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-lg font-semibold">
            {error || "Specification not found"}
          </h2>
          <p className="text-sm text-muted-foreground">
            The specification you're looking for doesn't exist or you don't have access to it.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
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
