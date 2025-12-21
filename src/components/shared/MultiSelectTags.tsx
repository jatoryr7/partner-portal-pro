import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MultiSelectTagsProps {
  options: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}

export function MultiSelectTags({
  options,
  selected,
  onChange,
  className,
}: MultiSelectTagsProps) {
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggleOption(option)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
              "border-2 cursor-pointer",
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5"
            )}
          >
            {option}
            {isSelected && <X className="h-3 w-3" />}
          </button>
        );
      })}
    </div>
  );
}
