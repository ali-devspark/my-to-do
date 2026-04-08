"use client";

import { useState, useEffect, useRef } from "react";
import { Task, Subtask, taskService } from "@/lib/taskService";
import { X, Trash2, Plus, Edit2, CheckCircle2 } from "lucide-react";

interface TaskDetailsModalProps {
    task: Task;
    onClose: () => void;
}

export default function TaskDetailsModal({ task, onClose }: TaskDetailsModalProps) {
    const [title, setTitle] = useState(task.title);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
    const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
    const [editSubtaskTitle, setEditSubtaskTitle] = useState("");

    const titleRef = useRef<HTMLInputElement>(null);
    const editSubtaskRef = useRef<HTMLInputElement>(null);

    const subtasks = task.subtasks || [];

    // Focus input when editing title
    useEffect(() => {
        if (isEditingTitle) {
            titleRef.current?.focus();
        }
    }, [isEditingTitle]);

    // Focus input when editing subtask
    useEffect(() => {
        if (editingSubtaskId) {
            editSubtaskRef.current?.focus();
        }
    }, [editingSubtaskId]);

    // Auto-update internal state if task props change from outside
    const [prevTaskTitle, setPrevTaskTitle] = useState(task.title);
    if (task.title !== prevTaskTitle) {
        setPrevTaskTitle(task.title);
        if (!isEditingTitle) {
            setTitle(task.title);
        }
    }

    const handleUpdateTitle = async () => {
        if (title.trim() && title !== task.title) {
            try {
                await taskService.updateTask(task.id!, { title: title.trim() });
            } catch (err) {
                console.error("Failed to update task title", err);
                setTitle(task.title);
            }
        } else {
            setTitle(task.title);
        }
        setIsEditingTitle(false);
    };

    const handleDeleteTask = async () => {
        try {
            await taskService.deleteTask(task.id!);
            onClose();
        } catch (err) {
            console.error("Failed to delete task", err);
        }
    };

    const handleAddSubtask = async () => {
        if (!newSubtaskTitle.trim()) return;
        
        const newSubtask: Subtask = {
            id: crypto.randomUUID(),
            title: newSubtaskTitle.trim(),
            completed: false,
        };

        try {
            await taskService.updateTask(task.id!, {
                subtasks: [...subtasks, newSubtask]
            });
            setNewSubtaskTitle("");
        } catch (err) {
            console.error("Failed to add subtask", err);
        }
    };

    const handleUpdateSubtask = async (subtaskId: string, newTitle: string) => {
        if (!newTitle.trim()) {
            setEditingSubtaskId(null);
            return;
        }

        const updatedSubtasks = subtasks.map(st => 
            st.id === subtaskId ? { ...st, title: newTitle.trim() } : st
        );

        try {
            await taskService.updateTask(task.id!, { subtasks: updatedSubtasks });
            setEditingSubtaskId(null);
        } catch (err) {
            console.error("Failed to update subtask", err);
        }
    };

    const handleToggleSubtask = async (subtaskId: string) => {
        const updatedSubtasks = subtasks.map(st => 
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );

        try {
            await taskService.updateTask(task.id!, { subtasks: updatedSubtasks });
        } catch (err) {
            console.error("Failed to toggle subtask", err);
        }
    };

    const handleDeleteSubtask = async (subtaskId: string) => {
        const updatedSubtasks = subtasks.filter(st => st.id !== subtaskId);
        try {
            await taskService.updateTask(task.id!, { subtasks: updatedSubtasks });
        } catch (err) {
            console.error("Failed to delete subtask", err);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div 
                className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300"
                dir="rtl"
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-6 shrink-0 gap-4">
                    <div className="flex-1 min-w-0">
                        {isEditingTitle ? (
                            <input
                                ref={titleRef}
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleUpdateTitle}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleUpdateTitle();
                                    if (e.key === "Escape") {
                                        setTitle(task.title);
                                        setIsEditingTitle(false);
                                    }
                                }}
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        ) : (
                            <h2 
                                onClick={() => setIsEditingTitle(true)}
                                className="text-xl sm:text-2xl font-bold text-white cursor-text hover:bg-white/5 p-2 -ml-2 rounded-xl transition-colors line-clamp-2"
                                title="اضغط لتعديل النص"
                            >
                                {title}
                            </h2>
                        )}
                        {task.createdAt && task.createdAt.toDate && (
                            <p className="text-sm text-slate-400 mt-2 px-2">
                                {task.createdAt.toDate().toLocaleDateString('ar-EG', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </p>
                        )}
                    </div>

                    <button 
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all shrink-0"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Subtasks Section */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                            المهام الفرعية
                            <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs">
                                {subtasks.filter(s => s.completed).length} / {subtasks.length}
                            </span>
                        </h3>
                        
                        {/* Subtasks List */}
                        <div className="space-y-2">
                            {subtasks.map((subtask) => (
                                <div 
                                    key={subtask.id}
                                    className={`group flex items-center justify-between p-3 rounded-xl border transition-all ${
                                        subtask.completed 
                                            ? "bg-emerald-500/10 border-emerald-500/20" 
                                            : "bg-white/5 border-white/10 hover:border-white/20"
                                    }`}
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <button
                                            onClick={() => handleToggleSubtask(subtask.id)}
                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                                                subtask.completed
                                                    ? "bg-emerald-500 border-emerald-500"
                                                    : "border-slate-500 hover:border-white"
                                            }`}
                                        >
                                            {subtask.completed && <CheckCircle2 size={12} className="text-white" />}
                                        </button>

                                        {editingSubtaskId === subtask.id ? (
                                            <input
                                                ref={editSubtaskRef}
                                                type="text"
                                                value={editSubtaskTitle}
                                                onChange={(e) => setEditSubtaskTitle(e.target.value)}
                                                onBlur={() => handleUpdateSubtask(subtask.id, editSubtaskTitle)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleUpdateSubtask(subtask.id, editSubtaskTitle);
                                                    if (e.key === "Escape") setEditingSubtaskId(null);
                                                }}
                                                className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white focus:outline-none"
                                            />
                                        ) : (
                                            <span 
                                                className={`text-sm flex-1 truncate ${
                                                    subtask.completed ? "text-slate-400 line-through" : "text-slate-200"
                                                }`}
                                            >
                                                {subtask.title}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0 mr-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        {!editingSubtaskId && (
                                            <button
                                                onClick={() => {
                                                    setEditingSubtaskId(subtask.id);
                                                    setEditSubtaskTitle(subtask.title);
                                                }}
                                                className="p-1.5 text-slate-500 hover:text-blue-400 transition-all rounded-lg"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDeleteSubtask(subtask.id)}
                                            className="p-1.5 text-slate-500 hover:text-red-400 transition-all rounded-lg"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Subtask Input */}
                        <div className="flex items-center gap-2 mt-4 relative">
                            <input
                                type="text"
                                value={newSubtaskTitle}
                                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleAddSubtask(); }}
                                placeholder="إضافة مهمة فرعية..."
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
                            />
                            <button
                                onClick={handleAddSubtask}
                                disabled={!newSubtaskTitle.trim()}
                                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-all"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer / Danger Zone */}
                <div className="mt-8 pt-4 border-t border-white/10 shrink-0">
                    {showDeleteConfirm ? (
                        <div className="flex flex-col sm:flex-row items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
                            <span className="text-red-400 text-sm font-bold flex-1 text-center sm:text-right">
                                هل أنت متأكد من حذف هذه المهمة نهائياً؟
                            </span>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                    onClick={handleDeleteTask}
                                    className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-500/20"
                                >
                                    نعم، احذف
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all border border-slate-700"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-3 rounded-xl text-sm font-bold transition-all"
                        >
                            <Trash2 size={18} />
                            حذف المهمة
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
