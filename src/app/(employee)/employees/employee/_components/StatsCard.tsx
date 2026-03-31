export default function StatsCard({ title, pending, overdue }: any) {
  return (
    <div className="bg-white p-4 rounded-lg shadow border">
      <h4 className="font-semibold text-gray-800 mb-3">{title}</h4>

      <div className="space-y-2">
        <div className="flex justify-between">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-blue-600 text-base font-semibold">{pending}</p>
        </div>

        <div className="flex justify-between">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="text-red-600 text-base font-semibold">{overdue}</p>
        </div>
      </div>
    </div>
  );
}
