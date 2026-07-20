const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export { API_URL };

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  message: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string,
): Promise<ApiResponse<T>> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !data.success) {
    // Heuristic #9: descriptive error messages
    throw new ApiError(
      data.message || "Terjadi kesalahan. Silakan coba lagi.",
      response.status,
    );
  }

  return data;
}

// Calendar API functions
export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
  type: "DEADLINE" | "PERSONAL_NOTE" | "ANNOUNCEMENT";
  userId: string | null;
  courseId: string | null;
  course?: {
    id: string;
    name: string;
    code: string;
    thumbnailColor: string;
  };
  createdAt: string;
}

export async function getCalendarEvents(token: string, courseId?: string) {
  const params = courseId ? `?courseId=${courseId}` : "";
  return apiFetch<CalendarEvent[]>(`/calendar${params}`, {}, token);
}

export async function getCalendarEventsByMonth(token: string, year: number, month: number) {
  return apiFetch<CalendarEvent[]>(`/calendar/month?year=${year}&month=${month}`, {}, token);
}

export async function getUpcomingDeadlines(token: string) {
  return apiFetch<CalendarEvent[]>("/calendar/upcoming", {}, token);
}

export async function createCalendarEvent(
  token: string,
  data: {
    title: string;
    description?: string;
    startDate: string;
    type?: "DEADLINE" | "PERSONAL_NOTE" | "ANNOUNCEMENT";
    courseId?: string;
  },
) {
  return apiFetch<CalendarEvent>("/calendar", {
    method: "POST",
    body: JSON.stringify(data),
  }, token);
}

export async function updateCalendarEvent(
  token: string,
  eventId: string,
  data: {
    title?: string;
    description?: string;
    date?: string;
    type?: "DEADLINE" | "PERSONAL_NOTE" | "ANNOUNCEMENT";
  },
) {
  return apiFetch<CalendarEvent>(`/calendar/${eventId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }, token);
}

export async function deleteCalendarEvent(token: string, eventId: string) {
  return apiFetch<null>(`/calendar/${eventId}`, {
    method: "DELETE",
  }, token);
}

// Forum API functions
export interface ForumAuthor {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface ForumReply {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: ForumAuthor;
}

export interface ForumThread {
  id: string;
  courseId: string;
  authorId: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  author: ForumAuthor;
  course?: {
    id: string;
    name: string;
    code: string;
  };
  replies: ForumReply[];
  unreadCount?: number;
  _count?: {
    replies: number;
  };
}

export async function getForumThreads(token: string, courseId: string) {
  return apiFetch<ForumThread[]>(`/forum/course/${courseId}`, {}, token);
}

export async function getForumThread(token: string, threadId: string) {
  return apiFetch<ForumThread>(`/forum/thread/${threadId}`, {}, token);
}

export async function createForumThread(
  token: string,
  data: {
    courseId: string;
    title: string;
    content: string;
  },
) {
  return apiFetch<ForumThread>("/forum/thread", {
    method: "POST",
    body: JSON.stringify(data),
  }, token);
}

export async function updateForumThread(
  token: string,
  threadId: string,
  data: {
    title?: string;
    content?: string;
  },
) {
  return apiFetch<ForumThread>(`/forum/thread/${threadId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }, token);
}

export async function deleteForumThread(token: string, threadId: string) {
  return apiFetch<null>(`/forum/thread/${threadId}`, {
    method: "DELETE",
  }, token);
}

export async function togglePinThread(token: string, threadId: string) {
  return apiFetch<ForumThread>(`/forum/thread/${threadId}/pin`, {
    method: "PUT",
  }, token);
}

export async function createForumReply(
  token: string,
  threadId: string,
  content: string,
) {
  return apiFetch<ForumReply>(`/forum/thread/${threadId}/reply`, {
    method: "POST",
    body: JSON.stringify({ content }),
  }, token);
}

export async function updateForumReply(
  token: string,
  replyId: string,
  content: string,
) {
  return apiFetch<ForumReply>(`/forum/reply/${replyId}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  }, token);
}

export async function deleteForumReply(token: string, replyId: string) {
  return apiFetch<null>(`/forum/reply/${replyId}`, {
    method: "DELETE",
  }, token);
}

// Notifications API functions
export interface Notification {
  id: string;
  userId: string;
  type: "DEADLINE_REMINDER" | "EXAM_REMINDER" | "GRADE_RELEASED" | "FORUM_REPLY" | "SYSTEM";
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export async function getNotifications(token: string, unreadOnly = false) {
  const params = unreadOnly ? "?unreadOnly=true" : "";
  return apiFetch<Notification[]>(`/notifications${params}`, {}, token);
}

export async function getUnreadCount(token: string) {
  return apiFetch<{ count: number }>("/notifications/unread-count", {}, token);
}

export async function markNotificationAsRead(token: string, notificationId: string) {
  return apiFetch<null>(`/notifications/${notificationId}/read`, {
    method: "PUT",
  }, token);
}

export async function markAllNotificationsAsRead(token: string) {
  return apiFetch<null>("/notifications/read-all", {
    method: "PUT",
  }, token);
}

export async function deleteNotification(token: string, notificationId: string) {
  return apiFetch<null>(`/notifications/${notificationId}`, {
    method: "DELETE",
  }, token);
}

// Private Files API functions
export interface PrivateFile {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  folderPath: string;
  mimeType: string | null;
  createdAt: string;
}

export interface QuotaInfo {
  used: number;
  limit: number;
}

export interface PrivateFilesResponse {
  files: PrivateFile[];
  quota: QuotaInfo;
}

export async function getPrivateFiles(token: string, folderPath = "/") {
  const params = new URLSearchParams({ folderPath });
  return apiFetch<PrivateFilesResponse>(`/private-files?${params.toString()}`, {}, token);
}

export async function getPrivateFilesQuota(token: string) {
  return apiFetch<QuotaInfo>("/private-files/quota", {}, token);
}

export async function uploadPrivateFile(
  token: string,
  data: {
    fileName: string;
    fileType: string;
    fileSize: number;
    folderPath?: string;
  },
) {
  return apiFetch<{ uploadUrl: string; fileUrl: string; file: PrivateFile }>("/private-files/upload", {
    method: "POST",
    body: JSON.stringify(data),
  }, token);
}

export async function deletePrivateFile(token: string, fileId: string) {
  return apiFetch<null>(`/private-files/${fileId}`, {
    method: "DELETE",
  }, token);
}

export async function createPrivateFolder(token: string, folderPath: string) {
  return apiFetch<{ folderPath: string }>("/private-files/folder", {
    method: "POST",
    body: JSON.stringify({ folderPath }),
  }, token);
}

export async function getPrivateFileDownloadUrl(token: string, fileId: string) {
  return apiFetch<{ downloadUrl: string; fileName: string }>(`/private-files/${fileId}/download`, {}, token);
}

export async function renamePrivateFile(token: string, fileId: string, newFileName: string) {
  return apiFetch<PrivateFile>(`/private-files/${fileId}/rename`, {
    method: "PUT",
    body: JSON.stringify({ newFileName }),
  }, token);
}

export async function movePrivateFile(token: string, fileId: string, newFolderPath: string) {
  return apiFetch<PrivateFile>(`/private-files/${fileId}/move`, {
    method: "PUT",
    body: JSON.stringify({ newFolderPath }),
  }, token);
}

// Courses API function (needed for forum)
export async function getCourses(token: string) {
  return apiFetch<any[]>("/courses/dashboard", {}, token);
}
