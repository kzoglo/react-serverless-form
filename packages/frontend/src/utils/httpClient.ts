import { getIdToken } from "@/services/auth/services";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getIdToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: { message: response.statusText },
    }));
    throw new ApiError(response.status, error.error?.message || "Request failed");
  }

  return response.json() as Promise<T>;
}
