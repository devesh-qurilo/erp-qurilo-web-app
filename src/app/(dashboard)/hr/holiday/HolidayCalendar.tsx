import type { Holiday } from "./api";

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
  const formatKey = (date: string) => {
    return new Date(date).toISOString().slice(0, 10); // YYYY-MM-DD
  };

  holidays.forEach((holiday) => {
    const key = formatKey(holiday.date);

    holidayMap[key] = holidayMap[key]
      ? [...holidayMap[key], holiday]
      : [holiday];
  });
  console.log("calender ", holidayMap);

  const cells: Array<number | null> = [];

  for (let i = 0; i < startDay; i += 1) cells.push(null);
  for (let day = 1; day <= totalDays; day += 1) cells.push(day);

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="grid grid-cols-7 bg-gray-100 text-center text-sm font-medium">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="border-r py-2 last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, index) => {
          if (!day) {
            return <div key={index} className="h-28 border" />;
          }

          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayHolidays = holidayMap[dateStr] || [];

          return (
            <div key={index} className="h-28 border p-1 text-sm">
              <div className="font-semibold">{day}</div>

              {dayHolidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className={`mt-1 truncate rounded px-1 py-0.5 text-xs ${holiday.isActive ? "bg-blue-100 text-blue-800" : "bg-gray-200 text-gray-500 line-through"}`}
                  title={holiday.occasion}
                >
                  {holiday.occasion}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
