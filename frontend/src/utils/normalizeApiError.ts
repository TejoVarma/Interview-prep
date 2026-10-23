import axios from 'axios'

interface ValidationIssue {
  loc: (string | number)[]
  msg: string
}

export function normalizeApiError(err: unknown): string {
  if (!axios.isAxiosError(err)) return 'Something went wrong.'

  if (err.code === 'ECONNABORTED') return 'The server took too long to respond.'
  if (!err.response) return 'Cannot reach the server. Check your connection.'

  const detail = err.response.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return (detail as ValidationIssue[])
      .map((issue) => {
        const field = issue.loc.filter((part) => part !== 'body').join('.')
        return field ? `${field}: ${issue.msg}` : issue.msg
      })
      .join('; ')
  }

  return `Request failed (${err.response.status}).`
}
