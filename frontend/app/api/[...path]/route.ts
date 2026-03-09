import { NextRequest } from "next/server";

const BACKEND_BASE_URL = "http://localhost:8000";

type RouteContext = {
  params: {
    path: string[];
  };
};

async function proxyRequest(request: NextRequest, context: RouteContext): Promise<Response> {
  const path = context.params.path.join("/");
  const target = new URL(`${BACKEND_BASE_URL}/${path}`);
  target.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");

  const shouldSendBody = request.method !== "GET" && request.method !== "HEAD";
  const body = shouldSendBody ? await request.arrayBuffer() : undefined;

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store"
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: upstream.headers
    });
  } catch {
    return Response.json(
      { detail: "Backend is unreachable at http://localhost:8000" },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}
