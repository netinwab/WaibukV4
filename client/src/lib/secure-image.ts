// Helper function to create secure image URLs with user authentication
export function getSecureImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  
  // Get user ID from localStorage for authentication
  const userString = localStorage.getItem("user") || "{}";
  const user = JSON.parse(userString);
  
  if (!user?.id) {
    console.warn("No user ID found for secure image access, returning original URL");
    return imageUrl; // Fallback to original URL if no user
  }
  
  // If it's already a secure URL, add userId parameter
  if (imageUrl.includes('/api/secure-image/')) {
    return `${imageUrl}?userId=${user.id}`;
  }
  
  // Convert regular image URLs to secure endpoints
  if (imageUrl.includes('/uploads/memories/')) {
    const filename = imageUrl.split('/').pop();
    return `/api/secure-image/memories/${filename}?userId=${user.id}`;
  }
  
  if (imageUrl.includes('/uploads/yearbooks/')) {
    const filename = imageUrl.split('/').pop();
    return `/api/secure-image/yearbooks/${filename}?userId=${user.id}`;
  }
  
  // Return original URL for other cases
  return imageUrl;
}