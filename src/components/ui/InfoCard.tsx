// src/components/ui/InfoCard.tsx
import { Cake, Plane, Home } from "lucide-react";
import React from "react";

interface InfoCardProps {
  title: string;
  icon: "birthday" | "leave" | "wfh";
}

export default function InfoCard({ title, icon }: InfoCardProps) {
  const iconMap: Record<string, React.ReactNode> = {
    birthday: <Cake className="w-10 h-10 text-gray-300" />,
    leave: <Plane className="w-10 h-10 text-gray-300" />,
    wfh: <Home className="w-10 h-10 text-gray-300" />,
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow flex flex-col items-center justify-center min-h-[200px]">
      <h4 className="font-semibold mb-6">{title}</h4>
      <div className="flex flex-col items-center justify-center text-gray-400">
        {iconMap[icon]}
        <p className="mt-2 text-sm">-No Record Found-</p>
      </div>
    </div>
  );
}
