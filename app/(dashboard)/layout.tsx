"use client";

import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#0f172a] text-white flex flex-col lg:flex-row-reverse" dir="rtl">
            {/* Sidebar - fixed on desktop right, drawer on mobile */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 lg:mr-64 min-h-screen">
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
