import { useEffect, useState, useCallback } from "react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { FileText, Download, Copy, Users, Settings, LogOut, Zap, Search } from "lucide-react";

interface CommandPaletteProps {
  onAction: (action: string, data?: any) => void;
}

export const CommandPalette = ({ onAction }: CommandPaletteProps) => {
  const [open, setOpen] = useState(false);

  // Keyboard shortcut listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleAction = useCallback((action: string, data?: any) => {
    setOpen(false);
    onAction(action, data);
  }, [onAction]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => handleAction('new-spec')}>
            <Zap className="mr-2 h-4 w-4" />
            <span>Generate New Spec</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>N
            </kbd>
          </CommandItem>

          <CommandItem onSelect={() => handleAction('download-pdf')}>
            <Download className="mr-2 h-4 w-4" />
            <span>Download as PDF</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>D
            </kbd>
          </CommandItem>

          <CommandItem onSelect={() => handleAction('copy-spec')}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Copy Specification</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>C
            </kbd>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => handleAction('view-agents')}>
            <Users className="mr-2 h-4 w-4" />
            <span>View Agent Panel</span>
          </CommandItem>

          <CommandItem onSelect={() => handleAction('view-history')}>
            <FileText className="mr-2 h-4 w-4" />
            <span>View History</span>
          </CommandItem>

          <CommandItem onSelect={() => handleAction('search-specs')}>
            <Search className="mr-2 h-4 w-4" />
            <span>Search Specifications</span>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => handleAction('toggle-theme')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Toggle Theme</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>T
            </kbd>
          </CommandItem>

          <CommandItem onSelect={() => handleAction('sign-out')}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
