import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/lib/logger";

interface SpecRow {
  id: string;
  title: string;
  created_at: string;
  is_public: boolean;
}

const Specs = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [specs, setSpecs] = useState<SpecRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null); // Track which spec is being deleted

  const loadSpecs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fix: Filter by user_id to only show user's own specs
      const { data, error: fetchError } = await supabase
        .from("specifications")
        .select("id, title, created_at, is_public")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setSpecs(data || []);
    } catch (err) {
      logger.error("Failed to load specs:", err);
      setError("Failed to load specifications.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadSpecs();
    }
  }, [user]);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Delete this specification? This cannot be undone.");
    if (!confirmed) return;

    // Fix: Add loading state to prevent double-clicks
    setDeletingId(id);
    try {
      const { error: deleteError } = await supabase
        .from("specifications")
        .delete()
        .eq("id", id);

      if (deleteError) {
        throw deleteError;
      }

      setSpecs(prev => prev.filter(spec => spec.id !== id));
      toast({ title: "Deleted", description: "Specification removed." });
    } catch (err) {
      logger.error("Failed to delete spec:", err);
      toast({
        title: "Delete failed",
        description: "Could not delete specification.",
        variant: "destructive"
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid-background">
      <div className="container max-w-5xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">My Specifications</h1>
            <p className="text-sm text-muted-foreground">Access, review, or delete your generated specs.</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/") } className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Card className="p-6 text-sm text-destructive">{error}</Card>
        ) : specs.length === 0 ? (
          <Card className="p-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">No specifications yet.</p>
            <Button onClick={() => navigate("/")}>Create your first spec</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {specs.map(spec => (
              <Card key={spec.id} className="p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-base font-semibold">{spec.title || "Untitled Specification"}</h2>
                  <p className="text-xs text-muted-foreground">
                    {new Date(spec.created_at).toLocaleString()} · {spec.is_public ? "Public" : "Private"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/spec/${spec.id}`)} className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Open
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(spec.id)}
                    disabled={deletingId === spec.id}
                    className="gap-2"
                  >
                    {deletingId === spec.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    {deletingId === spec.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Specs;
