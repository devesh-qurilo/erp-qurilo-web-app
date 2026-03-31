"use client";

import { useState } from "react";

export default function TimeLogModal({ selectedDate }: { selectedDate: string }) {
  return (  


<div className="p-6">
  <h2 className="text-xl font-semibold">Time log for {selectedDate}</h2>

  {/* A small form for logging hours */}
  <form className="mt-4 space-y-3">
    <div>
      <label className="block text-sm font-medium">Hours</label>
      <input
        type="number"
        className="w-full border rounded p-2"
        placeholder="Enter hours"
      />
    </div>

    <div>
      <label className="block text-sm font-medium">Notes</label>
      <textarea
        className="w-full border rounded p-2"
        placeholder="Add details..."
      />
    </div>

    <div className="flex justify-end space-x-2 mt-4">
      <button type="button" className="px-4 py-2 bg-gray-300 rounded">
        Cancel
      </button>
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
        Save
      </button>
    </div>
  </form>
</div>
    );
}
