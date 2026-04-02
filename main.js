import jsQR from "npm:jsqr";

Deno.serve(async (req) => {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return new Response("Missing url", { status: 400 });
  }

  const res = await fetch(imageUrl);
  const buffer = await res.arrayBuffer();

  const bitmap = await createImageBitmap(new Blob([buffer]));
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

  const code = jsQR(imageData.data, bitmap.width, bitmap.height);

  if (!code) {
    return new Response("No QR code", { status: 404 });
  }

  return new Response(code.data);
});
