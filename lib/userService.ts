import { db } from "./firebase";
import { doc, setDoc, getDoc, getDocs, query, collection, where } from "firebase/firestore";
import { User } from "firebase/auth";

export interface UserProfile {
    uid: string;
    name: string;
    email: string;
    photoURL?: string | null;
}

export const userService = {
    saveProfile: async (user: User) => {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
            uid: user.uid,
            name: user.displayName || user.email?.split("@")[0] || "مستخدم",
            email: user.email,
            photoURL: user.photoURL,
            lastLogin: new Date().toISOString(),
        }, { merge: true });
    },

    getProfiles: async (uids: string[]): Promise<UserProfile[]> => {
        if (!uids || uids.length === 0) return [];

        const profiles: UserProfile[] = [];
        // Firestore 'in' query supports up to 10-30 items depending on some conditions, 
        // usually 10 for most queries, but we'll assume a reasonable amount for now.
        // For larger sets we'd need to chunk.

        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("uid", "in", uids));
            const snapshot = await getDocs(q);

            snapshot.forEach((doc) => {
                profiles.push(doc.data() as UserProfile);
            });
        } catch (err) {
            console.error("Failed to fetch profiles:", err);
        }

        return profiles;
    },

    getProfile: async (uid: string): Promise<UserProfile | null> => {
        const userRef = doc(db, "users", uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            return docSnap.data() as UserProfile;
        }
        return null;
    }
};
