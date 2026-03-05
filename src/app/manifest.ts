import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Nexus | Clínicas',
        short_name: 'Nexus',
        description: 'A inteligência artificial que atende seus pacientes',
        start_url: '/dashboard',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
            {
                src: '/logos/nexus_logo_symbol.png',
                sizes: 'any',
                type: 'image/png',
            }
        ],
    }
}
