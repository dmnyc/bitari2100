import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readFileSync } from "fs";
import { join } from "path";
import {
  getPageMetadata,
  normalizePathname,
  OG_ROUTE_PATHS,
} from "../src/utils/pageMetadata";

const CRAWLER_RE =
  /bot|crawl|spider|slurp|facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Discordbot|Embedly|Quora Link Preview|Showyoubot|outbrain|pinterest|vkShare|W3C_Validator/i;

export default function handler(req: VercelRequest, res: VercelResponse) {
  const path = normalizePathname(req.query.path as string);

  if (!OG_ROUTE_PATHS.includes(path)) {
    res.redirect(302, "/");
    return;
  }

  const metadata = getPageMetadata(path);
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
