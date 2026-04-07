import jsQR from "npm:jsqr";
import jpeg from "npm:jpeg-js";
import { PNG } from "npm:pngjs";
import { Buffer } from "node:buffer";

Deno.serve(async (req) => {
    try {
        const { searchParams } = new URL(req.url);
        const imageUrl = searchParams.get("url");

        if (!imageUrl) {
            return new Response("Missing url", { status: 400 });
        }

        const res = await fetch(imageUrl);
        const contentType = res.headers.get("content-type") || "";

        const buffer = Buffer.from(await res.arrayBuffer());

        let imageData, width, height;

        if (contentType.includes("jpeg") || contentType.includes("jpg")) {
            const decoded = jpeg.decode(buffer, { useTArray: true });
            imageData = decoded.data;
            width = decoded.width;
            height = decoded.height;
        } else if (contentType.includes("png")) {
            const png = PNG.sync.read(buffer);

            width = png.width;
            height = png.height;

            // Flatten transparent pixels onto white background
            imageData = new Uint8ClampedArray(width * height * 4);

            for (let i = 0; i < png.data.length; i += 4) {
                const r = png.data[i];
                const g = png.data[i + 1];
                const b = png.data[i + 2];
                const a = png.data[i + 3] / 255;

                imageData[i] = Math.round(r * a + 255 * (1 - a));
                imageData[i + 1] = Math.round(g * a + 255 * (1 - a));
                imageData[i + 2] = Math.round(b * a + 255 * (1 - a));
                imageData[i + 3] = 255;
            }
        } else {
            return new Response("Unsupported image format", { status: 415 });
        }

        const code = jsQR(imageData, width, height, {
            inversionAttempts: "attemptBoth",
        });

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
