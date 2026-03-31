export default function ProfileInfoCard({ employee }: { employee: any }) {
    const Row = ({ label, value }: any) => (
        <div className="flex justify-between text-sm">
            <span className="text-gray-500">{label}</span>
            <span>{value || "—"}</span>
        </div>
    )

    return (
        <div className="border rounded-lg p-4 bg-white">
            <h3 className="font-medium mb-4">Profile Information</h3>

            <div className="space-y-2">
                <Row label="Name" value={employee.name} />
                <Row label="Employee Id" value={employee.employeeId} />
                <Row label="Designation" value={employee.designationName} />
                <Row label="Department" value={employee.departmentName} />
                <Row label="Gender" value={employee.gender} />
                <Row label="Date of Birth" value={employee.birthday} />
                <Row label="Blood Group" value={employee.bloodGroup} />
                <Row label="Email" value={employee.email} />
                <Row label="Mobile" value={employee.mobile} />
                <Row label="Language" value={employee.language} />
                <Row label="Employment Type" value={employee.employmentType} />
                <Row label="Joining Date" value={employee.joiningDate} />
            </div>
        </div>
    )
}
