"use client";

import { useState } from "react";
import { Eye, MoreVertical, View } from "lucide-react";

interface Props {
    status: string;
    onView: () => void;
    onApprove?: () => void;
    onReject?: () => void;
    onDelete: () => void;
    loading?: boolean;
}

export default function LeaveActionMenu({
    status,
    onView,
    onApprove,
    onReject,
    onDelete,
    loading,
}: Props) {
    const [open, setOpen] = useState(false);


    return (
        <div className="relative">
            <Eye className="text-right    w-4 h-4"
                // onClick={() => setOpen((s) => !s)}
                  onClick={() => {

                            setOpen(false);
                            onView();
                        }}
                // className="p-2 rounded hover:bg-gray-100"
            >

  {/* <View className=" w-8 h-8"
                        onClick={() => {

                            setOpen(false);
                            onView();
                        }}
                        
                    >
                        View
                    </View> */}


                {/* <MoreVertical className="w-4 h-4" /> */}
            </Eye>

            {open && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-md z-50">
                    {/* <View
                        onClick={() => {

                            setOpen(false);
                            onView();
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                    >
                        View
                    </View> */}

                    {status === "PENDING" && (
                        <>
                            {/* <button
                                disabled={loading}
                                onClick={() => {
                                    setOpen(false);
                                    onApprove?.();
                                }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-green-600"
                            >
                                Approve
                            </button> */}

                            {/* <button
                                disabled={loading}
                                onClick={() => {
                                    setOpen(false);
                                    onReject?.();
                                }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600"
                            >
                                Reject
                            </button> */}
                        </>
                    )}

                    <div className="border-t my-1" />

                    {/* <button
                        onClick={() => {
                            setOpen(false);
                            onDelete();
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600"
                    >
                        Delete 
                    </button> */}
                </div>
            )}
        </div>
    );
}
