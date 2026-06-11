export function PageLoading({ message }: { message: string }) {
  return (
    <p className="page-loading" role="status">
      <span className="page-loading__spinner" aria-hidden="true" />
      <span>{message}</span>
    </p>
  )
}
