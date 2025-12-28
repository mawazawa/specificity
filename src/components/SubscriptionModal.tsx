import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Check, Sparkles, Zap, Shield, Rocket, Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { toast } from "@/hooks/use-toast";

export const SubscriptionModal = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { profile, upgradeToPro } = useProfile();

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      // Simulate Stripe redirect
      await new Promise(resolve => setTimeout(resolve, 1500));
      await upgradeToPro();
      toast({
        title: "Welcome to Pro!",
        description: "Your account has been upgraded successfully.",
      });
      setIsOpen(false);
    } catch (_error) {
      toast({
        title: "Upgrade Failed",
        description: "There was an error processing your request.",
        variant: "destructive",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  if (profile?.plan === 'pro' || profile?.plan === 'enterprise') {
    return <>{children}</>;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            Unlock the full power of Multi-Agent Advisory Panel
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-6">
          <div className="space-y-4">
            <FeatureItem icon={<Zap className="w-4 h-4 text-yellow-500" />} text="Unlimited specification generations" />
            <FeatureItem icon={<Shield className="w-4 h-4 text-blue-500" />} text="Access to GPT-5.2 & Claude Opus 4.5" />
            <FeatureItem icon={<Rocket className="w-4 h-4 text-purple-500" />} text="AI-Generated UI Mockups & Wireframes" />
            <FeatureItem icon={<Check className="w-4 h-4 text-green-500" />} text="Priority expert research with parallel tools" />
          </div>

          <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-lg">Pro Plan</h4>
                <p className="text-xs text-muted-foreground">Everything you need to ship</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">$20</span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
            </div>
            
            <Button 
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity rounded-xl"
              onClick={handleUpgrade}
              disabled={isUpgrading}
            >
              {isUpgrading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Securing access...
                </>
              ) : (
                "Upgrade Now"
              )}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground mt-3">
              Secure payment via Stripe. Cancel anytime.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const FeatureItem = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
  <div className="flex items-start gap-3">
    <div className="mt-1">{icon}</div>
    <p className="text-sm text-foreground/80 leading-snug">{text}</p>
  </div>
);
