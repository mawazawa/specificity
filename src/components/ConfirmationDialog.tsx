import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, Clock, DollarSign, FileText } from "lucide-react";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  inputPreview: string;
}

export const ConfirmationDialog = ({
  open,
  onOpenChange,
  onConfirm,
  inputPreview
}: ConfirmationDialogProps) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl">
            Ready to Generate Your Specification?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-6 pt-4">
              {/* Preview of what they're getting */}
              <div className="bg-card/30 border border-border/30 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Your Product Idea:</h4>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  "{inputPreview.substring(0, 200)}{inputPreview.length > 200 ? '...' : ''}"
                </p>
              </div>

              {/* What they'll receive */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">What You'll Receive:</h4>
                <div className="grid gap-2">
                  <div className="flex items-start gap-3">
                    <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <span className="font-medium text-foreground">15-Section Production Spec</span>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Architecture, security, testing, deployment, and more
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <span className="font-medium text-foreground">8 AI Expert Reviews</span>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Analyzed by Elon, Steve Jobs, Oprah, and 5 other expert AI personas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <span className="font-medium text-foreground">Real-Time Research</span>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Latest frameworks, security practices, and tech validated via Exa AI
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <span className="font-medium text-foreground">Export Options</span>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Download as PDF, Markdown, or plain text
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost & time */}
              <div className="flex items-center gap-6 pt-2 border-t border-border/20">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <div className="text-sm">
                    <span className="font-semibold text-foreground">$20</span>
                    <span className="text-muted-foreground"> one-time fee</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <div className="text-sm">
                    <span className="font-semibold text-foreground">~30 minutes</span>
                    <span className="text-muted-foreground"> delivery</span>
                  </div>
                </div>
              </div>

              {/* Guarantee */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                  💚 100% Money-Back Guarantee: If you're not satisfied with your specification,
                  we'll refund your payment within 24 hours, no questions asked.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="sm:flex-1">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="sm:flex-1 bg-primary hover:bg-primary/90"
          >
            Confirm & Generate ($20)
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
