// "use client";

// import TaskStatistics from "./TaskStatistics";
// import TasksTable from "../../components/TasksTable";


// import Skeleton from "react-loading-skeleton";
// import "react-loading-skeleton/dist/skeleton.css";


// export default function OverviewSection({ project, metrics, loading }: any) {

// // export default function OverviewSection({ project, metrics }: any) {
//     return (
//         <div className="space-y-6">

//             {/* SUMMARY */}
//             <div className="border rounded-xl p-6">
//                 <h3 className="text-lg font-medium mb-2">Project Summary</h3>
//                 <p className="text-sm text-gray-600">
//                     {project.summary || "No summary available"}
//                 </p>
//             </div>

//             {/* STATS */}
//             <div className="border rounded-xl p-6">
//                 <h3 className="text-lg font-medium mb-4">Task Statistics</h3>
//                 <TaskStatistics projectId={project.id} />
//             </div>

//             {/* TASK TABLE */}
//             <div className="border rounded-xl p-4">
//                 <TasksTable projectId={project.id} />
//             </div>
//         </div>
//     );
// }







"use client";

import TaskStatistics from "./TaskStatistics";
import TasksTable from "../../components/TasksTable";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function OverviewSection({ project, metrics, loading }: any) {
  return (
    <div className="space-y-6">

      {/* SUMMARY */}
      <div className="border rounded-xl p-6">
        <h3 className="text-lg font-medium mb-2">Project Summary</h3>

        {loading ? (
          <div className="space-y-2">
            <Skeleton height={10} />
            <Skeleton height={10} />
            <Skeleton height={10} width="80%" />
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            {project.summary || "No summary available"}
          </p>
        )}
      </div>

      {/* STATS */}
      <div className="border rounded-xl p-6">
        <h3 className="text-lg font-medium mb-4">Task Statistics</h3>

        {loading ? (
          <div className="flex gap-6">
            <Skeleton circle width={120} height={120} />
            <div className="flex-1 space-y-2">
              <Skeleton height={12} />
              <Skeleton height={12} width="80%" />
              <Skeleton height={12} width="60%" />
            </div>
          </div>
        ) : (
          <TaskStatistics projectId={project.id} />
        )}
      </div>

      {/* TASK TABLE */}
      <div className="border rounded-xl p-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton width={200} />
                <Skeleton width={100} />
              </div>
            ))}
          </div>
        ) : (
          <TasksTable projectId={project.id} />
        )}
      </div>

    </div>
  );
}
