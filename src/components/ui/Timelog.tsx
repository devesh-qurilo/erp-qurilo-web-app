
export default function Timelog() {
  return (
    <div>
      <h3 className="font-semibold mb-4">My Timelogs</h3>
      <div className="flex gap-3 mb-3">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <span key={d} className="px-2 py-1 rounded-full bg-gray-100 text-sm">
            {d}
          </span>
        ))}
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full w-2/3 bg-purple-500"></div>
        <div className="h-full w-1/6 bg-yellow-400"></div>
      </div>
      <div className="flex justify-between text-sm text-gray-500 mt-2">
        <p>Duration: 4hrs</p>
        <p>Break: 30 mins</p>
      </div>
    </div>
  );
}
