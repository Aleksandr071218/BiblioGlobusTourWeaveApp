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

  // Only attempt to parse if it looks like a JSON object.
  if (configStr && configStr.trim().startsWith('{')) {
    try {
      return JSON.parse(configStr);
    } catch (e) {
      console.error(
        "Build-time warning: Failed to parse NEXT_PUBLIC_FIREBASE_CONFIG. This is expected during build if the secret is not available. Falling back to dummy config.",
        e
      );
      // Fall through to dummy config if parsing fails
    }
  }

  // If configStr is not available, we are likely in a build environment.
  // We return a dummy config to allow the build to succeed.
  // The real config will be available at runtime on the client and server.
  return {
    apiKey: 'build-time-dummy-key',
    authDomain: 'build-time-dummy-domain.firebaseapp.com',
    projectId: 'build-time-dummy-project',
    storageBucket: 'build-time-dummy-project.appspot.com',
    messagingSenderId: 'build-time-dummy-sender-id',
    appId: 'build-time-dummy-app-id',
  };
};

const app = !getApps().length ? initializeApp(getFirebaseConfig()) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
