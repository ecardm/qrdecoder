import jsQR from "npm:jsqr";
import jpeg from "npm:jpeg-js";
import { PNG } from "npm:pngjs";

Deno.serve(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return new Response("Missing url", { status: 400 });
    }

    const res = await fetch(imageUrl);
    const contentType = res.headers.get("content-type") || "";
    const buffer = new Uint8Array(await res.arrayBuffer());

    let imageData, width, height;

    if (contentType.includes("jpeg") || contentType.includes("jpg")) {
      const decoded = jpeg.decode(buffer, { useTArray: true });
      imageData = decoded.data;
      width = decoded.width;
      height = decoded.height;
    } else if (contentType.includes("png")) {
      const png = PNG.sync.read(buffer);
      imageData = png.data;
      width = png.width;
      height = png.height;
    } else {
      return new Response("Unsupported image format", { status: 415 });
    }

    const code = jsQR(imageData, width, height);

    if (!code) {
      return new Response("No QR code found", { status: 404 });
    }

    return new Response(code.data, {
      headers: { "content-type": "text/plain" },
    });

  } catch (err) {
    return new Response("Error: " + err.message, { status: 500 });
  }
});
