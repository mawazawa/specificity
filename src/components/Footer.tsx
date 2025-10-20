import { Linkedin, Twitter, Github, Mail } from "lucide-react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border/40 bg-background/95 backdrop-blur-sm">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-8 lg:px-16 py-12 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Specificity AI
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Production-grade technical specifications powered by multi-agent AI collaboration.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground/80">
              Product
            </h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="#features" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                >
                  Features
                </a>
              </li>
              <li>
                <a 
                  href="#experts" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                >
                  Expert Panel
                </a>
              </li>
              <li>
                <a 
                  href="#methodology" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                >
                  Methodology
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground/80">
              Connect
            </h4>
            <div className="flex gap-3">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-2.5 rounded-lg bg-secondary/40 hover:bg-secondary/60 border border-border/20 hover:border-primary/30 transition-all duration-200"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-2.5 rounded-lg bg-secondary/40 hover:bg-secondary/60 border border-border/20 hover:border-primary/30 transition-all duration-200"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-2.5 rounded-lg bg-secondary/40 hover:bg-secondary/60 border border-border/20 hover:border-primary/30 transition-all duration-200"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
              <a
                href="mailto:contact@specificity.ai"
                className="group p-2.5 rounded-lg bg-secondary/40 hover:bg-secondary/60 border border-border/20 hover:border-primary/30 transition-all duration-200"
                aria-label="Email"
              >
                <Mail className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {currentYear} Specificity AI. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a 
              href="#privacy" 
              className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              Privacy Policy
            </a>
            <a 
              href="#terms" 
              className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
