import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Parses the client-side Firebase config from a JSON string in an environment variable.
 * This is the recommended approach for Firebase App Hosting and Secret Manager.
 * @returns {FirebaseOptions} The Firebase config object.
 */
const getFirebaseConfig = (): FirebaseOptions => {
  const configStr = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;

  if (!configStr) {
    throw new Error(
      'Client-side Firebase config not found. Please set the NEXT_PUBLIC_FIREBASE_CONFIG environment variable.'
    );
  }

  try {
    return JSON.parse(configStr);
  } catch (e) {
    throw new Error(
      "Failed to parse NEXT_PUBLIC_FIREBASE_CONFIG. Ensure it's a valid JSON string."
    );
  }
};

const app = !getApps().length ? initializeApp(getFirebaseConfig()) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
