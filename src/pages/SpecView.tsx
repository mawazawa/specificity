import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SpecOutput } from "@/components/SpecOutput";
import { Loader2 } from "lucide-react";

export default function SpecView() {
  const { id } = useParams();
  const [spec, setSpec] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSpec() {
      if (!id) return;
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

  if (error || !spec) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        {error || "Specification not found"}
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
