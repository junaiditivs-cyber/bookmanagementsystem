let csrfToken: string | null = null;

export function setCsrfToken(
  token: string | null,
) {
  csrfToken = token;
}

export function getCsrfToken() {
  return csrfToken;
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const method = String(
    init.method || "GET",
  ).toUpperCase();

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

  if (
    ![
      "GET",
      "HEAD",
      "OPTIONS",
    ].includes(method) &&
    csrfToken
  ) {
    headers.set(
      "x-csrf-token",
      csrfToken,
    );
  }

  const response = await fetch(
    input,
    {
      ...init,
      headers,
      credentials: "include",
    },
  );

  if (response.status === 401) {
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
    return (
      "The request could not be completed."
    );
  }
}