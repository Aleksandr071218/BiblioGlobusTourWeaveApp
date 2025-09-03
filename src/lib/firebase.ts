import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Parses the client-side Firebase config from a JSON string in an environment variable.
 * This is the recommended approach for Firebase App Hosting and Secret Manager.
 * @returns {FirebaseOptions} The Firebase config object.
 */
const getFirebaseConfig = (): FirebaseOptions => {
  const configStr = process.env.NEXT_PUBLIC_FIREBASE_CONFIG
  if (configStr) {
    try {
      return JSON.parse(configStr);
    } catch (e) {
      throw new Error(
        "Failed to parse NEXT_PUBLIC_FIREBASE_CONFIG. Ensure it's a valid JSON string."
      );
    }
  }

  // If configStr is not available, we are likely in a build environment.
  // We return a dummy config to allow the build to succeed.
  // The real config will be available at runtime on the client and server.
  return {
    apiKey: 'dummy-key',
    authDomain: 'dummy-domain.firebaseapp.com',
    projectId: 'dummy-project',
    storageBucket: 'dummy-project.appspot.com',
    messagingSenderId: 'dummy-sender-id',
    appId: 'dummy-app-id',
  };
};

const app = !getApps().length ? initializeApp(getFirebaseConfig()) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
