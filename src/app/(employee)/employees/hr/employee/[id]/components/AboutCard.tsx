export default function AboutCard({ about }: { about: string }) {
    return (
        <div className="border rounded-lg p-4 bg-white">
            <h3 className="font-medium mb-2">About</h3>
            <p className="text-sm text-gray-600">
                {about || "—"}
            </p>
        </div>
    )
}
