const TOKEN_KEY =
  "ivs.books.access-token";

let accessToken: string | null =
  null;

function readStoredToken(): string | null {
  try {
    return (
      window.localStorage.getItem(
        TOKEN_KEY,
      ) ||
      window.sessionStorage.getItem(
        TOKEN_KEY,
      )
    );
  } catch {
    return null;
  }
}

accessToken = readStoredToken();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(
  token: string,
  rememberMe: boolean,
): void {
  accessToken = token;

  try {
    window.localStorage.removeItem(
      TOKEN_KEY,
    );

    window.sessionStorage.removeItem(
      TOKEN_KEY,
    );

    const storage = rememberMe
      ? window.localStorage
      : window.sessionStorage;

    storage.setItem(
      TOKEN_KEY,
      token,
    );
  } catch {
    // In-memory token still works when browser storage is unavailable.
  }
}

export function replaceAccessToken(
  token: string,
): void {
  let rememberMe = false;

  try {
    rememberMe = Boolean(
      window.localStorage.getItem(
        TOKEN_KEY,
      ),
    );
  } catch {
    rememberMe = false;
  }

  setAccessToken(
    token,
    rememberMe,
  );
}

export function clearAccessToken(): void {
  accessToken = null;

  try {
    window.localStorage.removeItem(
      TOKEN_KEY,
    );

    window.sessionStorage.removeItem(
      TOKEN_KEY,
    );
  } catch {
    // Nothing else to clear.
  }
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(
    init.headers || {},
  );

  if (
    init.body &&
    !headers.has("Content-Type") &&
    !(init.body instanceof FormData)
  ) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  if (accessToken) {
    headers.set(
      "Authorization",
      `Bearer ${accessToken}`,
    );
  }

  const response = await fetch(
    input,
    {
      ...init,
      headers,
      credentials: "same-origin",
    },
  );

  if (response.status === 401) {
    clearAccessToken();

    window.dispatchEvent(
      new CustomEvent(
        "auth:unauthorized",
      ),
    );
  }

  return response;
}

export async function readApiError(
  response: Response,
): Promise<string> {
  try {
    const body =
      await response.json();

    return (
      body?.error ||
      "The request could not be completed."
    );
  } catch {
    return "The request could not be completed.";
  }
}
