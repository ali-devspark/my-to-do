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
    isShared?: boolean;
    shareCode?: string;
    members?: string[]; // Array of user IDs
}

export const categoryService = {
    addCategory: async (userId: string, name: string, order: number, isShared: boolean = false) => {
        const categoryData: any = {
            userId,
            name,
            order,
            createdAt: Timestamp.now(),
            isShared,
        };

        if (isShared) {
            categoryData.shareCode = Math.random().toString(36).substring(2, 10).toUpperCase();
            categoryData.members = [userId];
        }

        return await addDoc(collection(db, "categories"), categoryData);
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

    joinCategoryByCode: async (userId: string, shareCode: string) => {
        const q = query(
            collection(db, "categories"),
            where("shareCode", "==", shareCode.toUpperCase())
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            throw new Error("رمز المشاركة غير صحيح");
        }

        const categoryDoc = snapshot.docs[0];
        const categoryData = categoryDoc.data() as Category;

        if (categoryData.members?.includes(userId)) {
            throw new Error("أنت عضو بالفعل في هذا التصنيف");
        }

        const members = [...(categoryData.members || []), userId];
        await updateDoc(categoryDoc.ref, { members });

        return { id: categoryDoc.id, ...categoryData, members };
    },

    subscribeToCategories: (
        userId: string,
        callback: (categories: Category[]) => void
    ) => {
        // Basic query for personal categories
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
            // Filter out shared categories from the personal list
            callback(categories.filter(c => !c.isShared));
        });
    },

    subscribeToSharedCategories: (
        userId: string,
        callback: (categories: Category[]) => void
    ) => {
        const q = query(
            collection(db, "categories"),
            where("members", "array-contains", userId)
        );

        return onSnapshot(q, (snapshot) => {
            const categories = snapshot.docs.map((docSnap) => ({
                id: docSnap.id,
                ...docSnap.data(),
            })) as Category[];
            // Show all categories where user is a member, provided it's marked as shared
            callback(categories.filter(c => c.isShared));
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
