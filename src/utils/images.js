/**
 * Get the source URL for a question image
 * @param {Object} question - Question object
 * @returns {string|null} Image URL or null if no image
 */
export function getImageSrc(question) {
  if (!question?.image) return null;
  
  const imageValue = question.image;
  
  // If it's already a full URL, return it
  if (typeof imageValue === 'string' && /^https?:\/\//i.test(imageValue)) {
    return imageValue;
  }
  
  // Otherwise construct local path
  return `${process.env.PUBLIC_URL}/images/image-${question.id}.png`;
}