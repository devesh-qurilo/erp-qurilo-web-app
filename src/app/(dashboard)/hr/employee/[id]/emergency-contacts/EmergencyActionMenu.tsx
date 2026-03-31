// "use client"

// import { useState } from "react"

// type Props = {
//     onView: () => void
//     onEdit: () => void
//     onDelete: () => void
// }

// export default function EmergencyActionMenu({
//     onView,
//     onEdit,
//     onDelete,
// }: Props) {
//     const [open, setOpen] = useState(false)

//     return (
//         <div className="relative">
//             <button
//                 onClick={() => setOpen((p) => !p)}
//                 className="px-2 py-1 text-gray-600 hover:text-black"
//             >
//                 ⋮
//             </button>

//             {open && (
//                 <div className="absolute right-0 mt-1 w-32 bg-white border rounded shadow z-10">
//                     <button
//                         onClick={() => {
//                             onView()
//                             setOpen(false)
//                         }}
//                         className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
//                     >
//                         View 
//                     </button>
//                     <button
//                         onClick={() => {
//                             onEdit()
//                             setOpen(false)
//                         }}
//                         className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
//                     >
//                         Edit
//                     </button>
//                     <button
//                         onClick={() => {
//                             onDelete()
//                             setOpen(false)
//                         }}
//                         className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
//                     >
//                         Delete
//                     </button>
//                 </div>
//             )}
//         </div>
//     )
// }







"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"

type Props = {
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function EmergencyActionMenu({
  onView,
  onEdit,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const toggleMenu = () => {
    if (!btnRef.current) return

    const rect = btnRef.current.getBoundingClientRect()

    setPos({
      top: rect.bottom + window.scrollY,
      left: rect.right - 130 + window.scrollX,
    })

    setOpen((p) => !p)
  }

  // close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  // close on scroll
  useEffect(() => {
    function handleScroll() {
      setOpen(false)
    }

    if (open) {
      window.addEventListener("scroll", handleScroll, true)
    }

    return () => {
      window.removeEventListener("scroll", handleScroll, true)
    }
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggleMenu}
        className="px-2 py-1 text-gray-600 hover:text-black"
      >
        ⋮
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "absolute",
              top: pos.top,
              left: pos.left,
              width: 130,
            }}
            className="bg-white border rounded shadow-lg z-[9999]"
          >
            <button
              onClick={() => {
                onView()
                setOpen(false)
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
            >
              View
            </button>

            <button
              onClick={() => {
                onEdit()
                setOpen(false)
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
            >
              Edit
            </button>

            <button
              onClick={() => {
                onDelete()
                setOpen(false)
              }}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>,
          document.body
        )}
    </>
  )
}