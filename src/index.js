const ALLOWED_HOST = "hugh.cdn.rumble.cloud";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Expose-Headers": "*",
  "Cache-Control": "no-store"
};

export default {
  async fetch(request) {

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });
    }

    if (!["GET", "HEAD"].includes(request.method)) {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: CORS_HEADERS
      });
    }

    const url = new URL(request.url);

    // URL sumber Rumble CDN
    const source =
      "https://hugh.cdn.rumble.cloud" +
      url.pathname +
      url.search;

    try {

      const sourceURL = new URL(source);

      if (sourceURL.hostname !== ALLOWED_HOST) {
        return new Response("Host not allowed", {
          status: 403,
          headers: CORS_HEADERS
        });
      }

      const response = await fetch(sourceURL, {
        method: request.method,
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "*/*",
          "Referer": "https://rumble.com/"
        },
        cf: {
          cacheTtl: 0,
          cacheEverything: false
        }
      });

      const headers =
        new Headers(response.headers);

      headers.set(
        "Access-Control-Allow-Origin",
        "*"
      );

      headers.set(
        "Access-Control-Allow-Methods",
        "GET, HEAD, OPTIONS"
      );

      headers.set(
        "Access-Control-Allow-Headers",
        "*"
      );

      headers.set(
        "Cache-Control",
        "no-store"
      );

      return new Response(
        response.body,
        {
          status: response.status,
          statusText: response.statusText,
          headers
        }
      );

    } catch (error) {

      return new Response(
        "Proxy Error: " + error.message,
        {
          status: 502,
          headers: CORS_HEADERS
        }
      );

    }
  }
};            "https://rumble.com/"
        },

        redirect: "follow",

        cf: {
          cacheTtl: 0,
          cacheEverything: false
        }
      }
    );

    if (!response.ok) {

      return new Response(
        "Rumble playlist error: " +
        response.status,
        {
          status: response.status,
          headers: headers()
        }
      );

    }

    if (request.method === "HEAD") {

      return new Response(null, {
        status: response.status,
        headers: headers({
          "Content-Type":
            "application/vnd.apple.mpegurl"
        })
      });

    }

    const text =
      await response.text();

    const base =
      new URL(source);

    const lines =
      text.split(/\r?\n/);

    const output =
      lines.map(line => {

        const value =
          line.trim();

        /*
         * Baris kosong
         */

        if (!value) {
          return line;
        }

        /*
         * Tag HLS
         */

        if (value.startsWith("#")) {

          /*
           * URI="..."
           */

          if (value.includes('URI="')) {

            return value.replace(
              /URI="([^"]+)"/g,
              (match, uri) => {

                try {

                  const absolute =
                    new URL(
                      uri,
                      base
                    );

                  return (
                    'URI="' +
                    makeProxyURL(
                      workerOrigin,
                      absolute.href
                    ) +
                    '"'
                  );

                } catch {

                  return match;

                }
              }
            );
          }

          return line;
        }

        /*
         * URL segment / sub-playlist
         */

        try {

          const absolute =
            new URL(
              value,
              base
            );

          return makeProxyURL(
            workerOrigin,
            absolute.href
          );

        } catch {

          return line;

        }

      }).join("\n");

    return new Response(
      output,
      {
        status: response.status,

        headers: headers({
          "Content-Type":
            "application/vnd.apple.mpegurl"
        })
      }
    );

  } catch (error) {

    return new Response(
      "HLS Error: " +
      error.message,
      {
        status: 502,
        headers: headers()
      }
    );

  }
}


/*
 * Proxy segment .ts / .m4s / key / playlist lain
 */

async function proxyResource(
  request,
  target
) {

  try {

    const response =
      await fetch(
        target,
        {
          method: request.method,

          headers: {
            "User-Agent":
              "Mozilla/5.0",
            "Accept":
              "*/*",
            "Referer":
              "https://rumble.com/"
          },

          redirect: "follow",

          cf: {
            cacheTtl: 0,
            cacheEverything: false
          }
        }
      );

    const responseHeaders =
      new Headers(response.headers);

    responseHeaders.set(
      "Access-Control-Allow-Origin",
      "*"
    );

    responseHeaders.set(
      "Access-Control-Allow-Methods",
      "GET, HEAD, OPTIONS"
    );

    responseHeaders.set(
      "Access-Control-Allow-Headers",
      "*"
    );

    responseHeaders.set(
      "Cache-Control",
      "no-store"
    );

    return new Response(
      response.body,
      {
        status: response.status,
        statusText:
          response.statusText,
        headers:
          responseHeaders
      }
    );

  } catch (error) {

    return new Response(
      "Segment Error: " +
      error.message,
      {
        status: 502,
        headers: headers()
      }
    );

  }
}
