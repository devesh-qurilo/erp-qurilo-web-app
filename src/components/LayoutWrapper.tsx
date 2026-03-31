
"use client";

import { useState } from "react";


import { AppSidebar } from "@/components/app-sidebar";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {

  return (
    <div className="min-h-screen bg-gray-50  flex">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        
        {children}
      </div>
    </div>
  );
}


