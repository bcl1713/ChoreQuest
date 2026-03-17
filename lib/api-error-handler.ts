import { NextResponse } from "next/server";
import { AppError, ValidationError } from "@/lib/errors";

export function handleRouteError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      console.error(error);
    }

    const body =
      error instanceof ValidationError && error.details !== undefined
        ? { error: error.message, code: error.code, details: error.details }
        : { error: error.message, code: error.code };

    return NextResponse.json(
      body,
      { status: error.statusCode },
    );
  }

  console.error(error);

  return NextResponse.json(
    { error: "Internal server error", code: "INTERNAL_ERROR" },
    { status: 500 },
  );
}
