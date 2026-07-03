import { getBaseUrl } from '../api/client';

export const resolveImageUrl = (url: string) => {
  if (!url) return 'https://via.placeholder.com/400';
  if (url.startsWith('http')) return url;
  
  // getBaseUrl() returns something like "http://192.168.x.x:5055/api"
  // we want to strip the "/api" part and append the relative URL
  const baseUrl = getBaseUrl().replace(/\/api$/, '');
  return `${baseUrl}${url}`;
};
