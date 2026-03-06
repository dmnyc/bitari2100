import { getPageMetadata } from "./pageMetadata";

function upsertMeta(
  selector: string,
  attributes: Record<string, string>,
): void {
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element!.setAttribute(key, value);
  });
}

function upsertCanonical(url: string): void {
  let link = document.head.querySelector(
    'link[rel="canonical"]',
  ) as HTMLLinkElement | null;

  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }

  link.href = url;
}

export function applyPageMetadata(pathname: string): void {
  const metadata = getPageMetadata(pathname);

  document.title = metadata.title;
  upsertCanonical(metadata.url);

  upsertMeta('meta[name="description"]', {
    name: "description",
    content: metadata.description,
  });
  upsertMeta('meta[property="og:title"]', {
    property: "og:title",
    content: metadata.title,
  });
  upsertMeta('meta[property="og:description"]', {
    property: "og:description",
    content: metadata.description,
  });
  upsertMeta('meta[property="og:image"]', {
    property: "og:image",
    content: metadata.image,
  });
  upsertMeta('meta[property="og:image:alt"]', {
    property: "og:image:alt",
    content: metadata.imageAlt,
  });
  upsertMeta('meta[property="og:image:width"]', {
    property: "og:image:width",
    content: metadata.imageWidth,
  });
  upsertMeta('meta[property="og:image:height"]', {
    property: "og:image:height",
    content: metadata.imageHeight,
  });
  upsertMeta('meta[property="og:type"]', {
    property: "og:type",
    content: metadata.type,
  });
  upsertMeta('meta[property="og:url"]', {
    property: "og:url",
    content: metadata.url,
  });
  upsertMeta('meta[name="twitter:card"]', {
    name: "twitter:card",
    content: metadata.twitterCard,
  });
  upsertMeta('meta[name="twitter:title"]', {
    name: "twitter:title",
    content: metadata.title,
  });
  upsertMeta('meta[name="twitter:description"]', {
    name: "twitter:description",
    content: metadata.description,
  });
  upsertMeta('meta[name="twitter:image"]', {
    name: "twitter:image",
    content: metadata.image,
  });
}
