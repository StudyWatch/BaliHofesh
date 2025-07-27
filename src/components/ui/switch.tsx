// components/ui/switch.tsx

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    ref={ref}
    dir="ltr" // השארנו LTR כדי שהכדור יתחיל בימין ויזוז שמאלה
    className={cn(
      "inline-flex w-12 h-7 items-center shrink-0 cursor-pointer rounded-full",
      "transition-colors border-2 border-transparent",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
      "bg-gray-300 dark:bg-gray-600 data-[state=checked]:bg-blue-500 dark:data-[state=checked]:bg-blue-400",
      className
    )}
    {...props}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-6 w-6 rounded-full bg-white shadow-md ring-0",
        "transition-transform duration-300",
        "data-[state=checked]:translate-x-5 translate-x-0" // ✅ זז שמאלה כשהוא checked
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = "Switch";

export { Switch };
