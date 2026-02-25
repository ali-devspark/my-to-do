"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
    LayoutList,
    Users,
    LogOut,
    Menu,
    X,
    Plus,
    Home
} from "lucide-react";

export function Sidebar() {
    const { logout, user } = useAuth();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const toggleSidebar = () => setIsOpen(!isOpen);

    const navItems = [
        {
            name: "المهام العادية",
            href: "/",
            icon: <LayoutList size={20} />,
        },
        {
            name: "المهام المشتركة",
            href: "/shared",
            icon: <Users size={20} />,
        },
    ];

    const NavContent = () => (
        <div className="flex flex-col h-full bg-[#0f172a] text-white border-l border-white/10 w-64">
            <div className="p-6">
                <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-purple-500">
                    MyTO-DO
                </h1>
                <p className="text-slate-400 text-xs mt-2 truncate">
                    {user?.displayName || user?.email}
                </p>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            {item.icon}
                            <span className="font-bold">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/10">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                >
                    <LogOut size={20} />
                    <span className="font-bold">تسجيل الخروج</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 bg-[#0f172a] border-b border-white/10 sticky top-0 z-40">
                <h1 className="text-xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-purple-500">
                    MyTO-DO
                </h1>
                <button
                    onClick={toggleSidebar}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex fixed top-0 right-0 h-screen z-30">
                <NavContent />
            </aside>

            {/* Mobile Drawer Overlay */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-all"
                    onClick={toggleSidebar}
                >
                    <div
                        className="fixed top-0 right-0 h-full transition-transform duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative h-full">
                            <button
                                onClick={toggleSidebar}
                                className="absolute top-4 left-[-48px] p-2 bg-[#0f172a] border border-white/10 rounded-full text-white shadow-xl"
                            >
                                <X size={24} />
                            </button>
                            <NavContent />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
