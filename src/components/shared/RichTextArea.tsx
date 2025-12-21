import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface RichTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
  className?: string;
  rows?: number;
}

export function RichTextArea({
  value,
  onChange,
  maxLength = 5000,
  placeholder,
  className,
  rows = 6,
}: RichTextAreaProps) {
  const charCount = value.length;
  const isNearLimit = maxLength && charCount > maxLength * 0.9;
  const isOverLimit = maxLength && charCount > maxLength;

  return (
    <div className={cn("space-y-2", className)}>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          "resize-none",
          isOverLimit && "border-destructive focus-visible:ring-destructive"
        )}
      />
      <div className="flex justify-end">
        <span
          className={cn(
            "text-xs",
            isOverLimit
              ? "text-destructive font-medium"
              : isNearLimit
              ? "text-warning"
              : "text-muted-foreground"
          )}
        >
          {charCount.toLocaleString()}/{maxLength.toLocaleString()} characters
        </span>
      </div>
    </div>
  );
}
