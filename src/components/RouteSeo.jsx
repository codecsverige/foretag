import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

export default function RouteSeo() {
  const location = useLocation();
  const origin = typeof window !== "undefined" ? window.location.origin : "https://vagvanner.se";
  const url = `${origin}${location.pathname}${location.search}${location.hash}`;

  // Canonical handled by PageMeta per page; avoid duplicates here
  return (
    <Helmet>
      <meta property="og:url" content={url} />
      <meta name="robots" content="index, follow" />
    </Helmet>
  );
}

