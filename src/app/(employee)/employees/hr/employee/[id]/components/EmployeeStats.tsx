export default function EmployeeStats() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            {[
                { label: "Projects", value: "09" },
                { label: "Tasks", value: "01" },
                { label: "Hours Logged", value: "04" },
            ].map((item) => (
                <div
                    key={item.label}
                    className="border rounded-lg p-4 bg-white"
                >
                    <p className="text-sm text-gray-500">{item.label}</p>
                    <p className="text-xl font-semibold text-blue-600">
                        {item.value}
                    </p>
                </div>
            ))}
        </div>
    )
}
