import { NextRequest, NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";
import { checkGuestRateLimit } from "@/lib/rate-limit";

export interface ApiHandlerOptions<TInput> {
  schema?: ZodSchema<TInput>;
  rateLimitMax?: number;
  rateLimitWindowMs?: number;
}

export function withApiHandler<TInput, TOutput = any>(
  options: ApiHandlerOptions<TInput>,
  handler: (req: NextRequest, data: TInput) => Promise<NextResponse<TOutput> | NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      if (options.rateLimitMax) {
        const rateCheck = checkGuestRateLimit(
          req,
          options.rateLimitMax,
          options.rateLimitWindowMs || 60 * 1000
        );
        if (!rateCheck.success) {
          return NextResponse.json(
            { error: "rate_limit_exceeded", message: "Too many requests. Please try again later." },
            { status: 429 }
          );
        }
      }

      let parsedData = {} as TInput;
      if (options.schema) {
        let json: unknown = {};
        try {
          json = await req.json();
        } catch {
          return NextResponse.json(
            { error: "invalid_json", message: "Request body must be valid JSON." },
            { status: 400 }
          );
        }

        const result = options.schema.safeParse(json);
        if (!result.success) {
          const zodError = result.error as ZodError;
          return NextResponse.json(
            {
              error: "validation_error",
              message: "Invalid request input",
              details: zodError.flatten().fieldErrors,
            },
            { status: 400 }
          );
        }
        parsedData = result.data;
      }

      return await handler(req, parsedData);
    } catch (error) {
      console.error("[API Handler Error]:", error);
      return NextResponse.json(
        {
          error: "internal_server_error",
          message: error instanceof Error ? error.message : "An unexpected error occurred.",
        },
        { status: 500 }
      );
    }
  };
}
