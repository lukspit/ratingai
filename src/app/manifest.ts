import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Rating.ai | Inteligência Tributária',
        short_name: 'Rating.ai',
        description: 'IA para análise CAPAG e redução de passivo tributário',
        start_url: '/dashboard',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
            {
                src: '/icon.png',
                sizes: 'any',
                type: 'image/png',
            }
        ],
    }
}
