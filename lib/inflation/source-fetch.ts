import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { rootCertificates } from "node:tls";

export type OfficialFetchOptions = {
  signal?: AbortSignal;
  headers?: Record<string, string>;
  additionalCa?: string[];
};

export type OfficialResponse = {
  ok: boolean;
  status: number;
  text(): Promise<string>;
  json(): Promise<unknown>;
  arrayBuffer(): Promise<ArrayBuffer>;
};

type BufferedResponse = { status: number; headers: import("node:http").IncomingHttpHeaders; body: Buffer };

const MAX_REDIRECTS = 4;

function requestOnce(url: URL, options: OfficialFetchOptions): Promise<BufferedResponse> {
  return new Promise((resolve, reject) => {
    const isHttps = url.protocol === "https:";
    if (!isHttps && url.protocol !== "http:") {
      reject(new Error(`Unsupported source protocol: ${url.protocol}`));
      return;
    }
    const request = (isHttps ? httpsRequest : httpRequest)(
      url,
      {
        family: 4,
        headers: options.headers,
        signal: options.signal,
        ...(isHttps && options.additionalCa
          ? { ca: [...rootCertificates, ...options.additionalCa] }
          : {}),
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer | string) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        response.on("error", reject);
        response.on("end", () => {
          resolve({
            status: response.statusCode ?? 0,
            headers: response.headers,
            body: Buffer.concat(chunks),
          });
        });
      },
    );
    request.on("error", reject);
    request.end();
  });
}

async function requestWithRedirects(
  url: URL,
  options: OfficialFetchOptions,
  redirectCount = 0,
): Promise<BufferedResponse> {
  const result = await requestOnce(url, options);
  const location = result.headers.location;
  if (![301, 302, 303, 307, 308].includes(result.status) || !location) return result;
  if (redirectCount >= MAX_REDIRECTS) throw new Error("Official source redirected too many times");
  const destination = new URL(location, url);
  if (url.protocol === "https:" && destination.protocol !== "https:") {
    throw new Error("Official source attempted an insecure redirect");
  }
  return requestWithRedirects(destination, options, redirectCount + 1);
}

export async function fetchOfficial(
  input: string,
  options: OfficialFetchOptions = {},
): Promise<OfficialResponse> {
  const response = await requestWithRedirects(new URL(input), options);
  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    async text() {
      return response.body.toString("utf8");
    },
    async json() {
      return JSON.parse(response.body.toString("utf8")) as unknown;
    },
    async arrayBuffer() {
      const copy = Buffer.from(response.body);
      return copy.buffer.slice(copy.byteOffset, copy.byteOffset + copy.byteLength) as ArrayBuffer;
    },
  };
}
