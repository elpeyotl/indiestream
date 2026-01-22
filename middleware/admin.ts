// Admin route middleware - checks if user has admin role
export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()
  const client = useSupabaseClient()

  if (!user.value) {
    return navigateTo('/login')
  }

  // Check if user has admin role
  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.value.id)
    .single<{ role: string | null }>()

  if (profile?.role !== 'admin') {
    return navigateTo('/')
  }
})
