"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { useCreateBulkHolidaysMutation } from "../api"

interface NewHoliday {
  date: string
  occasion: string
}

const emptyHoliday = (): NewHoliday => ({ date: "", occasion: "" })

export default function AddHolidayPage() {
  const router = useRouter()
  const [newHolidays, setNewHolidays] = useState<NewHoliday[]>([emptyHoliday()])
  const [message, setMessage] = useState("")

  const createBulkMutation = useCreateBulkHolidaysMutation({
    onSuccess: () => {
      setMessage("Holidays created successfully")
      setNewHolidays([emptyHoliday()])
      router.push("/hr/holiday")
    },
  })

  const handleHolidayChange = (index: number, field: keyof NewHoliday, value: string) => {
    setNewHolidays((current) =>
      current.map((holiday, holidayIndex) =>
        holidayIndex === index ? { ...holiday, [field]: value } : holiday
      )
    )
  }

  const addHolidayRow = () => setNewHolidays((current) => [...current, emptyHoliday()])
  const removeHolidayRow = (index: number) => setNewHolidays((current) => current.filter((_, i) => i !== index))

  const handleSubmit = async () => {
    setMessage("")
    const validHolidays = newHolidays.filter((holiday) => holiday.date && holiday.occasion.trim())

    if (!validHolidays.length) {
      setMessage("At least one holiday is required")
      return
    }

    try {
      await createBulkMutation.mutateAsync(validHolidays)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to create holidays")
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="mb-4 text-xl font-bold">Add New Holidays</h1>

      {newHolidays.map((holiday, index) => (
        <div key={index} className="mb-2 flex gap-2">
          <input
            type="date"
            value={holiday.date}
            onChange={(e) => handleHolidayChange(index, "date", e.target.value)}
            className="rounded border p-2"
          />
          <input
            type="text"
            value={holiday.occasion}
            onChange={(e) => handleHolidayChange(index, "occasion", e.target.value)}
            placeholder="Occasion"
            className="flex-1 rounded border p-2"
          />
          {newHolidays.length > 1 ? (
            <button type="button" onClick={() => removeHolidayRow(index)} className="rounded bg-red-500 px-3 text-white">
              ✕
            </button>
          ) : null}
        </div>
      ))}

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={addHolidayRow} className="rounded bg-green-500 px-4 py-2 text-white">
          + Add Row
        </button>
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={createBulkMutation.isPending}
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          {createBulkMutation.isPending ? "Submitting..." : "Submit"}
        </button>
      </div>

      {message ? <p className="mt-4 text-sm">{message}</p> : null}
    </div>
  )
}
