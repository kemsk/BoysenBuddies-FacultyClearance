import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import type { OTPInputProps } from "input-otp";

import { Minus } from "lucide-react";
import { cn } from "../../components/lib/utils";

// Our wrapper props
interface InputOTPProps extends Omit<OTPInputProps, "maxLength"> {
  length?: number; // maps to maxLength
  className?: string;
  containerClassName?: string;
}

const InputOTP = React.forwardRef<HTMLInputElement, InputOTPProps>(
  ({ length = 6, className, containerClassName, ...props }, ref) => (
    <OTPInput
      ref={ref}
      maxLength={length} // required by OTPInput
      containerClassName={cn(
        "flex items-center gap-2 has-[:disabled]:opacity-50",
        containerClassName
      )}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  )
);
InputOTP.displayName = "InputOTP";

// Other components (group, slot, separator) remain the same
const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
));
InputOTPGroup.displayName = "InputOTPGroup";

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index];

    return (
      <div
        ref={ref}
        className={cn(
          // keep slots flexible but enforce sensible min/max so they don't become too small/large
          "relative flex items-center justify-center rounded-md bg-white text-center text-lg font-medium text-black shadow-md transition-all min-w-[48px] max-w-[80px] min-h-[48px] max-h-[80px]",
          isActive && "ring-2 ring-blue-500",
          className
        )}
        {...props}
      >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-px animate-caret-blink bg-black" />
        </div>
      )}
    </div>
  );
});

InputOTPSlot.displayName = "InputOTPSlot";

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Minus />
  </div>
));
InputOTPSeparator.displayName = "InputOTPSeparator";

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
