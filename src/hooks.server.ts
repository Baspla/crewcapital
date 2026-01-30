import { sequence } from '@sveltejs/kit/hooks';
import { handle as authHandle, proxyAuthHandle } from '$lib/server/auth';

// Combine Auth.js handle with proxy auth middleware
export const handle = sequence(authHandle, proxyAuthHandle);
