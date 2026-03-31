"use client"

import AllProjectsPage from "../components/ProjectTable"
import TasksTable from "../components/TasksTable"
import TimesheetsTableNew from "../components/TimesheetsTableNew"

export default function EmployeeWorkTab({
    employeeId,
}: {
    employeeId: string
}) {
    return (
        <div className="bg-white border rounded-lg p-4">
            <h2 className="font-semibold mb-4">Assigned Tasks</h2>

            <TasksTable employeeId={employeeId} />

            <TimesheetsTableNew employeeId={employeeId} />

            <AllProjectsPage employeeId={employeeId} />
        </div>
    )
}

