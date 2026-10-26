import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Server requires a JSON body on every write (CSRF guard), so cancels send `{}`.
const EMPTY_BODY = {};

// After login or register: drop data cached for whoever was here before,
// then put the new user straight into the getMe cache (saves one request).
async function startFreshSession(_, { dispatch, queryFulfilled }) {
  try {
    const { data: user } = await queryFulfilled;
    dispatch(api.util.resetApiState());
    dispatch(api.util.upsertQueryData('getMe', undefined, user));
  } catch {
    // Failed login: the component shows the error, nothing to update here.
  }
}

const rawBaseQuery = fetchBaseQuery({ baseUrl: '/api', credentials: 'include' });

// A 401 on any call means the session is gone (expired, logged out in another
// tab, or the server restarted). Marking the user as logged out lets
// ProtectedRoute send them to the login page instead of showing a broken screen.
async function baseQueryWithSessionCheck(args, queryApi, extraOptions) {
  const result = await rawBaseQuery(args, queryApi, extraOptions);
  if (result.error?.status === 401 && queryApi.endpoint !== 'login') {
    queryApi.dispatch(api.util.upsertQueryData('getMe', undefined, null));
  }
  return result;
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithSessionCheck,
  tagTypes: ['Me', 'Slots', 'CollectionSlots', 'Consultations', 'LabBookings', 'Orders'],
  endpoints: (build) => ({
    // ---- Auth ----
    // Resolves to the user object, or null when logged out.
    getMe: build.query({
      query: () => '/auth/me',
      transformResponse: (response) => response.user,
      providesTags: ['Me'],
    }),
    login: build.mutation({
      query: (credentials) => ({ url: '/auth/login', method: 'POST', body: credentials }),
      transformResponse: (response) => response.user,
      onQueryStarted: startFreshSession,
    }),
    register: build.mutation({
      query: (details) => ({ url: '/auth/register', method: 'POST', body: details }),
      transformResponse: (response) => response.user,
      onQueryStarted: startFreshSession,
    }),
    logout: build.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST', body: EMPTY_BODY }),
    }),

    // ---- Doctors ----
    getDoctors: build.query({
      query: (params) => ({ url: '/doctors', params }),
    }),
    getAvailabilityBoard: build.query({
      query: () => '/doctors/board',
      providesTags: ['Slots'],
    }),
    getDoctorFilters: build.query({
      query: () => '/doctors/filters',
    }),
    getDoctor: build.query({
      query: (id) => `/doctors/${id}`,
      transformResponse: (response) => response.doctor,
    }),
    getDoctorSlots: build.query({
      query: ({ doctorId, date }) => ({ url: `/doctors/${doctorId}/slots`, params: { date } }),
      transformResponse: (response) => response.slots,
      providesTags: (result, error, { doctorId, date }) => [{ type: 'Slots', id: `${doctorId}:${date}` }],
    }),

    // ---- Consultations ----
    getConsultations: build.query({
      query: () => '/consultations',
      transformResponse: (response) => response.items,
      providesTags: ['Consultations'],
    }),
    bookConsultation: build.mutation({
      query: (booking) => ({ url: '/consultations', method: 'POST', body: booking }),
      transformResponse: (response) => response.consultation,
      // 'Slots' without an id refreshes every slot list and the home page board.
      invalidatesTags: ['Consultations', 'Slots'],
    }),
    cancelConsultation: build.mutation({
      query: (id) => ({ url: `/consultations/${id}/cancel`, method: 'PATCH', body: EMPTY_BODY }),
      invalidatesTags: ['Consultations', 'Slots'],
    }),

    // ---- Lab tests ----
    getLabTests: build.query({
      query: () => '/lab-tests',
      transformResponse: (response) => response.items,
    }),
    getCollectionSlots: build.query({
      query: (date) => ({ url: '/lab-tests/collection-slots', params: { date } }),
      transformResponse: (response) => response.slots,
      providesTags: (result, error, date) => [{ type: 'CollectionSlots', id: date }],
    }),
    getLabBookings: build.query({
      query: () => '/lab-bookings',
      transformResponse: (response) => response.items,
      providesTags: ['LabBookings'],
    }),
    bookLabTests: build.mutation({
      query: (booking) => ({ url: '/lab-bookings', method: 'POST', body: booking }),
      transformResponse: (response) => response.booking,
      invalidatesTags: (result, error, { date }) => ['LabBookings', { type: 'CollectionSlots', id: date }],
    }),
    cancelLabBooking: build.mutation({
      query: (id) => ({ url: `/lab-bookings/${id}/cancel`, method: 'PATCH', body: EMPTY_BODY }),
      invalidatesTags: ['LabBookings', 'CollectionSlots'],
    }),

    // ---- Pharmacy ----
    getMedicines: build.query({
      query: (search) => ({ url: '/medicines', params: search ? { search } : undefined }),
      transformResponse: (response) => response.items,
    }),
    getOrders: build.query({
      query: () => '/orders',
      transformResponse: (response) => response.items,
      providesTags: ['Orders'],
    }),
    placeOrder: build.mutation({
      query: (order) => ({ url: '/orders', method: 'POST', body: order }),
      transformResponse: (response) => response.order,
      invalidatesTags: ['Orders'],
    }),
    cancelOrder: build.mutation({
      query: (id) => ({ url: `/orders/${id}/cancel`, method: 'PATCH', body: EMPTY_BODY }),
      invalidatesTags: ['Orders'],
    }),
  }),
});

export const {
  useGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetDoctorsQuery,
  useGetAvailabilityBoardQuery,
  useGetDoctorFiltersQuery,
  useGetDoctorQuery,
  useGetDoctorSlotsQuery,
  useGetConsultationsQuery,
  useBookConsultationMutation,
  useCancelConsultationMutation,
  useGetLabTestsQuery,
  useGetCollectionSlotsQuery,
  useGetLabBookingsQuery,
  useBookLabTestsMutation,
  useCancelLabBookingMutation,
  useGetMedicinesQuery,
  useGetOrdersQuery,
  usePlaceOrderMutation,
  useCancelOrderMutation,
} = api;
