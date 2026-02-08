export const getAssetPath = (path: string): string => {
  // Use basePath in production, empty string for local development
  const basePath = process.env.NODE_ENV === 'production' ? '/deepseekchat' : '';
  return `${basePath}${path}`;
}; 