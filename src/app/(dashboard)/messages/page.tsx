


// "use client";

// import Skeleton from "react-loading-skeleton";
// import "react-loading-skeleton/dist/skeleton.css";

// export default function MessagesIndexPage({ loading = false }) {
//   return (
//     <div className="h-full flex items-center justify-center p-6">
//       <div className="text-center text-muted-foreground max-w-sm">
        
//         {loading ? (
//           <>
//             <Skeleton width={220} height={20} />
//             <Skeleton width={180} height={20} className="mt-2" />
//           </>
//         ) : (
//           <p className="text-balance">
//             Select a conversation from the sidebar to start chatting.
//           </p>
//         )}

//       </div>
//     </div>
//   );
// }





"use client";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function MessagesIndexPage({ loading = false }) {
  return (
    <div className="h-full flex flex-col justify-between p-6">

      {loading ? (
        <>
          {/* Messages skeleton */}
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 items-start">
                <Skeleton circle width={32} height={32} />
                <div className="space-y-2">
                  <Skeleton width={200} />
                  <Skeleton width={150} />
                </div>
              </div>
            ))}
          </div>

          {/* Input skeleton */}
          <div className="mt-6">
            <Skeleton height={40} />
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground max-w-sm">
            <p className="text-balance">
              Select a conversation from the sidebar to start chatting.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}