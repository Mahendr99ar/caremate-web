import { useGetMeQuery } from '../services/api';

// Options for queries that load the signed-in user's own data (bookings, orders).
// They are skipped whenever we don't know of a signed-in user, for example in
// the moment after logout clears the cache, so they never fire a request that
// is certain to come back 401.
export function useSignedInQueryOptions() {
  const { data: user } = useGetMeQuery();
  return { skip: !user };
}
