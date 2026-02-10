import { next } from "@vercel/edge";

const OG_OVERRIDES: Record<string, { title: string; description: string; image: string }> = {
  "/arcade/hashout": {
    title: "Hash-Out - Bitari 2100 Arcade",
    description: "Blast bricks to mine blocks! A Breakout-style arcade game in the Bitari 2100 retro Bitcoin wallet.",
    image: "https://bitari2100.vercel.app/hashout_social.png",
  },
  "/arcade/powman": {
    title: "POW-MAN - Bitari 2100 Arcade",
    description: "Energy-intense maze pursuit! A Pac-Man style arcade game in the Bitari 2100 retro Bitcoin wallet.",
    image: "https://bitari2100.vercel.app/powman_social.png",
  },
};

const CRAWLER_RE = /bot|crawl|spider|slurp|facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Discordbot|Embedly|Quora Link Preview|Showyoubot|outbrain|pinterest|vkShare|W3C_Validator/i;

export default function middleware(request: Request) {
  const url = new URL(request.url);
  const override = OG_OVERRIDES[url.pathname];

  if (!override) return next();

  const ua = request.headers.get("user-agent") || "";
  if (!CRAWLER_RE.test(ua)) return next();

  // Serve minimal HTML with correct OG tags for social crawlers
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${override.title}</title>
<meta name="description" content="${override.description}" />
<meta property="og:title" content="${override.title}" />
<meta property="og:description" content="${override.description}" />
<meta property="og:image" content="${override.image}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${url.href}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${override.title}" />
<meta name="twitter:description" content="${override.description}" />
<meta name="twitter:image" content="${override.image}" />
</head>
<body></body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export const config = {
  matcher: ["/arcade/hashout", "/arcade/powman"],
};
