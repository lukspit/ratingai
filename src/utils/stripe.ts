import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is missing. Please set the environment variable.')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-02-25.clover', // Update to the latest version you're using.
    appInfo: {
        name: 'Nexus Clínicas SaaS',
        version: '0.1.0',
    },
})
