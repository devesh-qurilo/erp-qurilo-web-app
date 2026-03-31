import { useState, useEffect } from "react";
import DealTabs from "./DealTabs"; // ⭐ ADD THIS

const BASE =  `${process.env.NEXT_PUBLIC_MAIN}`;

export default function DealViewModal({
    deal,
    lead,
    onClose,
}) {
    const [files, setFiles] = useState([]);

    useEffect(() => {
        loadFiles();
    }, [deal?.id]);

    const loadFiles = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) return;

            const res = await fetch(`${BASE}/deals/${deal.id}/files`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) return;
            const json = await res.json();
            setFiles(json);
        } catch { }
    };

    if (!deal) return null;

    const leadPhone =
        lead?.mobileNumber || deal.leadMobile || "--";
    const leadEmail = lead?.email || "--";
    const leadCompany = lead?.companyName || "--";

    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            <div className="fixed inset-0 flex items-start justify-center px-4 pt-10">
                <div className="max-w-5xl w-full bg-white rounded-lg shadow-lg border overflow-auto"
                    style={{ maxHeight: "92vh" }}>

                    {/* ---------------- HEADER ---------------- */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <h2 className="text-lg font-semibold">Deal #{deal.id}</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
                            ✕
                        </button>
                    </div>

                    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* ---------------- DEAL INFO ---------------- */}
                        <div className="lg:col-span-2 border rounded-lg p-4">
                            <h4 className="font-medium mb-2">Deal Information</h4>

                            <div className="text-sm text-gray-600 mb-4">
                                {deal.pipeline || "Default"} → {deal.dealStage}
                            </div>

                            <div className="grid md:grid-cols-2 grid-cols-1 gap-4 text-sm">
                                <div>
                                    <label className="text-xs text-gray-500">Deal Name</label>
                                    <p className="font-medium">{deal.title}</p>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500">Lead Contact</label>
                                    <p>{deal.leadName || "--"}</p>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500">Email</label>
                                    <p>{leadEmail}</p>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500">Company Name</label>
                                    <p>{leadCompany}</p>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500">Deal Category</label>
                                    <p>{deal.dealCategory || "--"}</p>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500">Deal Agent</label>
                                    <p>{deal?.dealAgentMeta?.name || "--"}</p>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500">Deal Watcher</label>
                                    <p>{deal?.dealWatchersMeta?.[0]?.name || "--"}</p>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500">Close Date</label>
                                    <p>{deal.expectedCloseDate || "--"}</p>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500">Deal Value</label>
                                    <p>${deal.value || 0}</p>
                                </div>
                            </div>
                        </div>

                        {/* ---------------- LEAD INFO ---------------- */}
                        <div className="border rounded-lg p-4">
                            <h4 className="font-medium mb-3">Lead Contact Details</h4>

                            <div className="text-sm space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Name</span>
                                    <span>{deal.leadName}</span>
                                </div>

                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Email</span>
                                    <span>{leadEmail}</span>
                                </div>

                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Phone</span>
                                    <span>{leadPhone}</span>
                                </div>

                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Company</span>
                                    <span>{leadCompany}</span>
                                </div>
                            </div>
                        </div>

                        {/* ---------------- DEAL TABS (FINAL) ---------------- */}
                        <div className="lg:col-span-3 border rounded-lg p-4">

                            {/* ⭐⭐ YAHI EXACT JAGAH DEALTABS ADD KARNA THA ⭐⭐ */}
                            <DealTabs
                                deal={deal}
                                files={files}
                                reloadFiles={loadFiles}
                            />

                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
