export function mapErrorToResponse(error: unknown, context?: { route?: string }) {
  const isHttp = typeof error === 'object' && error !== null && 'status' in error
  const status = isHttp ? (error as any).status : 500
  const message = error instanceof Error ? error.message : 'An unknown error occurred'

  // In production log minimal info; in dev include full error for debugging
  if (process.env.NODE_ENV === 'production') {
    console.error(`[api:${context?.route || 'unknown'}] Error: ${message}`)
  } else {
    console.error(`[api:${context?.route || 'unknown'}]`, error)
  }

  return { status, message }
}
