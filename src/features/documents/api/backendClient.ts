/**
 * backendClient - shared fetch wrapper for the PDF tracking backend.
 * All Documents/Analytics API calls go through this client.
 */

const BACKEND_BASE_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

/** Fetch wrapper with JSON parsing and error handling. */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${BACKEND_BASE_URL}${path}`;
    const res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    });

    if (!res.ok) {
        let message = `Request failed: ${res.status} ${res.statusText}`;
        try {
            const data = await res.json();
            if (data?.error) message = data.error;
        } catch {
            // Ignore JSON parse errors.
        }
        throw new Error(message);
    }

    return res.json() as Promise<T>;
}

export const backendClient = {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body: unknown) =>
        request<T>(path, { method: "POST", body: JSON.stringify(body) }),
};

export { BACKEND_BASE_URL };
