import { ImageResponse } from "next/og";
import { translateAmountCompound } from "@/lib/translations";
import { formatMoney } from "@/lib/format";

export const runtime = "edge";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const amount = Math.max(0, Number(url.searchParams.get("amount") || 0));
  const total = Math.max(0, Number(url.searchParams.get("total") || amount));
  const orientation = url.searchParams.get("o") || "story"; // "story" or "post"

  const isStory = orientation === "story";
  const width = isStory ? 1080 : 1080;
  const height = isStory ? 1920 : 1080;

  const headline = amount > 0
    ? `+${formatMoney(amount, "USD", { compact: true })} kept`
    : `${formatMoney(total, "USD", { compact: true })} kept`;

  const translation = translateAmountCompound(total > 0 ? total : amount);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background:
            "linear-gradient(160deg, #faf6f1 0%, #f5dde6 50%, #e3ecdc 100%)",
          padding: 80,
          textAlign: "center",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#6b5a6e",
            display: "flex",
          }}
        >
          Linger
        </div>
        <div
          style={{
            fontSize: isStory ? 220 : 180,
            color: "#2a1a2e",
            marginTop: 60,
            lineHeight: 1,
            display: "flex",
          }}
        >
          {headline}
        </div>
        <div
          style={{
            fontSize: 38,
            color: "#2a1a2e",
            marginTop: 30,
            display: "flex",
          }}
        >
          ✨
        </div>
        <div
          style={{
            fontSize: 36,
            color: "#6b5a6e",
            marginTop: 80,
            maxWidth: 800,
            display: "flex",
            textAlign: "center",
          }}
        >
          ≈ {translation}
        </div>
      </div>
    ),
    { width, height }
  );
}
