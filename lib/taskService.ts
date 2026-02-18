import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    onSnapshot,
    Timestamp,
    orderBy
} from "firebase/firestore";
import { db } from "./firebase";

export interface Task {
    id?: string;
    userId: string;
    title: string;
    completed: boolean;
    categoryId: string;
    createdAt: Timestamp;
    order?: number;
}

export const taskService = {
    addTask: async (userId: string, title: string, categoryId: string, tasksCount: number = 0) => {
        return await addDoc(collection(db, "tasks"), {
            userId,
            title,
            completed: false,
            categoryId,
            createdAt: Timestamp.now(),
            order: tasksCount,
        });
    },

    updateTask: async (taskId: string, updates: Partial<Task>) => {
        const taskDoc = doc(db, "tasks", taskId);
        return await updateDoc(taskDoc, updates);
    },

    deleteTask: async (taskId: string) => {
        const taskDoc = doc(db, "tasks", taskId);
        return await deleteDoc(taskDoc);
    },

    subscribeToTasks: (userId: string, categoryId: string, callback: (tasks: Task[]) => void) => {
        const q = query(
            collection(db, "tasks"),
            where("userId", "==", userId),
            where("categoryId", "==", categoryId),
            orderBy("order", "asc")
        );

        return onSnapshot(q, (snapshot) => {
            const tasks = snapshot.docs.map((docSnap) => ({
                id: docSnap.id,
                ...docSnap.data(),
            })) as Task[];
            callback(tasks);
        });
    },
};
