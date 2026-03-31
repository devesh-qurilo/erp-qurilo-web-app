"use client"

export default function ViewEmergencyContactModal({
    open,
    onClose,
    contact,
}: any) {
    if (!open || !contact) return null

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
            <div className="bg-white w-full max-w-md rounded-xl p-6 space-y-3">
                <h2 className="text-lg font-semibold">Emergency Contact</h2>

                {[
                    ["Name", contact.name],
                    ["Relationship", contact.relationship],
                    ["Email", contact.email],
                    ["Mobile", contact.mobile],
                    ["Address", contact.address],
                ].map(([label, value]) => (
                    <div key={label}>
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className="text-sm">{value || "--"}</p>
                    </div>
                ))}

                <div className="flex justify-end pt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded-lg"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
