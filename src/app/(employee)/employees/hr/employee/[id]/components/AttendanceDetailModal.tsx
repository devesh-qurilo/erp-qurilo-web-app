
"use client"

export default function AttendanceDetailModal({
    open,
    onClose,
    data,
}: {
    open: boolean
    onClose: () => void
    data: any
}) {
    if (!open || !data) return null

    const formatTime = (t?: string) =>
        t ? new Date(`1970-01-01T${t}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"

    const duration =
        data.clockInTime && data.clockOutTime
            ? calcDuration(data.clockInTime, data.clockOutTime)
            : "—"

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white w-full max-w-4xl rounded-xl shadow-lg">

                {/* HEADER */}
                <div className="flex justify-between items-center px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold">Attendance Details</h2>
                    <button onClick={onClose} className="text-2xl">×</button>
                </div>

                {/* BODY */}
                <div className="grid grid-cols-2 gap-6 p-6">

                    {/* LEFT */}
                    <div className="border rounded-lg p-4 space-y-4">
                        <h3 className="font-medium">
                            Date – {data.date} ({new Date(data.date).toLocaleDateString("en-US", { weekday: "long" })})
                        </h3>

                        <Info label="Clock In" value={formatTime(data.clockInTime)} />
                        <div className="flex justify-center py-6">
                            <div className="w-32 h-32 rounded-full border-4 border-blue-500 flex items-center justify-center text-lg font-semibold">
                                {duration}
                            </div>
                        </div>
                        <Info label="Clock Out" value={formatTime(data.clockOutTime)} />
                    </div>

                    {/* RIGHT */}
                    <div className="border rounded-lg p-4 space-y-6">
                        <h3 className="font-medium">Activity</h3>

                        <Activity
                            title="Clock In"
                            time={formatTime(data.clockInTime)}
                            location={data.clockInLocation}
                            workingFrom={data.clockInWorkingFrom}
                            late={data.late}
                        />

                        <Activity
                            title="Clock Out"
                            time={data.clockOutTime ? formatTime(data.clockOutTime) : "Did not clock out"}
                            location={data.clockOutLocation}
                            workingFrom={data.clockOutWorkingFrom}
                        />

                        <div className="flex flex-wrap gap-2 pt-2 text-sm">
                            {data.holiday && badge("Holiday", "⭐")}
                            {data.leave && badge("Leave", "⛔")}
                            {data.late && badge("Late", "⏰")}
                            {data.halfDay && badge("Half Day", "½")}
                            {data.isPresent && badge("Present", "✔")}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ---------- helpers ---------- */

const Info = ({ label, value }: any) => (
    <div className="bg-gray-50 border rounded-lg p-3">
        <div className="text-sm text-gray-500">{label}</div>
        <div className="font-medium">{value}</div>
    </div>
)

const Activity = ({ title, time, location, workingFrom, late }: any) => (
    <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm text-gray-600 flex gap-3 items-center">
            ⏱ {time}
            {location && <>📍 {location}</>}
            {workingFrom && <>({workingFrom})</>}
            {late && <span className="text-red-500">⚠ Late</span>}
        </div>
    </div>
)

const badge = (label: string, icon: string) => (
    <span className="flex items-center gap-1 px-2 py-1 border rounded text-xs">
        {icon} {label}
    </span>
)

function calcDuration(start: string, end: string) {
    const s = new Date(`1970-01-01T${start}`)
    const e = new Date(`1970-01-01T${end}`)
    const diff = (e.getTime() - s.getTime()) / 1000
    const h = Math.floor(diff / 3600)
    const m = Math.floor((diff % 3600) / 60)
    return `${h}h ${m}m`
}
