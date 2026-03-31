// "use client"

// import AllProjectsPage from "../components/ProjectTable"
// import TasksTable from "../components/TasksTable"
// import TimesheetsTableNew from "../components/TimesheetsTableNew"



// export default function EmployeeWorkTab({
//     employeeId,
// }: {
//     employeeId: string
// }) {
//     return (
//         <div className="bg-white border rounded-lg p-4">
//             <h2 className="font-semibold mb-4">Assigned Tasks</h2>

//             <TasksTable employeeId={employeeId} />
//             <br />
//             <TimesheetsTableNew employeeId={employeeId} />

//             <AllProjectsPage employeeId={employeeId} />
//         </div>
//     )
// }





"use client";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import AllProjectsPage from "../components/ProjectTable";
import TasksTable from "../components/TasksTable";
import TimesheetsTableNew from "../components/TimesheetsTableNew";

export default function EmployeeWorkTab({
  employeeId,
  loading,
}: {
  employeeId: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-white border rounded-lg p-4">
      {/* TITLE */}
      {loading ? (
        <Skeleton width={180} height={20} className="mb-4" />
      ) : (
        <h2 className="font-semibold mb-4">Assigned Tasks</h2>
      )}

      {/* TASKS TABLE */}
      {loading ? (
        <Skeleton height={200} />
      ) : (
        <TasksTable employeeId={employeeId} />
      )}

      <br />

      {/* TIMESHEETS */}
      {loading ? (
        <Skeleton height={200} />
      ) : (
        <TimesheetsTableNew employeeId={employeeId} />
      )}

      <br />

      {/* PROJECTS */}
      {loading ? (
        <Skeleton height={200} />
      ) : (
        <AllProjectsPage employeeId={employeeId} />
      )}
    </div>
  );
}