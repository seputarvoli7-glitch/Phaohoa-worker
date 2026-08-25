const ORIGIN = "https://luong.phaohoa.live";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Expose-Headers": "*",
  "Cache-Control": "no-store"
};

function corsHeaders(extra = {}) {
  return {
    ...CORS_HEADERS,
    ...extra
  };
}

function absoluteURL(value, base) {
  try {
    return new URL(value, base).href;
  } catch {
    return value;
  }
}

export default {
  async fetch(request) {

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    if (!["GET", "HEAD"].includes(request.method)) {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: corsHeaders()
      });
    }

    const requestURL = new URL(request.url);

    const targetURL =
      ORIGIN +
      requestURL.pathname +
      requestURL.search;

    try {

      const response = await fetch(targetURL, {
        method: request.method,
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "*/*",
          "Referer": ORIGIN + "/"
        },
        cf: {
          cacheTtl: 0,
          cacheEverything: false
        }
      });

      /*
       * Kalau bukan M3U8, langsung teruskan.
       */
      const contentType =
        response.headers.get("content-type") || "";

      const isM3U8 =
        requestURL.pathname
          .toLowerCase()
          .endsWith(".m3u8") ||
        contentType.includes("mpegurl") ||
        contentType.includes("m3u8");

      if (!isM3U8) {

        return new Response(
          response.body,
          {
            status: response.status,
            statusText: response.statusText,
            headers: corsHeaders({
              "Content-Type":
                contentType || "application/octet-stream"
            })
          }
        );

      }

      /*
       * Baca playlist
       */
      const text = await response.text();

      /*
       * URL Worker
       */
      const workerOrigin =
        requestURL.origin;

      /*
       * Tulis ulang URL segmen/sub-playlist
       */
      const lines = text.split(/\r?\n/);

      const rewritten = lines.map(line => {

        const trimmed = line.trim();

        /*
         * Komentar HLS
         */
        if (
          !trimmed ||
          trimmed.startsWith("#")
        ) {

          /*
           * Beberapa tag HLS dapat berisi URI="..."
           */
          if (
            trimmed.includes('URI="')
          ) {

            return trimmed.replace(
              /URI="([^"]+)"/g,
              (match, uri) => {

                const absolute =
                  absoluteURL(
                    uri,
                    targetURL
                  );

                return `URI="${workerOrigin}${new URL(absolute).pathname}${new URL(absolute).search}"`;
              }
            );

          }

          return line;
        }

        /*
         * Baris URL segmen / playlist
         */
        try {

          const absolute =
            absoluteURL(
              trimmed,
              targetURL
            );

          const parsed =
            new URL(absolute);

          return (
            workerOrigin +
            parsed.pathname +
            parsed.search
          );

        } catch {

          return line;

        }

      }).join("\n");

      return new Response(
        request.method === "HEAD"
          ? null
          : rewritten,
        {
          status: response.status,
          headers: corsHeaders({
            "Content-Type":
              "application/vnd.apple.mpegurl"
          })
        }
      );

    } catch (error) {

      return new Response(
        "Proxy Error: " + error.message,
        {
          status: 502,
          headers: corsHeaders({
            "Content-Type":
              "text/plain; charset=utf-8"
          })
        }
      );

    }

  }
};
