import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://beautify-africa.com';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

export default function Seo({
  title,
  description,
  path = '/',
  image = DEFAULT_IMAGE,
  imageAlt,
  type = 'website',
  structuredData,
}) {
  const canonicalUrl = new URL(path, SITE_URL).toString();

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      {imageAlt ? <meta property="og:image:alt" content={imageAlt} /> : null}
      <meta property="og:site_name" content="Beautify Africa" />
      <meta property="og:locale" content="en_US" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {imageAlt ? <meta name="twitter:image:alt" content={imageAlt} /> : null}

      {structuredData ? (
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      ) : null}
    </Helmet>
  );
}
