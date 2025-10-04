import posthog from 'posthog-js'

export function usePostHog() {
  posthog.init('phc_ejGujCxufJwUzSaVTfeJpcyMpRfnxu74gfClCu8UijF', {
    api_host: 'https://eu.i.posthog.com',
    defaults: '2025-05-24',
    person_profiles: 'always', // or 'always' to create profiles for anonymous users as well
  })

  return { posthog }
}
