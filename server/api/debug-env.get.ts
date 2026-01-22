// TEMPORARY DEBUG ENDPOINT - DELETE AFTER TESTING!
export default defineEventHandler(() => {
  const config = useRuntimeConfig()
  return {
    appUrl: config.public.appUrl,
    nodeEnv: process.env.NODE_ENV,
    // Never expose secrets here!
  }
})
