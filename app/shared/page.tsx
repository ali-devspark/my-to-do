"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { taskService, Task } from "@/lib/taskService";
import { categoryService, Category } from "@/lib/categoryService";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    GripVertical,
    CheckCircle2,
    Circle,
    Trash2,
    Edit2,
    Check,
    Plus,
    X,
    GripHorizontal,
    Share2,
    Download,
    Users,
    Copy,
    Link as LinkIcon,
    Home as HomeIcon,
} from "lucide-react";
import Link from "next/link";
import { userService, UserProfile } from "@/lib/userService";

const ACCENT_COLORS = [
    { bg: "bg-blue-500", btn: "bg-blue-600 hover:bg-blue-500", ring: "focus:ring-blue-500", border: "border-blue-500/30" },
    { bg: "bg-purple-500", btn: "bg-purple-600 hover:bg-purple-500", ring: "focus:ring-purple-500", border: "border-purple-500/30" },
    { bg: "bg-emerald-500", btn: "bg-emerald-600 hover:bg-emerald-500", ring: "focus:ring-emerald-500", border: "border-emerald-500/30" },
    { bg: "bg-amber-500", btn: "bg-amber-600 hover:bg-amber-500", ring: "focus:ring-amber-500", border: "border-amber-500/30" },
    { bg: "bg-rose-500", btn: "bg-rose-600 hover:bg-rose-500", ring: "focus:ring-rose-500", border: "border-rose-500/30" },
    { bg: "bg-cyan-500", btn: "bg-cyan-600 hover:bg-cyan-500", ring: "focus:ring-cyan-500", border: "border-cyan-500/30" },
];

export default function SharedPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    const [joinCode, setJoinCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(MouseSensor),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            const unsub = categoryService.subscribeToSharedCategories(user.uid, setCategories);
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
        } catch (err: any) {
            setError(err.message || "فشل الانضمام للتصنيف");
        }
    };

    const handleDeleteCategory = async (categoryId: string) => {
        try {
            // In a shared context, "delete" might mean "leave" if you are not the owner
            // But for now, let's stick to the service's deleteCategory which deletes the document.
            // Better: if isShared and not owner, just remove from members.
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

    const handleCategoryDragEnd = async (event: DragEndEvent) => {
        // Shared categories reordering is tricky if they are from different users.
        // For now, let's keep it simple.
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 font-sans" dir="rtl">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl transition-all border border-white/10">
                            <HomeIcon size={24} />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-emerald-400 to-cyan-500">
                                التصنيفات المشتركة
                            </h1>
                            <p className="text-slate-400 mt-2">تعاون مع زملائك في إنجاز المهام</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg transition-all text-sm"
                    >
                        تسجيل الخروج
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                        />
                    ))}

                    {/* Actions Card: Join or Create */}
                    <div className="bg-white/5 backdrop-blur-md border-2 border-dashed border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[220px] gap-6">
                        {!isAddingCategory && !isJoining ? (
                            <>
                                <button
                                    onClick={() => setIsAddingCategory(true)}
                                    className="w-full flex items-center gap-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 p-4 rounded-2xl transition-all group"
                                >
                                    <div className="bg-emerald-500 p-2 rounded-xl text-white group-hover:scale-110 transition-transform">
                                        <Plus size={20} />
                                    </div>
                                    <span className="font-bold">إنشاء تصنيف مشترك جديد</span>
                                </button>
                                <button
                                    onClick={() => setIsJoining(true)}
                                    className="w-full flex items-center gap-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 p-4 rounded-2xl transition-all group"
                                >
                                    <div className="bg-blue-500 p-2 rounded-xl text-white group-hover:scale-110 transition-transform">
                                        <LinkIcon size={20} />
                                    </div>
                                    <span className="font-bold">انضمام عبر رمز</span>
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
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleAddCategory();
                                        if (e.key === "Escape") setIsAddingCategory(false);
                                    }}
                                    placeholder="اسم التصنيف..."
                                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-center"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleAddCategory}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-2 rounded-xl font-bold transition-all"
                                    >
                                        إنشاء
                                    </button>
                                    <button
                                        onClick={() => { setIsAddingCategory(false); setNewCategoryName(""); }}
                                        className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all"
                                    >
                                        <X size={20} />
                                    </button>
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
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleJoinCategory();
                                        if (e.key === "Escape") { setIsJoining(false); setError(null); }
                                    }}
                                    placeholder="أدخل الرمز (مثلاً: A1B2C3D4)..."
                                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center uppercase"
                                />
                                {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleJoinCategory}
                                        className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded-xl font-bold transition-all"
                                    >
                                        انضمام
                                    </button>
                                    <button
                                        onClick={() => { setIsJoining(false); setJoinCode(""); setError(null); }}
                                        className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
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
}

function CategoryCard({
    category,
    accentIndex,
    userId,
    isDeleting,
    onRequestDelete,
    onCancelDelete,
    onConfirmDelete,
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
        // Shared tasks sub: no userId filter
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

    const deleteTask = async (id: string) => {
        try {
            await taskService.deleteTask(id);
        } catch (err) {
            console.error("Failed to delete task:", err);
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

    const handleUpdateTask = async (taskId: string, title: string) => {
        try {
            await taskService.updateTask(taskId, { title });
        } catch (err) {
            console.error("Failed to update task:", err);
        }
    };

    return (
        <section className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col h-fit relative ${isDeleting ? accent.border : ""}`}>

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
                                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold overflow-hidden">
                                            {profile?.photoURL ? (
                                                <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" />
                                            ) : (
                                                (profile?.name || "م").substring(0, 1).toUpperCase()
                                            )}
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
                    <div className="flex items-center gap-1 animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={onConfirmDelete}
                            className="bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 text-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                        >
                            {category.userId === userId ? "تأكيد الحذف" : "تأكيد المغادرة"}
                        </button>
                        <button
                            onClick={onCancelDelete}
                            className="bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-all"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* Title Header */}
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
                            <p className="text-[10px] text-slate-500">
                                بواسطة: {category.userId === userId ? "أنت" : "زميل"}
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Add task input */}
            <div className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="أضف مهمة مشتركة..."
                    className={`flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ${accent.ring} transition-all`}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddTask(); }}
                />
                <button
                    onClick={handleAddTask}
                    className={`${accent.btn} px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95`}
                >
                    +
                </button>
            </div>

            {/* Task list */}
            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar" dir="rtl">
                <div className="space-y-3">
                    {activeTasks.map((task) => (
                        <TaskItem
                            key={task.id!}
                            task={task}
                            onToggle={() => toggleComplete(task)}
                            onDelete={() => deleteTask(task.id!)}
                            onUpdate={(title) => handleUpdateTask(task.id!, title)}
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
                                    onDelete={() => deleteTask(task.id!)}
                                    onUpdate={(title) => handleUpdateTask(task.id!, title)}
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
    onDelete,
    onUpdate
}: {
    task: Task;
    onToggle: () => void;
    onDelete: () => void;
    onUpdate: (title: string) => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(task.title);

    const handleSave = () => {
        if (editValue.trim() && editValue !== task.title) {
            onUpdate(editValue.trim());
        }
        setIsEditing(false);
    };

    return (
        <div className={`group flex items-center justify-between p-4 rounded-2xl border transition-all ${task.completed ? 'bg-emerald-500/5 border-emerald-500/20 opacity-70' : 'bg-[#1e293b] border-white/10 hover:border-white/30'} overflow-hidden`}>
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <button
                    onClick={onToggle}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500 hover:border-white'} shrink-0`}
                >
                    {task.completed ? <CheckCircle2 size={16} className="text-white" /> : <Circle className="w-4 h-4 text-transparent" />}
                </button>

                {isEditing ? (
                    <textarea
                        autoFocus
                        rows={1}
                        className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded px-2 py-1 text-lg text-slate-100 focus:outline-none resize-none overflow-hidden"
                        value={editValue}
                        onChange={(e) => {
                            setEditValue(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        onBlur={handleSave}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSave();
                            }
                            if (e.key === "Escape") {
                                setEditValue(task.title);
                                setIsEditing(false);
                            }
                        }}
                    />
                ) : (
                    <span className={`text-lg flex-1 wrap-break-word ${task.completed ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                        {task.title}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
                {!isEditing && !task.completed && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-blue-400 p-2 transition-all"
                    >
                        <Edit2 size={18} />
                    </button>
                )}
                <button
                    onClick={onDelete}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-2 transition-all"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}
