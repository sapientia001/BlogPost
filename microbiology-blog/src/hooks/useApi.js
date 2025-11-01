import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';

export const useApi = () => {
  const queryClient = useQueryClient();

  // Generic GET query hook
  const useGetQuery = (queryKey, queryFn, options = {}) => {
    return useQuery(queryKey, queryFn, {
      retry: 1,
      refetchOnWindowFocus: false,
      onError: (error) => {
        if (options.onError) {
          options.onError(error);
        } else {
          toast.error(error.response?.data?.message || 'Something went wrong');
        }
      },
      ...options,
    });
  };

  // Generic POST mutation hook
  const usePostMutation = (mutationFn, options = {}) => {
    return useMutation(mutationFn, {
      onSuccess: (data, variables, context) => {
        if (options.onSuccess) {
          options.onSuccess(data, variables, context);
        } else {
          toast.success('Operation completed successfully');
        }
      },
      onError: (error, variables, context) => {
        if (options.onError) {
          options.onError(error, variables, context);
        } else {
          toast.error(error.response?.data?.message || 'Something went wrong');
        }
      },
      ...options,
    });
  };

  // Generic PUT mutation hook
  const usePutMutation = (mutationFn, options = {}) => {
    return useMutation(mutationFn, {
      onSuccess: (data, variables, context) => {
        if (options.onSuccess) {
          options.onSuccess(data, variables, context);
        } else {
          toast.success('Update completed successfully');
        }
      },
      onError: (error, variables, context) => {
        if (options.onError) {
          options.onError(error, variables, context);
        } else {
          toast.error(error.response?.data?.message || 'Something went wrong');
        }
      },
      ...options,
    });
  };

  // Generic DELETE mutation hook
  const useDeleteMutation = (mutationFn, options = {}) => {
    return useMutation(mutationFn, {
      onSuccess: (data, variables, context) => {
        if (options.onSuccess) {
          options.onSuccess(data, variables, context);
        } else {
          toast.success('Deleted successfully');
        }
      },
      onError: (error, variables, context) => {
        if (options.onError) {
          options.onError(error, variables, context);
        } else {
          toast.error(error.response?.data?.message || 'Something went wrong');
        }
      },
      ...options,
    });
  };

  // Invalidate queries
  const invalidateQueries = (queryKey) => {
    queryClient.invalidateQueries(queryKey);
  };

  // Refetch queries
  const refetchQueries = (queryKey) => {
    queryClient.refetchQueries(queryKey);
  };

  return {
    useGetQuery,
    usePostMutation,
    usePutMutation,
    useDeleteMutation,
    invalidateQueries,
    refetchQueries,
  };
};

export default useApi;