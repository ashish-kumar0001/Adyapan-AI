import * as React from "react";
import { cn } from "@/lib/cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, name, ...props }, ref) => {
    const inputId = id ?? String(name ?? "");

    return (
      <label className="block space-y-2" htmlFor={inputId || undefined}>
        {label ? <span className="text-sm font-medium text-[#334039]">{label}</span> : null}
        <span className="relative block">
          {icon ? (
            <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 text-[#6b756f]">
              {icon}
            </span>
          ) : null}
          <input
            ref={ref}
            id={inputId || undefined}
            name={name}
            className={cn(
              "h-11 w-full rounded-md border border-[#cfd6ca] bg-white px-3 text-sm text-[#17211c] outline-none transition focus:border-[#0f766e] focus:ring-2 focus:ring-[#99f6e4]",
              icon && "pl-10",
              error && "border-[#be123c] focus:border-[#be123c] focus:ring-[#fecdd3]",
              className,
            )}
            {...props}
          />
        </span>
        {error ? <span className="text-sm text-[#be123c]">{error}</span> : null}
      </label>
    );
  },
);

Input.displayName = "Input";
