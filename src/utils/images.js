/**
 * Get the source URL for a question image
 * @param {Object} question - Question object
 * @param {string} stateKey - Optional state key for state-specific images
 * @returns {string|null} Image URL or null if no image
 */
export function getImageSrc(question, stateKey = null) {
  if (!question?.image) return null;
  
  const imageValue = question.image;
  
  // If it's already a full URL, return it
  if (typeof imageValue === 'string' && /^https?:\/\//i.test(imageValue)) {
    return imageValue;
  }
  
  // Check if this is a state question (ID 301-310)
  if (question.id >= 301 && question.id <= 310 && stateKey) {
    return `${process.env.PUBLIC_URL}/images/${stateKey}/image-${question.id}.png`;
  }
  
  // Otherwise construct local path
  return `${process.env.PUBLIC_URL}/images/image-${question.id}.png`;
}