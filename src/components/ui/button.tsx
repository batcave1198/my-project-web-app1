import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold tracking-wide transition-colors duration-150 disabled:pointer-events-none disabled:opacity-55 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-forest-900 text-cream-50 shadow-sm hover:bg-forest-800 active:bg-forest-950",
        gold: "bg-gold-500 text-forest-950 shadow-sm hover:bg-gold-400 active:bg-gold-600",
        outline:
          "border border-forest-900/25 bg-transparent text-forest-900 hover:border-forest-900/45 hover:bg-forest-900/5",
        ghost: "text-forest-900 hover:bg-forest-900/6",
        subtle: "bg-forest-900/6 text-forest-900 hover:bg-forest-900/10",
        link: "h-auto p-0 text-forest-800 underline-offset-4 hover:underline",
        danger:
          "bg-danger text-white shadow-sm hover:bg-danger/90 active:bg-danger",
      },
      size: {
        sm: "h-9 px-3.5 text-xs",
        md: "h-11 px-5",
        lg: "h-12 px-7 text-base",
        icon: "size-10",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  type,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";

  return (
    <Component
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...(asChild ? {} : { type: type ?? "button" })}
      {...props}
    />
  );
}

export { buttonVariants };
