const SOURCE =
  "https://rumble.com/live-hls-dvr/9eS2GvvIz54/playlist.m3u8";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "*"
};

export default {
  async fetch(request) {

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS
      });
    }

    if (request.method !== "GET" &&
        request.method !== "HEAD") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: CORS
      });
    }

    try {

      const response = await fetch(SOURCE, {
        method: request.method,
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "*/*"
        },
        redirect: "follow"
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
        "Cache-Control",
        "no-store"
      );

      return new Response(
        response.body,
        {
          status: response.status,
          headers
        }
      );

    } catch (error) {

      return new Response(
        "Source error: " + error.message,
        {
          status: 502,
          headers: CORS
        }
      );

    }
  }
};        })
      }
    );
  }
};


/*
 * Proxy playlist M3U8
 */

async function proxyHLS(
  request,
  source,
  workerOrigin
) {

  try {

    const response = await fetch(
      source,
      {
        method: request.method,

        headers: {
          "User-Agent":
            "Mozilla/5.0",
          "Accept":
            "application/vnd.apple.mpegurl,*/*",
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
