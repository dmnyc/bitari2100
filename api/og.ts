import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readFileSync } from "fs";
import { join } from "path";

const SITE_ORIGIN = "https://bitari2100.vercel.app";

type OgMetadata = {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  imageWidth: string;
  imageHeight: string;
  type: "website";
  twitterCard: "summary_large_image";
  url: string;
};

const OG_OVERRIDES: Record<string, OgMetadata> = {
  "/arcade/hashout": {
    title: "Hash-Out - Bitari 2100 Arcade",
    description:
      "Blast bricks to mine blocks! A Breakout-style arcade game in the Bitari 2100 retro Bitcoin wallet.",
    image: `${SITE_ORIGIN}/hashout_social.png`,
    imageAlt: "Hash-Out social card",
    imageWidth: "1200",
    imageHeight: "675",
    type: "website",
    twitterCard: "summary_large_image",
    url: `${SITE_ORIGIN}/arcade/hashout`,
  },
  "/arcade/powman": {
    title: "POW-MAN - Bitari 2100 Arcade",
    description:
      "Energy-intense maze pursuit! An arcade game in the Bitari 2100 retro Bitcoin wallet.",
    image: `${SITE_ORIGIN}/powman_social.png`,
    imageAlt: "POW-MAN social card",
    imageWidth: "1200",
    imageHeight: "675",
    type: "website",
    twitterCard: "summary_large_image",
    url: `${SITE_ORIGIN}/arcade/powman`,
  },
  "/arcade/diphopper": {
    title: "Dip Hopper - Bitari 2100 Arcade",
    description:
      "Help Pepe leap to the citadels! A retro-style frog jump arcade game in the Bitari 2100 Bitcoin wallet.",
    image: `${SITE_ORIGIN}/diphopper_social.png`,
    imageAlt: "Dip Hopper social card",
    imageWidth: "1200",
    imageHeight: "675",
    type: "website",
    twitterCard: "summary_large_image",
    url: `${SITE_ORIGIN}/arcade/diphopper`,
  },
  "/arcade/asterordinals": {
    title: "Asterordinals - Bitari 2100 Arcade",
    description:
      "Obliterate the JPEGs! A retro space shooter arcade game in the Bitari 2100 Bitcoin wallet.",
    image: `${SITE_ORIGIN}/asterordinals_social.png`,
    imageAlt: "Asterordinals social card",
    imageWidth: "1200",
    imageHeight: "675",
    type: "website",
    twitterCard: "summary_large_image",
    url: `${SITE_ORIGIN}/arcade/asterordinals`,
  },
};

function normalizePathname(pathname: string): string {
  const pathWithoutQuery = pathname.split(/[?#]/, 1)[0] ?? pathname;
  return pathWithoutQuery.replace(/\/+$/, "") || "/";
}

const CRAWLER_RE =
  /bot|crawl|spider|slurp|facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Discordbot|Embedly|Quora Link Preview|Showyoubot|outbrain|pinterest|vkShare|W3C_Validator/i;

export default function handler(req: VercelRequest, res: VercelResponse) {
  const path = normalizePathname(req.query.path as string);

  const metadata = OG_OVERRIDES[path];
  if (!metadata) {
    res.redirect(302, "/");
    return;
  }

  const ogTags = `<title>${metadata.title}</title>
<meta name="description" content="${metadata.description}" />
<meta property="og:title" content="${metadata.title}" />
<meta property="og:description" content="${metadata.description}" />
<meta property="og:image" content="${metadata.image}" />
<meta property="og:image:alt" content="${metadata.imageAlt}" />
<meta property="og:image:width" content="${metadata.imageWidth}" />
<meta property="og:image:height" content="${metadata.imageHeight}" />
<meta property="og:type" content="${metadata.type}" />
<meta property="og:url" content="${metadata.url}" />
<meta name="twitter:card" content="${metadata.twitterCard}" />
<meta name="twitter:title" content="${metadata.title}" />
<meta name="twitter:description" content="${metadata.description}" />
<meta name="twitter:image" content="${metadata.image}" />`;

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
      html = html.replace(
        /<meta\s+(property="og:|name="twitter:|name="description")[^>]*\/?>(\s*\n?)/g,
        "",
      );
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
