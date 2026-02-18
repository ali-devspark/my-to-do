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
    orderBy,
    getDocs,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Category {
    id?: string;
    userId: string;
    name: string;
    order: number;
    createdAt: Timestamp;
}

export const categoryService = {
    addCategory: async (userId: string, name: string, order: number) => {
        return await addDoc(collection(db, "categories"), {
            userId,
            name,
            order,
            createdAt: Timestamp.now(),
        });
    },

    updateCategory: async (categoryId: string, updates: Partial<Category>) => {
        const categoryDoc = doc(db, "categories", categoryId);
        return await updateDoc(categoryDoc, updates);
    },

    deleteCategory: async (categoryId: string) => {
        // Delete all tasks belonging to this category
        const tasksQuery = query(
            collection(db, "tasks"),
            where("categoryId", "==", categoryId)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const deletePromises = tasksSnapshot.docs.map((taskDoc) =>
            deleteDoc(taskDoc.ref)
        );
        await Promise.all(deletePromises);

        // Delete the category itself
        const categoryDoc = doc(db, "categories", categoryId);
        return await deleteDoc(categoryDoc);
    },

    subscribeToCategories: (
        userId: string,
        callback: (categories: Category[]) => void
    ) => {
        const q = query(
            collection(db, "categories"),
            where("userId", "==", userId),
            orderBy("order", "asc")
        );

        return onSnapshot(q, (snapshot) => {
            const categories = snapshot.docs.map((docSnap) => ({
                id: docSnap.id,
                ...docSnap.data(),
            })) as Category[];
            callback(categories);
        });
    },

    initDefaultCategory: async (userId: string): Promise<void> => {
        const q = query(
            collection(db, "categories"),
            where("userId", "==", userId)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            await categoryService.addCategory(userId, "مهامي", 0);
        }
    },
};
