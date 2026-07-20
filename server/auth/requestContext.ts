import { AsyncLocalStorage } from "async_hooks";
import type {
  NextFunction,
  Request,
  Response,
} from "express";

interface RequestContextValue {
  actorEmail: string;
}

const requestContext =
  new AsyncLocalStorage<RequestContextValue>();

export function requestContextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  requestContext.run(
    {
      actorEmail:
        req.session?.auth?.email || "system",
    },
    next,
  );
}

export function getCurrentActorEmail(): string {
  return (
    requestContext.getStore()?.actorEmail ||
    "system"
  );
}