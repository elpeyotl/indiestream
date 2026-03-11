// GET /api/upload/client-ip - Return the client's IP address
// Used for terms acceptance logging

export default defineEventHandler((event) => {
  const forwarded = getHeader(event, 'x-forwarded-for')
  const realIp = getHeader(event, 'x-real-ip')
  const ip = forwarded?.split(',')[0]?.trim() || realIp || null

  return { ip }
})
