const ORIGIN = "https://luong.phaohoa.live";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Expose-Headers": "*",
  "Cache-Control": "no-store"
};

export default {
  async fetch(request) {

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });
    }

    // Hanya GET dan HEAD
    if (
      request.method !== "GET" &&
      request.method !== "HEAD"
    ) {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: CORS_HEADERS
      });
    }

    const incomingURL = new URL(request.url);

    /*
     * Contoh:
     *
     * Worker:
     * /live/phaohoa5/index.m3u8
     *
     * menjadi:
     * https://luong.phaohoa.live/live/phaohoa5/index.m3u8
     */

    const targetURL =
      ORIGIN +
      incomingURL.pathname +
      incomingURL.search;

    try {

      const response = await fetch(targetURL, {
        method: request.method,

        redirect: "follow",

        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",

          "Accept": "*/*",

          "Referer":
            "https://luong.phaohoa.live/"
        },

        cf: {
          cacheTtl: 0,
          cacheEverything: false
        }
      });

      const headers =
        new Headers(response.headers);

      // Tambahkan CORS
      for (
        const [key, value]
        of Object.entries(CORS_HEADERS)
      ) {
        headers.set(key, value);
      }

      // Jangan cache live
      headers.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate"
      );

      /*
       * Pastikan playlist M3U8
       * memiliki MIME type yang benar.
       */

      if (
        incomingURL.pathname
          .toLowerCase()
          .endsWith(".m3u8")
      ) {

        headers.set(
          "Content-Type",
          "application/vnd.apple.mpegurl"
        );

      }

      return new Response(
        response.body,
        {
          status: response.status,
          statusText: response.statusText,
          headers: headers
        }
      );

    } catch (error) {

      return new Response(
        "Proxy Error: " +
        error.message,
        {
          status: 502,

          headers: {
            ...CORS_HEADERS,

            "Content-Type":
              "text/plain; charset=utf-8"
          }
        }
      );

    }

  }
};
