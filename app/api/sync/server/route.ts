import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const USERNAME_PATTERN = /^[A-Za-z0-9_-]{3,12}$/;
const AWS_REGION = "us-east-1";
const AWS_SERVICE = "s3";
const EMPTY_HASH = crypto.createHash("sha256").update("").digest("hex");

type SyncAction = "check" | "get" | "set";

type SyncRequestBody = {
  action?: SyncAction;
  username?: string;
  accessCode?: string;
  value?: string;
};

function hmac(key: crypto.BinaryLike | crypto.KeyObject, value: string) {
  return crypto.createHmac("sha256", key).update(value).digest();
}

function hash(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function getSigningKey(secretKey: string, date: string) {
  const dateKey = hmac(`AWS4${secretKey}`, date);
  const regionKey = hmac(dateKey, AWS_REGION);
  const serviceKey = hmac(regionKey, AWS_SERVICE);
  return hmac(serviceKey, "aws4_request");
}

function encodePathPart(part: string) {
  return encodeURIComponent(part).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function normalizePrefix(prefix: string) {
  return prefix.replace(/^\/+|\/+$/g, "");
}

function buildObjectKey(username: string) {
  const prefix = normalizePrefix(process.env.X_AWS_PREFIX ?? "");
  return [prefix, `${username}.json`].filter(Boolean).join("/");
}

function buildObjectUrl(bucket: string, key: string) {
  const endpoint = process.env.X_AWS_ENDPOINT?.replace(/\/+$/g, "") ?? "";
  const encodedKey = key.split("/").map(encodePathPart).join("/");
  return new URL(`${endpoint}/${encodePathPart(bucket)}/${encodedKey}`);
}

function signS3Request(method: "GET" | "HEAD" | "PUT", url: URL, body = "") {
  const accessKey = process.env.X_AWS_ACCESS_KEY ?? "";
  const secretKey = process.env.X_AWS_SECRET_KEY ?? "";
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = body ? hash(body) : EMPTY_HASH;

  const headers: Record<string, string> = {
    host: url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };

  if (method === "PUT") {
    headers["content-type"] = "application/json; charset=utf-8";
  }

  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((key) => `${key}:${headers[key]}\n`)
    .join("");
  const canonicalQueryString = url.searchParams.toString();
  const canonicalRequest = [
    method,
    url.pathname,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${AWS_REGION}/${AWS_SERVICE}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    hash(canonicalRequest),
  ].join("\n");
  const signature = crypto
    .createHmac("sha256", getSigningKey(secretKey, dateStamp))
    .update(stringToSign)
    .digest("hex");

  return {
    ...headers,
    Authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}

function hasServerConfig() {
  return Boolean(
    process.env.X_ACCESS_CODE &&
      process.env.X_AWS_BUCKET &&
      process.env.X_AWS_ENDPOINT &&
      process.env.X_AWS_ACCESS_KEY &&
      process.env.X_AWS_SECRET_KEY,
  );
}

function unauthorized(message = "Invalid server sync config") {
  return NextResponse.json({ error: true, message }, { status: 403 });
}

async function requestS3(
  method: "GET" | "HEAD" | "PUT",
  username: string,
  body = "",
) {
  const bucket = process.env.X_AWS_BUCKET ?? "";
  const url = buildObjectUrl(bucket, buildObjectKey(username));
  const headers = signS3Request(method, url, body);

  return fetch(url, {
    method,
    headers,
    body: method === "PUT" ? body : undefined,
  });
}

export async function POST(req: NextRequest) {
  if (!hasServerConfig()) {
    return unauthorized();
  }

  let body: SyncRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: true, message: "Invalid request body" },
      { status: 400 },
    );
  }

  const action = body.action;
  const username = body.username?.trim() ?? "";
  const accessCode = body.accessCode ?? "";

  if (accessCode !== process.env.X_ACCESS_CODE) {
    return unauthorized("Invalid access code");
  }

  if (!USERNAME_PATTERN.test(username)) {
    return NextResponse.json(
      { error: true, message: "Invalid username" },
      { status: 400 },
    );
  }

  if (action !== "check" && action !== "get" && action !== "set") {
    return NextResponse.json(
      { error: true, message: "Invalid action" },
      { status: 400 },
    );
  }

  try {
    if (action === "check") {
      const response = await requestS3("HEAD", username);
      return NextResponse.json(
        { ok: response.ok || response.status === 404 },
        { status: response.ok || response.status === 404 ? 200 : 502 },
      );
    }

    if (action === "get") {
      const response = await requestS3("GET", username);
      if (response.status === 404) {
        return new NextResponse("", { status: 200 });
      }
      if (!response.ok) {
        return NextResponse.json(
          { error: true, message: "Failed to get remote state" },
          { status: 502 },
        );
      }
      return new NextResponse(await response.text(), { status: 200 });
    }

    const value = body.value ?? "";
    const response = await requestS3("PUT", username, value);
    if (!response.ok) {
      return NextResponse.json(
        { error: true, message: "Failed to set remote state" },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Server Sync] request failed", error);
    return NextResponse.json(
      { error: true, message: "Server sync request failed" },
      { status: 500 },
    );
  }
}
