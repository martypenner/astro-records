import pThrottle from 'p-throttle';

export const apiThrottle = pThrottle({
  limit: 5,
  interval: 1000,
});
