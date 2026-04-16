import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard', '/onboarding', '/settings'],
      },
    ],
    sitemap: 'https://www.trybrainrank.com/sitemap.xml',
    host: 'https://www.trybrainrank.com',
  }
}
