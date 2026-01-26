
import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}>
    {/* Background Track - Grey line representing max range */}
    <SliderPrimitive.Track
      className="relative h-2.5 w-full grow overflow-hidden rounded-full bg-slate-200 shadow-inner">
      {/* Fill Track - Gradient representing value */}
      <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-orange-400 to-[#f05a22]" />
    </SliderPrimitive.Track>
    
    {/* Thumb - The knob */}
    <SliderPrimitive.Thumb
      className="block h-6 w-6 rounded-full border-4 border-white bg-[#f05a22] shadow-[0_4px_10px_rgba(240,90,34,0.4)] ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110 transition-transform duration-200" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
