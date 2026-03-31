import Image from "next/image"

export default function EmployeeHeader({ employee }: { employee: any }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full overflow-hidden border">
                    <Image
                        src={employee.profilePictureUrl || "/employee-avatar.png"}
                        alt={employee.name}
                        width={64}
                        height={64}
                        className="object-cover"
                    />
                </div>

                <div>
                    <h1 className="text-xl font-semibold">{employee.name}</h1>
                    <p className="text-sm text-gray-500">
                        {employee.designationName || "—"}
                    </p>
                    <p className="text-xs text-gray-400">
                        Employee Id : {employee.employeeId}
                    </p>
                    <p className="text-xs text-gray-400">
                        Reporting to : {employee.reportingToName || "—"}
                    </p>
                </div>
            </div>
        </div>
    )
}
