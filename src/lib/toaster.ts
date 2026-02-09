import { createToaster } from '@skeletonlabs/skeleton-svelte';

export const toaster = createToaster(
{
    placement: 'top-end',
    pauseOnPageIdle: true,
    overlap: true,
    max: 5
}
);