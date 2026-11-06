import { NextResponse } from "next/server";

export async function GET() {
  const data = [{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.letschat.app",
    "sha256_cert_fingerprints": []
  }
}];
  return new NextResponse(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
    },
  });
}
