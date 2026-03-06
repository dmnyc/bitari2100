import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readFileSync } from "fs";
import { join } from "path";

const OG_OVERRIDES: Record<
  string,
  { title: string; description: string; image: string }
> = {
  "/arcade/hashout": {
    title: "Hash-Out - Bitari 2100 Arcade",
    description:
      "Blast bricks to mine blocks! A Breakout-style arcade game in the Bitari 2100 retro Bitcoin wallet.",
    image: "https://bitari2100.vercel.app/hashout_social.png",
  },
  "/arcade/powman": {
    title: "POW-MAN - Bitari 2100 Arcade",
    description:
      "Energy-intense maze pursuit! An arcade game in the Bitari 2100 retro Bitcoin wallet.",
    image: "https://bitari2100.vercel.app/powman_social.png",
  },
  "/arcade/diphopper": {
    title: "Dip Hopper - Bitari 2100 Arcade",
    description:
      "Help Pepe leap to the citadels! A retro-style frog jump arcade game in the Bitari 2100 Bitcoin wallet.",
    image: "https://bitari2100.vercel.app/diphopper_social.png",
  },
  "/arcade/asterordinals": {
    title: "Asterordinals - Bitari 2100 Arcade",
    description:
      "Obliterate the JPEGs! A retro space shooter arcade game in the Bitari 2100 Bitcoin wallet.",
    image: "https://bitari2100.vercel.app/asterordinals_social.png",
  },
};

const CRAWLER_RE =
  /bot|crawl|spider|slurp|facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Discordbot|Embedly|Quora Link Preview|Showyoubot|outbrain|pinterest|vkShare|W3C_Validator/i;

export default function handler(req: VercelRequest, res: VercelResponse) {
  const path = req.query.path as string;
  const override = OG_OVERRIDES[path];

  if (!override) {
    res.redirect(302, "/");
    return;
  }

  const url = `https://bitari2100.vercel.app${path}`;
  const ogTags = `<title>${override.title}</title>
<meta name="description" content="${override.description}" />
<meta property="og:title" content="${override.title}" />
<meta property="og:description" content="${override.description}" />
<meta property="og:image" content="${override.image}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${url}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${override.title}" />
<meta name="twitter:description" content="${override.description}" />
<meta name="twitter:image" content="${override.image}" />`;

  const ua = req.headers["user-agent"] || "";
  if (!CRAWLER_RE.test(ua)) {
    // Real user — serve the SPA index.html with game-specific OG tags
    try {
      let html = readFileSync(
        join(process.cwd(), "dist", "index.html"),
        "utf-8",
      );
      // Strip default OG/twitter meta tags and title, inject game-specific ones
      html = html.replace(/<title>.*?<\/title>/, "");
      html = html.replace(/<meta\s+(property="og:|name="twitter:|name="description")[^>]*\/?>(\s*\n?)/g, "");
      html = html.replace(/(<head[^>]*>)/, `$1\n${ogTags}`);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(200).send(html);
    } catch {
      res.redirect(302, "/");
    }
    return;
  }

  // Crawler — serve minimal HTML with OG tags
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
${ogTags}
</head>
<body></body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
