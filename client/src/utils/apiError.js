// RTK Query errors come in a few shapes; this turns any of them into one readable line.
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return null;
  if (error.status === 'FETCH_ERROR') return 'Cannot reach the server. Check your connection.';
  if (typeof error.data?.error === 'string') return error.data.error;
  return fallback;
}

export function getErrorDetails(error) {
  return error?.data?.details?.errors ?? [];
}
