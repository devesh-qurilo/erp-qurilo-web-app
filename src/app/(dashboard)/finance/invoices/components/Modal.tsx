// "use client";
// import { Button } from "@/components/ui/button";

// export default function Modal({ open, title, onClose, children }) {
//     if (!open) return null;

//     return (
//         <div className="fixed inset-0 z-50 flex justify-center items-start p-8 overflow-auto">
//             <div className="absolute inset-0 bg-black/40" onClick={onClose} />

//             <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl">
//                 <div className="flex justify-between items-center border-b px-5 py-3">
//                     <h3 className="text-lg font-semibold">{title}</h3>
//                     <Button variant="ghost" onClick={onClose}>✕</Button>
//                 </div>

//                 <div className="p-6">{children}</div>
//             </div>
//         </div>
//     );
// }


"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Right side full screen panel */}
      <div
        className={cn(
          "absolute right-0 top-0 h-full w-full  w-[83%]    bg-white shadow-xl",
          "animate-slide-in-right",
          className
        )}

      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto h-[calc(100%-64px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
