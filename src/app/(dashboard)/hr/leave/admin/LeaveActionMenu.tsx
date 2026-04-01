// "use client";

// import { useState } from "react";
// import { MoreVertical } from "lucide-react";

// interface Props {
//     status: string;
//     onView: () => void;
//     onApprove?: () => void;
//     onReject?: () => void;
//     onDelete: () => void;
//     loading?: boolean;
// }

// export default function LeaveActionMenu({
//     status,
//     onView,
//     onApprove,
//     onReject,
//     onDelete,
//     loading,
// }: Props) {
//     const [open, setOpen] = useState(false);


//     return (
//         <div className="relative">
//             <button
//                 onClick={() => setOpen((s) => !s)}
//                 className="p-2 rounded hover:bg-gray-100"
//             >
//                 <MoreVertical className="w-4 h-4" />
//             </button>

//             {open && (
//                 <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-md z-50">
//                     <button
//                         onClick={() => {

//                             setOpen(false);
//                             onView();
//                         }}
//                         className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
//                     >
//                         View 
//                     </button>

//                     {status === "PENDING" && (
//                         <>
//                             <button
//                                 disabled={loading}
//                                 onClick={() => {
//                                     setOpen(false);
//                                     onApprove?.();
//                                 }}
//                                 className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-green-600"
//                             >
//                                 Approve
//                             </button>

//                             <button
//                                 disabled={loading}
//                                 onClick={() => {
//                                     setOpen(false);
//                                     onReject?.();
//                                 }}
//                                 className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600"
//                             >
//                                 Reject
//                             </button>
//                         </>
//                     )}

//                     <div className="border-t my-1" />

//                     <button
//                         onClick={() => {
//                             setOpen(false);
//                             onDelete();
//                         }}
//                         className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600"
//                     >
//                         Delete
//                     </button>
//                 </div>
//             )}
//         </div>
//     );
// }






"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";

interface Props {
    status: string;
    onView: () => void;
    onApprove?: () => void;
    onReject?: () => void;
    onDelete: () => void;
    loading?: boolean;
}

export default function LeaveActionMenu({
  status,
  onView,
  onApprove,
  onReject,
  onDelete,
  loading,
}: Props) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  // ✅ Outside click + Escape close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
        setMenuPosition(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setMenuPosition(null);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();

          if (open) {
            setOpen(false);
            setMenuPosition(null);
            return;
          }

          const rect =
            (e.currentTarget as HTMLElement).getBoundingClientRect();

          const menuWidth = 180;
          const menuHeight = 160;

          let left = rect.right - menuWidth;
          let top = rect.bottom + 6;

          if (left + menuWidth > window.innerWidth) {
            left = window.innerWidth - menuWidth - 10;
          }

          if (top + menuHeight > window.innerHeight) {
            top = rect.top - menuHeight - 6;
          }

          setMenuPosition({ top, left });
          setOpen(true);
        }}
        className="p-2 rounded hover:bg-gray-100"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* ✅ PORTAL DROPDOWN */}
      {open &&
        menuPosition &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed w-44 bg-white border rounded-md shadow-2xl z-[99999]"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
            }}
          >
            <button
              onClick={() => {
                setOpen(false);
                onView();
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
            >
              View
            </button>

            {status === "PENDING" && (
              <>
                <button
                  disabled={loading}
                  onClick={() => {
                    setOpen(false);
                    onApprove?.();
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-green-600"
                >
                  Approve
                </button>

                <button
                  disabled={loading}
                  onClick={() => {
                    setOpen(false);
                    onReject?.();
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600"
                >
                  Reject
                </button>
              </>
            )}

            <div className="border-t my-1" />

            <button
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600"
            >
              Delete
            </button>
          </div>,
          document.body
        )}
    </>
  );
}
