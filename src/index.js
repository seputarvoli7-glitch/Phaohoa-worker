const SOURCE =
  "https://hugh.cdn.rumble.cloud/live/3fms19g4/live-hls/sqg5-axz7/chunklist_i0_DVR.m3u8";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Cache-Control": "no-cache"
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: cors
      });
    }

    const reqUrl = new URL(request.url);
    const target = reqUrl.searchParams.get("url") || SOURCE;

    try {
      const response = await fetch(target, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "*/*"
        }
      });

      if (!response.ok) {
        return new Response("Upstream error: " + response.status, {
          status: response.status,
          headers: cors
        });
      }

      const type = response.headers.get("content-type") || "";

      if (
        type.includes("mpegurl") ||
        type.includes("m3u8") ||
        target.includes(".m3u8")
      ) {
        const text = await response.text();
        const base = new URL(target);

        const playlist = text
          .split("\n")
          .map(line => {
            const value = line.trim();

            if (!value || value.startsWith("#")) {
              return line;
            }

            try {
              const absolute = new URL(value, base).href;

              return "/?url=" + encodeURIComponent(absolute);
            } catch {
              return line;
            }
          })
          .join("\n");

        return new Response(playlist, {
          headers: {
            ...cors,
            "Content-Type": "application/vnd.apple.mpegurl"
          }
        });
      }

      return new Response(response.body, {
        status: response.status,
        headers: {
          ...cors,
          "Content-Type":
            response.headers.get("content-type") || "video/mp2t"
        }
      });

    } catch (error) {
      return new Response(
        "Worker Error: " + error.message,
        {
          status: 500,
          headers: cors
        }
      );
    }
  }
};
