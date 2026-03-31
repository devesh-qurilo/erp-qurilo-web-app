"use client"

type TabKey = "profile" | "work" | "documents" | "emergency" | "promotions"

interface Props {
    activeTab: TabKey
    onChange: (tab: TabKey) => void
}

export default function EmployeeTabs({ activeTab, onChange }: Props) {
    const tabs: { key: TabKey; label: string }[] = [
        { key: "profile", label: "Profile" },
        { key: "work", label: "Work" },
        { key: "documents", label: "Documents" },
        { key: "emergency", label: "Emergency Contacts" },
        { key: "promotions", label: "Promotions" },
    ]

    return (
        <div className="border-b flex gap-6">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => onChange(tab.key)}
                    className={`pb-2 text-sm font-medium transition
            ${activeTab === tab.key
                            ? "border-b-2 border-blue-600 text-blue-600"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    )
}

