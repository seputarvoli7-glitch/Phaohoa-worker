const SOURCE =
  "https://hugh.cdn.rumble.cloud/live/3fms19g4/live-hls/sqg5-axz7/chunklist_i0_DVR.m3u8";

const ALLOWED_ORIGIN = "*";

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    const url = new URL(request.url);

    try {
      // Ambil URL sumber HLS.
      // Jika ?url= diberikan, gunakan URL tersebut.
      // Jika tidak, gunakan SOURCE.
      let target = url.searchParams.get("url") || SOURCE;

      // Hanya izinkan URL HTTPS.
      if (!target.startsWith("https://")) {
        return new Response("Invalid URL", {
          status: 400,
          headers: corsHeaders()
        });
      }

      const response = await fetch(target, {
        method: "GET",
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

      if (!response.ok) {
        return new Response(
          `Upstream error: ${response.status}`,
          {
            status: response.status,
            headers: corsHeaders()
          }
        );
      }

      const contentType =
        response.headers.get("content-type") ||
        "";

      // Playlist M3U8
      if (
        contentType.includes("mpegurl") ||
        contentType.includes("m3u8") ||
        target.includes(".m3u8")
      ) {
        const text = await response.text();

        const baseURL = new URL(target);

        const rewritten = text
          .split("\n")
          .map((line) => {
            const trimmed = line.trim();

            if (!trimmed || trimmed.startsWith("#")) {
              return line;
            }

            try {
              const absoluteURL =
                new URL(trimmed, baseURL).toString();

              return (
                url.origin +
                "/?url=" +
                encodeURIComponent(absoluteURL)
              );
            } catch {
              return line;
            }
          })
          .join("\n");

        return new Response(rewritten, {
          status: 200,
          headers: {
            "Content-Type":
              "application/vnd.apple.mpegurl",
            "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
            "Access-Control-Allow-Methods":
              "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }
        });
      }

      // Segment video (.ts / .m4s / dll)
      return new Response(response.body, {
        status: response.status,
        headers: {
          "Content-Type":
            response.headers.get("content-type") ||
            "video/mp2t",
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          "Access-Control-Allow-Methods":
            "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "*",
          "Cache-Control": "no-cache"
        }
      });

    } catch (error) {
      return new Response(
        "Rumble HLS Worker Error: " + error.message,
        {
          status: 500,
          headers: corsHeaders()
        }
      );
    }
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods":
      "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Cache-Control": "no-cache"
  };
}        const value =
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
