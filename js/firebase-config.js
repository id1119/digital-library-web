const FIREBASE_DATABASE_URL =
    "https://web-design-projekat-2026-default-rtdb.europe-west1.firebasedatabase.app";

function firebaseDatabaseUrl(path = "") {
    const cleanPath = String(path).replace(/^\/+|\/+$/g, "");
    const databasePath = cleanPath ? `/${cleanPath}` : "/";

    return `${FIREBASE_DATABASE_URL}${databasePath}.json`;
}
