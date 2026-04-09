"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { taskService, Task } from "@/lib/taskService";
import { categoryService, Category } from "@/lib/categoryService";

import {
    CheckCircle2,
    Circle,
    Trash2,
    Edit2,
    Check,
    Plus,
    X,
    Share2,
    Users,
    Copy,
    Link as LinkIcon,
} from "lucide-react";
import { userService, UserProfile } from "@/lib/userService";
import TaskDetailsModal from "@/components/TaskDetailsModal";

const ACCENT_COLORS = [
    { bg: "bg-blue-500", btn: "bg-blue-600 hover:bg-blue-500", ring: "focus:ring-blue-500", border: "border-blue-500/30" },
    { bg: "bg-purple-500", btn: "bg-purple-600 hover:bg-purple-500", ring: "focus:ring-purple-500", border: "border-purple-500/30" },
    { bg: "bg-emerald-500", btn: "bg-emerald-600 hover:bg-emerald-500", ring: "focus:ring-emerald-500", border: "border-emerald-500/30" },
    { bg: "bg-amber-500", btn: "bg-amber-600 hover:bg-amber-500", ring: "focus:ring-amber-500", border: "border-amber-500/30" },
    { bg: "bg-rose-500", btn: "bg-rose-600 hover:bg-rose-500", ring: "focus:ring-rose-500", border: "border-rose-500/30" },
    { bg: "bg-cyan-500", btn: "bg-cyan-600 hover:bg-cyan-500", ring: "focus:ring-cyan-500", border: "border-cyan-500/30" },
];

export default function SharedPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    const [joinCode, setJoinCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [tempTitle, setTempTitle] = useState("");
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
    const [isAddingTaskMobile, setIsAddingTaskMobile] = useState(false);
    const [newTaskMobile, setNewTaskMobile] = useState("");


    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            const unsub = categoryService.subscribeToSharedCategories(user.uid, (cats) => {
                // Sort categories by creation time to ensure newest appear last
                const sortedCats = [...cats].sort((a, b) => {
                    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                    return timeA - timeB;
                });
                setCategories(sortedCats);
                if (cats.length > 0) {
                    setActiveCategoryId(prev => prev || sortedCats[0].id!);
                }
            });
            return () => unsub();
        }
    }, [user]);

    const handleAddCategory = async () => {
        if (!user || !newCategoryName.trim()) return;
        try {
            await categoryService.addCategory(user.uid, newCategoryName.trim(), categories.length, true);
            setNewCategoryName("");
            setIsAddingCategory(false);
        } catch (err) {
            console.error("Failed to add category:", err);
        }
    };

    const handleJoinCategory = async () => {
        if (!user || !joinCode.trim()) return;
        try {
            setError(null);
            await categoryService.joinCategoryByCode(user.uid, joinCode.trim());
            setJoinCode("");
            setIsJoining(false);
        } catch (err: unknown) {
            const error = err as Error & { message?: string };
            setError(error.message || "فشل الانضمام للتصنيف");
        }
    };

    const handleDeleteCategory = async (categoryId: string) => {
        try {
            const category = categories.find(c => c.id === categoryId);
            if (category && category.userId !== user?.uid) {
                const newMembers = (category.members || []).filter(m => m !== user?.uid);
                await categoryService.updateCategory(categoryId, { members: newMembers });
            } else {
                await categoryService.deleteCategory(categoryId);
            }
            setDeletingCategoryId(null);
        } catch (err) {
            console.error("Failed to delete/leave category:", err);
        }
    };

    const handleAddTaskMobile = async () => {
        if (!newTaskMobile.trim() || !activeCategoryId || activeCategoryId === "actions") return;
        try {
            await taskService.addTask(user!.uid, newTaskMobile.trim(), activeCategoryId, 999);
            setNewTaskMobile("");
            setIsAddingTaskMobile(false);
        } catch (err) {
            console.error("Failed to add task on mobile:", err);
        }
    };

    if (loading || !user) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="max-w-[2200px] mx-auto px-4 pb-20 sm:pb-0 relative min-h-screen">
            {/* Mobile Tab Navigation */}
            <div className="md:hidden flex overflow-x-auto no-scrollbar gap-2 mb-6 py-2 -mx-4 px-4 sticky top-[73px] z-20 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/10">
                {categories.map((category, index) => {
                    const isEditing = editingCategoryId === category.id;

                    const handleStart = () => {
                        const timer = setTimeout(() => {
                            setEditingCategoryId(category.id!);
                            setTempTitle(category.name);
                        }, 600);
                        setLongPressTimer(timer);
                    };

                    const handleEnd = () => {
                        if (longPressTimer) clearTimeout(longPressTimer);
                    };

                    const saveTitle = async () => {
                        if (tempTitle.trim() && tempTitle !== category.name) {
                            try {
                                await categoryService.updateCategory(category.id!, { name: tempTitle.trim() });
                            } catch (err) {
                                console.error("Failed to update category name:", err);
                            }
                        }
                        setEditingCategoryId(null);
                    };

                    return (
                        <div key={category.id!} className="relative shrink-0">
                            {isEditing ? (
                                <div className="flex items-center gap-1">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={tempTitle}
                                        onChange={(e) => setTempTitle(e.target.value)}
                                        onBlur={() => {
                                            // Delay blur to allow button click to register
                                            setTimeout(() => setEditingCategoryId(null), 200);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") saveTitle();
                                            if (e.key === "Escape") setEditingCategoryId(null);
                                        }}
                                        className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-28"
                                    />
                                    <button
                                        onMouseDown={(e) => { 
                                            e.preventDefault(); // Prevent blur before save
                                            saveTitle(); 
                                        }}
                                        className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg active:scale-90 transition-transform shrink-0"
                                    >
                                        <Check size={16} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => {
                                        setActiveCategoryId(category.id!);
                                        setIsAddingCategory(false);
                                        setIsJoining(false);
                                    }}
                                    onPointerDown={handleStart}
                                    onPointerUp={handleEnd}
                                    onPointerLeave={handleEnd}
                                    className={`px-4 py-2 rounded-xl whitespace-nowrap font-bold transition-all text-sm flex items-center gap-2 ${
                                        activeCategoryId === category.id 
                                            ? `${ACCENT_COLORS[index % ACCENT_COLORS.length].bg} text-white shadow-lg` 
                                            : "bg-white/5 text-slate-400 hover:bg-white/10"
                                    }`}
                                >
                                    {category.name}
                                </button>
                            )}
                        </div>
                    );
                })}
                <button
                    onClick={() => {
                        setIsAddingCategory(false);
                        setIsJoining(false);
                        setActiveCategoryId("actions");
                    }}
                    className={`px-4 py-2 rounded-xl whitespace-nowrap font-bold transition-all text-sm flex items-center gap-2 ${
                        activeCategoryId === "actions"
                            ? "bg-emerald-500 text-white shadow-lg"
                            : "bg-white/5 text-slate-400 hover:bg-white/10"
                    }`}
                >
                    <Plus size={16} />
                    خيارات إضافية
                </button>
            </div>

            <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                {categories.map((category, index) => (
                    <CategoryCard
                        key={category.id!}
                        category={category}
                        accentIndex={index % ACCENT_COLORS.length}
                        userId={user.uid}
                        isDeleting={deletingCategoryId === category.id}
                        onRequestDelete={() => setDeletingCategoryId(category.id!)}
                        onCancelDelete={() => setDeletingCategoryId(null)}
                        onConfirmDelete={() => handleDeleteCategory(category.id!)}
                        onSelectTask={setSelectedTask}
                    />
                ))}

                {/* Desktop Shared Actions Card */}
                <div className="bg-white/5 backdrop-blur-md border-2 border-dashed border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[300px] gap-6 animate-in zoom-in-95 duration-300">
                    {!isAddingCategory && !isJoining ? (
                        <>
                            <button
                                onClick={() => setIsAddingCategory(true)}
                                className="w-full flex items-center gap-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 p-4 rounded-2xl transition-all group"
                            >
                                <div className="bg-emerald-500 p-2 rounded-xl text-white group-hover:scale-110 transition-transform">
                                    <Plus size={24} />
                                </div>
                                <span className="font-bold text-slate-100">إنشاء تصنيف مشترك جديد</span>
                            </button>
                            <button
                                onClick={() => setIsJoining(true)}
                                className="w-full flex items-center gap-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 p-4 rounded-2xl transition-all group"
                            >
                                <div className="bg-blue-500 p-2 rounded-xl text-white group-hover:scale-110 transition-transform">
                                    <LinkIcon size={24} />
                                </div>
                                <span className="font-bold text-slate-100">انضمام عبر رمز</span>
                            </button>
                        </>
                    ) : isAddingCategory ? (
                        <div className="w-full space-y-4">
                            <h3 className="text-center font-bold text-lg">إنشاء تصنيف مشترك</h3>
                            <input
                                autoFocus
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                            />
                            <div className="flex gap-2">
                                <button onClick={handleAddCategory} className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-2 rounded-xl font-bold transition-all">إنشاء</button>
                                <button onClick={() => setIsAddingCategory(false)} className="bg-white/10 px-4 py-2 rounded-xl transition-all"><X /></button>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full space-y-4">
                            <h3 className="text-center font-bold text-lg">انضمام لتصنيف</h3>
                            <input
                                autoFocus
                                type="text"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center uppercase"
                                onKeyDown={(e) => e.key === "Enter" && handleJoinCategory()}
                            />
                            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                            <div className="flex gap-2">
                                <button onClick={handleJoinCategory} className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded-xl font-bold transition-all">انضمام</button>
                                <button onClick={() => setIsJoining(false)} className="bg-white/10 px-4 py-2 rounded-xl transition-all"><X /></button>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* Mobile View Active Category */}
            <div className="md:hidden">
                {activeCategoryId === "actions" ? (
                    <div className="bg-white/5 backdrop-blur-md border-2 border-dashed border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[220px] gap-6 animate-in slide-in-from-bottom-4 duration-300">
                        {!isAddingCategory && !isJoining ? (
                            <>
                                <button
                                    onClick={() => setIsAddingCategory(true)}
                                    className="w-full flex items-center gap-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 p-4 rounded-2xl transition-all group"
                                >
                                    <div className="bg-emerald-500 p-2 rounded-xl text-white group-hover:scale-110 transition-transform">
                                        <Plus size={20} />
                                    </div>
                                    <span className="font-bold text-slate-100">إنشاء تصنيف مشترك جديد</span>
                                </button>
                                <button
                                    onClick={() => setIsJoining(true)}
                                    className="w-full flex items-center gap-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 p-4 rounded-2xl transition-all group"
                                >
                                    <div className="bg-blue-500 p-2 rounded-xl text-white group-hover:scale-110 transition-transform">
                                        <LinkIcon size={20} />
                                    </div>
                                    <span className="font-bold text-slate-100">انضمام عبر رمز</span>
                                </button>
                                <button
                                    onClick={() => setActiveCategoryId(categories[0]?.id || null)}
                                    className="text-slate-500 hover:text-white text-sm"
                                >
                                    العودة للتصنيفات
                                </button>
                            </>
                        ) : isAddingCategory ? (
                            <div className="w-full space-y-4">
                                <h3 className="text-center font-bold text-lg">إنشاء تصنيف مشترك</h3>
                                <input
                                    autoFocus
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                                />
                                <div className="flex gap-2">
                                    <button onClick={handleAddCategory} className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-2 rounded-xl font-bold">إنشاء</button>
                                    <button onClick={() => setIsAddingCategory(false)} className="bg-white/10 px-4 py-2 rounded-xl"><X /></button>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full space-y-4">
                                <h3 className="text-center font-bold text-lg">انضمام لتصنيف</h3>
                                <input
                                    autoFocus
                                    type="text"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center uppercase"
                                />
                                {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                                <div className="flex gap-2">
                                    <button onClick={handleJoinCategory} className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded-xl font-bold">انضمام</button>
                                    <button onClick={() => setIsJoining(false)} className="bg-white/10 px-4 py-2 rounded-xl"><X /></button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    categories.map((category, index) => (
                        activeCategoryId === category.id && (
                            <div key={category.id!} className="animate-in slide-in-from-right-4 duration-300">
                                <CategoryCard
                                    category={category}
                                    accentIndex={index % ACCENT_COLORS.length}
                                    userId={user.uid}
                                    isDeleting={deletingCategoryId === category.id}
                                    onRequestDelete={() => setDeletingCategoryId(category.id!)}
                                    onCancelDelete={() => setDeletingCategoryId(null)}
                                    onConfirmDelete={() => handleDeleteCategory(category.id!)}
                                    onSelectTask={setSelectedTask}
                                    hideTitle={true}
                                />
                            </div>
                        )
                    ))
                )}
            </div>

            {selectedTask && (
                <TaskDetailsModal 
                    task={selectedTask} 
                    onClose={() => setSelectedTask(null)} 
                />
            )}

            {/* Mobile Add Task FAB */}
            <div className="md:hidden">
                {activeCategoryId !== "actions" && (
                    <button
                        onClick={() => setIsAddingTaskMobile(true)}
                        className="fixed bottom-10 right-6 z-50 w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform hover:bg-blue-500"
                    >
                        <Plus size={32} />
                    </button>
                )}
            </div>

            {/* Mobile Add Task Modal */}
            {isAddingTaskMobile && (
                <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all animate-in fade-in duration-300" onClick={() => setIsAddingTaskMobile(false)}>
                    <div className="bg-[#1e293b] w-full max-w-sm rounded-[2.5rem] p-8 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Plus className="text-blue-400" size={24} />
                                إضافة مهمة مشتركة
                            </h3>
                            <button onClick={() => setIsAddingTaskMobile(false)} className="text-slate-400 hover:text-white p-2">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="space-y-6">
                            <input
                                autoFocus
                                type="text"
                                value={newTaskMobile}
                                onChange={(e) => setNewTaskMobile(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddTaskMobile()}
                                placeholder="ما هي المهمة المشتركة؟"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg"
                            />
                            <button
                                onClick={handleAddTaskMobile}
                                disabled={!newTaskMobile.trim()}
                                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 py-4 rounded-2xl font-bold text-white transition-all shadow-lg active:scale-95"
                            >
                                إضافة المهمة
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

/* ─── Category Card (Simplified from Home) ─── */

interface CategoryCardProps {
    category: Category;
    accentIndex: number;
    userId: string;
    isDeleting: boolean;
    onRequestDelete: () => void;
    onCancelDelete: () => void;
    onConfirmDelete: () => void;
    onSelectTask: (task: Task) => void;
    hideTitle?: boolean;
}

function CategoryCard({
    category,
    accentIndex,
    userId,
    isDeleting,
    onRequestDelete,
    onCancelDelete,
    onConfirmDelete,
    onSelectTask,
    hideTitle = false,
}: CategoryCardProps) {
    const accent = ACCENT_COLORS[accentIndex];
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTask, setNewTask] = useState("");
    const [title, setTitle] = useState(category.name);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [showMembers, setShowMembers] = useState(false);
    const [memberProfiles, setMemberProfiles] = useState<UserProfile[]>([]);
    const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);

    useEffect(() => {
        const unsub = taskService.subscribeToTasks(category.id!, setTasks);
        return () => unsub();
    }, [category.id]);

    useEffect(() => {
        if (showMembers && category.members && category.members.length > 0) {
            const fetchProfiles = async () => {
                setIsLoadingProfiles(true);
                try {
                    const profiles = await userService.getProfiles(category.members!);
                    setMemberProfiles(profiles);
                } catch (err) {
                    console.error("Error fetching member profiles:", err);
                } finally {
                    setIsLoadingProfiles(false);
                }
            };
            fetchProfiles();
        }
    }, [showMembers, category.members]);

    const activeTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
    const completedTasks = useMemo(() => tasks.filter((t) => t.completed), [tasks]);

    const handleAddTask = async () => {
        if (!newTask.trim()) return;
        try {
            await taskService.addTask(userId, newTask.trim(), category.id!, tasks.length);
            setNewTask("");
        } catch (err) {
            console.error("Failed to add task:", err);
        }
    };

    const toggleComplete = async (task: Task) => {
        if (!task.id) return;
        try {
            await taskService.updateTask(task.id, { completed: !task.completed });
        } catch (err) {
            console.error("Failed to update task:", err);
        }
    };

    const copyShareCode = () => {
        if (!category.shareCode) return;
        navigator.clipboard.writeText(category.shareCode).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const saveTitle = async () => {
        setIsEditingTitle(false);
        if (title.trim() && title !== category.name) {
            try {
                await categoryService.updateCategory(category.id!, { name: title.trim() });
            } catch (err) {
                console.error("Failed to update category name:", err);
                setTitle(category.name);
            }
        } else {
            setTitle(category.name);
        }
    };

    return (
        <section className={`${hideTitle ? 'flex flex-col h-fit relative py-4' : 'bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col h-fit relative'} ${isDeleting ? accent.border : ""}`}>

            {/* Members Modal */}
            {showMembers && (
                <div className="absolute inset-0 z-50 bg-[#0f172a]/95 backdrop-blur-md rounded-3xl p-6 flex flex-col animate-in fade-in duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold flex items-center gap-2">
                            <Users size={20} />
                            المشاركون
                        </h3>
                        <button onClick={() => setShowMembers(false)} className="text-slate-400 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                        {isLoadingProfiles ? (
                            <div className="flex justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                            </div>
                        ) : (
                            category.members?.map((memberId) => {
                                const profile = memberProfiles.find(p => p.uid === memberId);
                                return (
                                    <div key={memberId} className="bg-white/5 p-3 rounded-xl flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-md font-bold overflow-hidden">
                                            {(profile?.name || "م").substring(0, 1).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {memberId === userId ? `${profile?.name || "أنت"} (أنت)` : (profile?.name || "مستخدم جديد")}
                                            </p>
                                            <p className="text-[10px] text-slate-500 truncate">{profile?.email}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 text-center">
                        <p className="text-xs text-slate-400 mb-2">رمز المشاركة:</p>
                        <button
                            onClick={copyShareCode}
                            className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg flex items-center justify-center gap-2 w-full hover:bg-white/10 transition-all font-mono font-bold text-emerald-400"
                        >
                            {isCopied ? <Check size={16} /> : <Copy size={16} />}
                            {category.shareCode}
                        </button>
                    </div>
                </div>
            )}

            {/* Top Action Bar */}
            <div className="flex items-center justify-between gap-2 mb-6 bg-white/5 p-2 rounded-2xl border border-white/5">
                <div className="flex gap-1 flex-1">
                    <button
                        onClick={() => setShowMembers(true)}
                        className="flex items-center justify-center gap-2 flex-1 py-2 px-3 rounded-xl transition-all text-slate-400 hover:text-white hover:bg-white/10"
                        title="عرض المشاركين"
                    >
                        <Users size={18} />
                        <span className="text-xs font-medium">المشاركين</span>
                    </button>
                    <button
                        onClick={copyShareCode}
                        className={`flex items-center justify-center gap-2 flex-1 py-2 px-3 rounded-xl transition-all ${isCopied ? 'text-emerald-400 bg-emerald-400/20' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                        title="نسخ رمز المشاركة"
                    >
                        {isCopied ? <Check size={18} /> : <Share2 size={18} />}
                        <span className="text-xs font-medium">الرمز</span>
                    </button>
                </div>

                <div className="border-r border-white/10 h-6 mx-1"></div>

                {!isDeleting ? (
                    <button
                        onClick={onRequestDelete}
                        className="flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                        title={category.userId === userId ? "حذف التصنيف" : "مغادرة التصنيف"}
                    >
                        {category.userId === userId ? <Trash2 size={18} /> : <X size={18} />}
                    </button>
                ) : (
                    <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200 flex-1">
                        <button
                            onClick={onConfirmDelete}
                            className="bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 text-red-200 py-2 rounded-xl text-[10px] font-bold transition-all flex-1 text-center truncate"
                        >
                            {category.userId === userId ? "حذف" : "مغادرة"}
                        </button>
                        <button
                            onClick={onCancelDelete}
                            className="bg-white/10 hover:bg-white/20 py-2 rounded-xl text-slate-400 font-bold transition-all flex-1 text-center text-[10px]"
                        >
                            إلغاء
                        </button>
                    </div>
                )}
            </div>

            {/* Title Header */}
            {!hideTitle && (
                <div className="flex items-center gap-3 mb-6 group/title">
                    <span className={`w-1.5 h-8 ${accent.bg} rounded-full`}></span>
                    <div className="flex-1 min-w-0">
                        {isEditingTitle ? (
                            <input
                                autoFocus
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={saveTitle}
                                onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); }}
                                className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-xl font-bold w-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold flex items-center gap-2 group-hover/title:text-white transition-colors">
                                    <span className="truncate">{title}</span>
                                    <button
                                        onClick={() => setIsEditingTitle(true)}
                                        className="opacity-0 group-hover/title:opacity-100 text-slate-500 hover:text-white transition-all shrink-0"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                </h2>
                                <p className="text-[12px] text-slate-500">
                                    بواسطة: {category.userId === userId ? "أنت" : "زميل"}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Add task input (Hidden on Mobile) */}
            {!hideTitle && (
                <div className="flex gap-2 mb-6">
                    <input
                        type="text"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder="أضف مهمة مشتركة..."
                        className={`flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ${accent.ring} transition-all`}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAddTask(); }}
                    />
                    <button
                        onClick={handleAddTask}
                        className={`${accent.btn} w-12 h-12 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center shrink-0`}
                    >
                        <Plus size={20} />
                    </button>
                </div>
            )}

            {/* Task list */}
            <div className={`space-y-6 ${hideTitle ? '' : 'max-h-[400px] overflow-y-auto pr-2 custom-scrollbar'}`} dir="rtl">
                <div className="space-y-3">
                    {activeTasks.map((task) => (
                        <TaskItem
                            key={task.id!}
                            task={task}
                            onToggle={() => toggleComplete(task)}
                            onSelect={() => onSelectTask(task)}
                        />
                    ))}
                    {activeTasks.length === 0 && completedTasks.length === 0 && (
                        <p className="text-center text-slate-500 py-8 italic">لا توجد مهام بعد</p>
                    )}
                </div>

                {completedTasks.length > 0 && (
                    <div className="pt-4">
                        <h3 className="text-sm font-semibold text-slate-500 mb-3 flex items-center gap-2 border-t border-white/5 pt-4">
                            <span>المهام المكتملة</span>
                            <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs">{completedTasks.length}</span>
                        </h3>
                        <div className="space-y-3">
                            {completedTasks.map((task) => (
                                <TaskItem
                                    key={task.id!}
                                    task={task}
                                    onToggle={() => toggleComplete(task)}
                                    onSelect={() => onSelectTask(task)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

function TaskItem({
    task,
    onToggle,
    onSelect
}: {
    task: Task;
    onToggle: () => void;
    onSelect: () => void;
}) {
    return (
        <div className={`group flex items-center justify-between p-4 rounded-2xl border transition-all ${task.completed ? 'bg-emerald-500/5 border-emerald-500/20 opacity-70' : 'bg-[#1e293b] border-white/10 hover:border-white/30'} overflow-hidden`}>
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <button
                    onClick={onToggle}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500 hover:border-white'} shrink-0`}
                >
                    {task.completed ? <CheckCircle2 size={16} className="text-white" /> : <Circle className="w-4 h-4 text-transparent" />}
                </button>

                <span 
                    className={`text-lg flex-1 wrap-break-word cursor-pointer hover:underline decoration-white/30 underline-offset-4 ${task.completed ? 'line-through text-slate-400' : 'text-slate-100'}`}
                    onClick={onSelect}
                >
                    {task.title}
                </span>
            </div>
        </div>
    );
}
