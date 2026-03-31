
export default function HolidayCalendar({
    holidays,
    year,
    month,
}: {
    holidays: Holiday[];
    year: number;
    month: number;
}) {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    const startDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const holidayMap: Record<string, Holiday[]> = {};
    holidays.forEach(h => {
        holidayMap[h.date] = holidayMap[h.date]
            ? [...holidayMap[h.date], h]
            : [h];
    });

    const cells = [];

    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);

    return (
        <div className="border rounded-lg overflow-hidden">
            {/* DAYS HEADER */}
            <div className="grid grid-cols-7 bg-gray-100 text-center text-sm font-medium">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                    <div key={d} className="py-2 border-r">{d}</div>
                ))}
            </div>

            {/* CALENDAR GRID */}
            <div className="grid grid-cols-7">
                {cells.map((day, i) => {
                    if (!day)
                        return <div key={i} className="h-28 border" />;

                    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const dayHolidays = holidayMap[dateStr] || [];

                    return (
                        <div key={i} className="h-28 border p-1 text-sm">
                            <div className="font-semibold">{day}</div>

                            {dayHolidays.map(h => (
                                <div
                                    key={h.id}
                                    className="mt-1 px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs truncate"
                                    title={h.occasion}
                                >
                                    {h.occasion}
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}