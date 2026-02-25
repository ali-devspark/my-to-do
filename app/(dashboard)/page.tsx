"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
    verticalListSortingStrategy,
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
    Users,
    Share2,
    Download,
} from "lucide-react";
import Link from "next/link";

const ACCENT_COLORS = [
    { bg: "bg-blue-500", btn: "bg-blue-600 hover:bg-blue-500", ring: "focus:ring-blue-500", border: "border-blue-500/30" },
    { bg: "bg-purple-500", btn: "bg-purple-600 hover:bg-purple-500", ring: "focus:ring-purple-500", border: "border-purple-500/30" },
    { bg: "bg-emerald-500", btn: "bg-emerald-600 hover:bg-emerald-500", ring: "focus:ring-emerald-500", border: "border-emerald-500/30" },
    { bg: "bg-amber-500", btn: "bg-amber-600 hover:bg-amber-500", ring: "focus:ring-amber-500", border: "border-amber-500/30" },
    { bg: "bg-rose-500", btn: "bg-rose-600 hover:bg-rose-500", ring: "focus:ring-rose-500", border: "border-rose-500/30" },
    { bg: "bg-cyan-500", btn: "bg-cyan-600 hover:bg-cyan-500", ring: "focus:ring-cyan-500", border: "border-cyan-500/30" },
];

export default function Home() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
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
            categoryService.initDefaultCategory(user.uid);
            const unsub = categoryService.subscribeToCategories(user.uid, setCategories);
            return () => unsub();
        }
    }, [user]);

    const handleAddCategory = async () => {
        if (!user || !newCategoryName.trim()) return;
        try {
            await categoryService.addCategory(user.uid, newCategoryName.trim(), categories.length);
            setNewCategoryName("");
            setIsAddingCategory(false);
        } catch (err) {
            console.error("Failed to add category:", err);
        }
    };

    const handleDeleteCategory = async (categoryId: string) => {
        try {
            await categoryService.deleteCategory(categoryId);
            setDeletingCategoryId(null);
        } catch (err) {
            console.error("Failed to delete category:", err);
        }
    };

    const handleCategoryDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = categories.findIndex((c) => c.id === active.id);
        const newIndex = categories.findIndex((c) => c.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            const newOrder = arrayMove(categories, oldIndex, newIndex);
            setCategories(newOrder);
            try {
                await Promise.all(
                    newOrder.map((cat, index) =>
                        categoryService.updateCategory(cat.id!, { order: index })
                    )
                );
            } catch (err) {
                console.error("Failed to reorder categories:", err);
            }
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
        <>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
                <SortableContext items={categories.map((c) => c.id!)} strategy={horizontalListSortingStrategy}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {categories.map((category, index) => (
                            <SortableCategoryCard
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

                        {/* Add Category Card */}
                        <div className="bg-white/5 backdrop-blur-md border-2 border-dashed border-white/10 rounded-3xl p-6 flex items-center justify-center min-h-[200px] hover:border-white/20 transition-all">
                            {isAddingCategory ? (
                                <div className="w-full space-y-4">
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
                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center text-lg"
                                    />
                                    <div className="flex gap-2 justify-center">
                                        <button
                                            onClick={handleAddCategory}
                                            className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-xl font-bold transition-all active:scale-95"
                                        >
                                            إضافة
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
                                <button
                                    onClick={() => setIsAddingCategory(true)}
                                    className="flex flex-col items-center gap-3 text-slate-400 hover:text-white transition-all group"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-all border border-white/10 group-hover:border-white/20">
                                        <Plus size={28} />
                                    </div>
                                    <span className="text-sm font-medium">إضافة تصنيف</span>
                                </button>
                            )}
                        </div>
                    </div>
                </SortableContext>
            </DndContext>

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
        </>
    );
}

/* ─── Sortable Category Card ─── */

interface SortableCategoryCardProps {
    category: Category;
    accentIndex: number;
    userId: string;
    isDeleting: boolean;
    onRequestDelete: () => void;
    onCancelDelete: () => void;
    onConfirmDelete: () => void;
}

function SortableCategoryCard({
    category,
    accentIndex,
    userId,
    isDeleting,
    onRequestDelete,
    onCancelDelete,
    onConfirmDelete,
}: SortableCategoryCardProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: category.id!,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 0,
        opacity: isDragging ? 0.8 : 1,
        position: "relative" as const,
    };

    return (
        <div ref={setNodeRef} style={style}>
            <CategoryCard
                category={category}
                accentIndex={accentIndex}
                userId={userId}
                isDeleting={isDeleting}
                onRequestDelete={onRequestDelete}
                onCancelDelete={onCancelDelete}
                onConfirmDelete={onConfirmDelete}
                dragHandleProps={{ ...attributes, ...listeners }}
            />
        </div>
    );
}

/* ─── Category Card ─── */

interface CategoryCardProps {
    category: Category;
    accentIndex: number;
    userId: string;
    isDeleting: boolean;
    onRequestDelete: () => void;
    onCancelDelete: () => void;
    onConfirmDelete: () => void;
    dragHandleProps: Record<string, unknown>;
}

function CategoryCard({
    category,
    accentIndex,
    userId,
    isDeleting,
    onRequestDelete,
    onCancelDelete,
    onConfirmDelete,
    dragHandleProps,
}: CategoryCardProps) {
    const accent = ACCENT_COLORS[accentIndex];
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTask, setNewTask] = useState("");
    const [title, setTitle] = useState(category.name);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [importText, setImportText] = useState("");
    const [isCopied, setIsCopied] = useState(false);

    // Sync title when category name changes from external source (e.g. Firestore)
    if (title !== category.name && !isEditingTitle) {
        setTitle(category.name);
    }

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
        const unsub = taskService.subscribeToTasks(category.id!, setTasks, userId);
        return () => unsub();
    }, [userId, category.id]);

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

    const handleTaskDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = activeTasks.findIndex((t) => t.id === active.id);
        const newIndex = activeTasks.findIndex((t) => t.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            const newOrder = arrayMove(activeTasks, oldIndex, newIndex);
            try {
                await Promise.all(
                    newOrder.map((task, index) =>
                        taskService.updateTask(task.id!, { order: index })
                    )
                );
            } catch (err) {
                console.error("Failed to reorder tasks:", err);
            }
        }
    };

    const saveTitle = useCallback(async () => {
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
    }, [title, category.name, category.id]);

    const handleShare = () => {
        const activeText = activeTasks.map(t => t.title).join("\n");
        const completedText = completedTasks.map(t => t.title).join("\n");
        const fullText = `${title}\n${activeText}${activeText && completedText ? "\n" : ""}${completedText}`;

        navigator.clipboard.writeText(fullText).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const handleImport = async () => {
        if (!importText.trim()) return;

        const lines = importText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length === 0) return;

        let startIndex = 0;
        if (lines[0] === title || (lines.length > 1 && !lines[0].startsWith("-") && !lines[0].startsWith("*"))) {
            if (lines[0] === title) startIndex = 1;
        }

        const tasksToImport = lines.slice(startIndex);

        try {
            for (const taskTitle of tasksToImport) {
                const cleanTitle = taskTitle.replace(/^[-*•\s\d.]+\s/, "");
                if (cleanTitle) {
                    await taskService.addTask(userId, cleanTitle, category.id!, tasks.length + tasksToImport.indexOf(taskTitle));
                }
            }
            setImportText("");
            setShowImport(false);
        } catch (err) {
            console.error("Failed to import tasks:", err);
        }
    };

    return (
        <section className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col h-fit ${isDeleting ? accent.border : ""}`}>
            {/* Top Action Bar */}
            <div className="flex items-center justify-between gap-2 mb-6 bg-white/5 p-2 rounded-2xl border border-white/5 overflow-hidden">
                <div className="flex gap-1 flex-1">
                    <button
                        onClick={handleShare}
                        className={`flex items-center justify-center gap-2 flex-1 py-2 px-3 rounded-xl transition-all ${isCopied ? 'text-emerald-400 bg-emerald-400/20' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                        title="نسخ المهام"
                    >
                        {isCopied ? <Check size={18} /> : <Share2 size={18} />}
                        <span className="text-xs font-medium">مشاركة</span>
                    </button>
                    <button
                        onClick={() => setShowImport(!showImport)}
                        className={`flex items-center justify-center gap-2 flex-1 py-2 px-3 rounded-xl transition-all ${showImport ? 'text-blue-400 bg-blue-400/20' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                        title="استيراد مهام"
                    >
                        <Download size={18} className="rotate-180" />
                        <span className="text-xs font-medium">استيراد</span>
                    </button>
                </div>

                <div className="border-r border-white/10 h-6 mx-1"></div>

                {!isDeleting ? (
                    <button
                        onClick={onRequestDelete}
                        className="flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                        title="حذف التصنيف"
                    >
                        <Trash2 size={18} />
                    </button>
                ) : (
                    <div className="flex items-center gap-1 animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={onConfirmDelete}
                            className="bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 text-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                        >
                            تأكيد الحذف
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
                {/* Drag handle for category */}
                <div
                    {...dragHandleProps}
                    className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-white p-1 transition-colors"
                >
                    <GripHorizontal size={20} />
                </div>
                <span className={`w-1.5 h-8 ${accent.bg} rounded-full`}></span>
                <div className="flex-1 min-w-0">
                    {isEditingTitle ? (
                        <div className="flex items-center gap-2 w-full">
                            <input
                                autoFocus
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={saveTitle}
                                onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); }}
                                className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-xl font-bold w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    ) : (
                        <h2 className="text-2xl font-bold flex items-center gap-2 group-hover/title:text-white transition-colors">
                            <span className="truncate">{title}</span>
                            <button
                                onClick={() => setIsEditingTitle(true)}
                                className="opacity-100 md:opacity-0 md:group-hover/title:opacity-100 text-slate-500 hover:text-white transition-all shrink-0"
                            >
                                <Edit2 size={16} />
                            </button>
                        </h2>
                    )}
                </div>
            </div>

            {/* Import Area */}
            {showImport && (
                <div className="mb-6 animate-in slide-in-from-top-2 duration-200">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                        <textarea
                            autoFocus
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            placeholder="الصق المهام هنا (كل مهمة في سطر)..."
                            className="w-full bg-[#0f172a]/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm min-h-[100px] resize-none"
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => { setShowImport(false); setImportText(""); }}
                                className="px-4 py-2 rounded-lg text-slate-400 hover:text-white text-sm transition-all"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={!importText.trim()}
                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-bold transition-all"
                            >
                                استيراد
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add task input */}
            <div className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="أضف مهمة جديدة..."
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
            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar" dir="rtl">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTaskDragEnd}>
                    <SortableContext items={activeTasks.map((t) => t.id!)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3">
                            {activeTasks.map((task) => (
                                <SortableTaskItem
                                    key={task.id!}
                                    id={task.id!}
                                    task={task}
                                    onToggle={() => toggleComplete(task)}
                                    onDelete={() => deleteTask(task.id!)}
                                    onUpdate={(title) => taskService.updateTask(task.id!, { title })}
                                />
                            ))}
                            {activeTasks.length === 0 && completedTasks.length === 0 && (
                                <p className="text-center text-slate-500 py-8 italic">لا توجد مهام بعد</p>
                            )}
                        </div>
                    </SortableContext>
                </DndContext>

                {/* Completed tasks */}
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
                                    onUpdate={(title) => taskService.updateTask(task.id!, { title })}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

/* ─── Sortable Task Item ─── */

interface SortableTaskItemProps {
    id: string;
    task: Task;
    onToggle: () => void;
    onDelete: () => void;
    onUpdate: (title: string) => void;
}

function SortableTaskItem({ id, task, onToggle, onDelete, onUpdate }: SortableTaskItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(task.title);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 0,
        position: "relative" as const,
    };

    const handleSave = () => {
        if (editValue.trim() && editValue !== task.title) {
            onUpdate(editValue.trim());
        }
        setIsEditing(false);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-center justify-between p-4 rounded-2xl border transition-all bg-[#1e293b] border-white/10 hover:border-white/30 ${isDragging ? 'opacity-50' : ''} overflow-hidden`}
        >
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-white p-1 shrink-0">
                    <GripVertical size={20} />
                </div>
                <button
                    onClick={onToggle}
                    className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all border-slate-500 hover:border-white shrink-0"
                >
                    <Circle className="w-4 h-4 text-transparent" />
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
                        onFocus={(e) => {
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
                    <span className="text-lg text-slate-100 flex-1 wrap-break-word">
                        {task.title}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-1 shrink-0 mr-2">
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-slate-500 hover:text-blue-400 p-2 transition-all"
                    >
                        <Edit2 size={18} />
                    </button>
                )}
                <button
                    onClick={onDelete}
                    className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-slate-500 hover:text-red-400 p-2 transition-all"
                >
                    <Trash2 size={20} />
                </button>
            </div>
        </div>
    );
}

/* ─── Completed Task Item ─── */

function TaskItem({ task, onToggle, onDelete, onUpdate }: { task: Task; onToggle: () => void; onDelete: () => void; onUpdate: (title: string) => void }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(task.title);

    const handleSave = () => {
        if (editValue.trim() && editValue !== task.title) {
            onUpdate(editValue.trim());
        }
        setIsEditing(false);
    };

    return (
        <div className="group flex items-center justify-between p-4 rounded-2xl border transition-all bg-emerald-500/5 border-emerald-500/20 opacity-70 overflow-hidden">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-6 h-6 shrink-0"></div>
                <button
                    onClick={onToggle}
                    className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all bg-emerald-500 border-emerald-500 shrink-0"
                >
                    <CheckCircle2 size={16} className="text-white" />
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
                        onFocus={(e) => {
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
                    <span className="text-lg line-through text-slate-400 flex-1 wrap-break-word">
                        {task.title}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-1 shrink-0 mr-2">
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-slate-400 hover:text-blue-400 p-2 transition-all"
                    >
                        <Edit2 size={18} />
                    </button>
                )}
                <button
                    onClick={onDelete}
                    className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-slate-500 hover:text-red-400 p-2 transition-all"
                >
                    <Trash2 size={20} />
                </button>
            </div>
        </div>
    );
}
