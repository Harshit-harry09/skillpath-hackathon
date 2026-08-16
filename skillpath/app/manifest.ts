import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SkillPath & Atlas Platform',
    short_name: 'SkillPath',
    description: 'Autonomous multi-agent inclusive workforce orchestrator and career discovery platform.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAFDEE',
    theme_color: '#ff4d8b',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
