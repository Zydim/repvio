import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
});

export interface Correction {
  fehler: string;
  korrektur: string;
}

export interface Teilscores {
  haltung: number;
  gelenke: number;
  rom: number;
  bewegungsfluss: number;
  gesamteindruck: number;
}

export interface FeedbackResult {
  score: number;
  teilscores?: Teilscores;
  overall: string;
  positives: string[];
  corrections: Correction[];
  verletzungsrisiko: string;
  cue: string;
  naechste_schritte: string[];
}

export interface AnalysisResponse {
  session_id: number;
  feedback: FeedbackResult;
  score: number;
  exercise_type: string;
  created_at: string;
}

export interface HistorySession {
  session_id: number;
  exercise_type: string;
  score: number;
  overall: string;
  created_at: string;
}

export interface SessionDetail {
  session_id: number;
  exercise_type: string;
  feedback: FeedbackResult;
  score: number;
  created_at: string;
}

// Token cache — tokens are valid for 5 min, we refresh after 4
let _tokenCache: { email: string; token: string; expiresAt: number } | null = null;

async function getBackendToken(): Promise<{ email: string; token: string }> {
  if (_tokenCache && Date.now() < _tokenCache.expiresAt) {
    return { email: _tokenCache.email, token: _tokenCache.token };
  }
  const res = await fetch("/api/auth-token");
  if (!res.ok) throw new Error("Nicht angemeldet");
  const data = await res.json();
  _tokenCache = { ...data, expiresAt: Date.now() + 4 * 60 * 1000 };
  return data;
}

export async function analyzeVideo(
  file: File,
  exerciseType: string,
  userEmail: string,
  muscleFocus?: string
): Promise<AnalysisResponse> {
  const { email, token } = await getBackendToken();

  const formData = new FormData();
  formData.append("video", file);
  formData.append("exercise_type", exerciseType);
  formData.append("user_email", email);
  formData.append("user_token", token);
  if (muscleFocus) formData.append("muscle_focus", muscleFocus);

  const response = await api.post<AnalysisResponse>("/analyze", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function getHistory(email: string): Promise<HistorySession[]> {
  const { email: verifiedEmail, token } = await getBackendToken();
  const response = await api.get<HistorySession[]>("/history", {
    params: { email: verifiedEmail, user_token: token },
  });
  return response.data;
}

export async function getSession(sessionId: number): Promise<SessionDetail> {
  const { email, token } = await getBackendToken();
  const response = await api.get<SessionDetail>(`/history/${sessionId}`, {
    params: { email, user_token: token },
  });
  return response.data;
}

// Payment
export interface UserPlan {
  plan: string;
  analyses_this_month: number;
}

export async function getUserPlan(email: string): Promise<UserPlan> {
  const response = await api.get<UserPlan>("/payment/user-plan", {
    params: { email },
  });
  return response.data;
}

export async function verifyCheckoutSession(
  sessionId: string
): Promise<{ status: string; plan?: string }> {
  const response = await api.post("/payment/verify-session", null, {
    params: { session_id: sessionId },
  });
  return response.data;
}

// Auth
export async function forgotPassword(email: string): Promise<{ message: string }> {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  const response = await api.post("/auth/reset-password", { token, password });
  return response.data;
}

export async function cancelSubscription(email: string): Promise<{ message: string }> {
  const response = await api.post("/payment/cancel-subscription", { email });
  return response.data;
}

export async function deleteAccount(email: string, password: string): Promise<{ message: string }> {
  const response = await api.post("/auth/delete-account", { email, password });
  return response.data;
}

export async function createCheckoutSession(
  email: string,
  plan: string
): Promise<{ url: string }> {
  const response = await api.post<{ url: string }>(
    "/payment/create-checkout-session",
    { email, plan }
  );
  return response.data;
}
