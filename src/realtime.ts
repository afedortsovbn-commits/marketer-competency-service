import { initializeApp, type FirebaseApp } from 'firebase/app'
import { get, getDatabase, onValue, ref, remove, set, type Database } from 'firebase/database'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
}

export const firebaseEnabled = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId &&
    firebaseConfig.databaseURL,
)

let app: FirebaseApp | null = null
let db: Database | null = null

const rootPath = 'pollSlideStudioState/users/marketerCompetencyService'

const getRealtimeDb = () => {
  if (!firebaseEnabled) return null
  if (!app) app = initializeApp(firebaseConfig)
  if (!db) db = getDatabase(app)
  return db
}

const remoteRef = (name: string) => {
  const database = getRealtimeDb()
  return database ? ref(database, `${rootPath}/${name}`) : null
}

export const readRemoteState = async <T,>(name: string, fallback: T) => {
  const target = remoteRef(name)
  if (!target) return fallback
  try {
    const snapshot = await get(target)
    return (snapshot.val() ?? fallback) as T
  } catch {
    return fallback
  }
}

const sanitize = (value: unknown): unknown =>
  value === undefined ? null : JSON.parse(JSON.stringify(value))

export const saveRemoteState = async (name: string, value: unknown) => {
  const target = remoteRef(name)
  if (!target) return false
  try {
    await set(target, sanitize(value))
    return true
  } catch (error) {
    console.error('[Firebase] write failed:', name, error)
    return false
  }
}

export const deleteRemoteState = async (name: string) => {
  const target = remoteRef(name)
  if (!target) return false
  try {
    await remove(target)
    return true
  } catch (error) {
    console.error('[Firebase] delete failed:', name, error)
    return false
  }
}

export const subscribeRemoteState = <T,>(
  name: string,
  fallback: T,
  onChange: (value: T) => void,
) => {
  const target = remoteRef(name)
  if (!target) return () => undefined
  return onValue(
    target,
    (snapshot) => {
      onChange((snapshot.val() ?? fallback) as T)
    },
    () => {
      onChange(fallback)
    },
  )
}
