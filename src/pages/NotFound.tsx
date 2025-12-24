import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6 px-4 animate-fade-in">
        <div className="space-y-2">
          <h1
            className="text-8xl md:text-9xl font-extralight tracking-tight"
            style={{
              background: "linear-gradient(135deg, hsl(var(--foreground)), hsl(var(--accent)))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            404
          </h1>
          <p className="text-xl text-muted-foreground font-light">
            This page doesn't exist yet
          </p>
        </div>
        <Button asChild size="lg" className="gap-2">
          <Link to="/">
            <Sparkles className="w-4 h-4" />
            Create Something New
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
