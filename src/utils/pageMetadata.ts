export const SITE_ORIGIN = "https://bitari2100.vercel.app";

export interface PageMetadata {
  title: string;
  description: string;
  image: string;
  url: string;
  imageAlt: string;
  imageWidth: string;
  imageHeight: string;
  type: "website";
  twitterCard: "summary_large_image";
}

const DEFAULT_TITLE = "Bitari 2100";
const DEFAULT_DESCRIPTION =
  "Bitari 2100 - A retro-themed Bitcoin Lightning wallet powered by Breez SDK";
const DEFAULT_IMAGE = `${SITE_ORIGIN}/bitari_social.png`;

const ROUTE_METADATA: Record<
  string,
  Pick<PageMetadata, "title" | "description" | "image" | "imageAlt">
> = {
  "/": {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    image: DEFAULT_IMAGE,
    imageAlt: "Bitari 2100 retro Bitcoin wallet social card",
  },
  "/arcade": {
    title: "Bitari 2100 Arcade",
    description:
      "Retro Bitcoin arcade games inside the Bitari 2100 Lightning wallet.",
    image: DEFAULT_IMAGE,
    imageAlt: "Bitari 2100 Arcade social card",
  },
  "/arcade/hashout": {
    title: "Hash-Out - Bitari 2100 Arcade",
    description:
      "Blast bricks to mine blocks! A Breakout-style arcade game in the Bitari 2100 retro Bitcoin wallet.",
    image: `${SITE_ORIGIN}/hashout_social.png`,
    imageAlt: "Hash-Out social card",
  },
  "/arcade/powman": {
    title: "POW-MAN - Bitari 2100 Arcade",
    description:
      "Energy-intense maze pursuit! An arcade game in the Bitari 2100 retro Bitcoin wallet.",
    image: `${SITE_ORIGIN}/powman_social.png`,
    imageAlt: "POW-MAN social card",
  },
  "/arcade/diphopper": {
    title: "Dip Hopper - Bitari 2100 Arcade",
    description:
      "Help Pepe leap to the citadels! A retro-style frog jump arcade game in the Bitari 2100 Bitcoin wallet.",
    image: `${SITE_ORIGIN}/diphopper_social.png`,
    imageAlt: "Dip Hopper social card",
  },
  "/arcade/asterordinals": {
    title: "Asterordinals - Bitari 2100 Arcade",
    description:
      "Obliterate the JPEGs! A retro space shooter arcade game in the Bitari 2100 Bitcoin wallet.",
    image: `${SITE_ORIGIN}/asterordinals_social.png`,
    imageAlt: "Asterordinals social card",
  },
};

export const OG_ROUTE_PATHS = Object.freeze([
  "/arcade/hashout",
  "/arcade/powman",
  "/arcade/diphopper",
  "/arcade/asterordinals",
]);

export function normalizePathname(pathname: string): string {
  const pathWithoutQuery = pathname.split(/[?#]/, 1)[0] ?? pathname;
  return pathWithoutQuery.replace(/\/+$/, "") || "/";
}

export function getPageMetadata(pathname: string): PageMetadata {
  const normalizedPath = normalizePathname(pathname);
  const routeMetadata =
    ROUTE_METADATA[normalizedPath] ?? ROUTE_METADATA["/"];
  const url =
    normalizedPath === "/"
      ? SITE_ORIGIN
      : `${SITE_ORIGIN}${normalizedPath}`;

  return {
    ...routeMetadata,
    url,
    imageWidth: "1200",
    imageHeight: "675",
    type: "website",
    twitterCard: "summary_large_image",
  };
}
