export const validatePhone = (phone) => {
  if (!phone) return false;
  // Exactly 10 digits, no spaces, dashes or country code prefixes
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};


export const validateEmail = (email) => {
  if (!email) return false;
  // Robust email regex
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email.trim());
};

export const validateName = (name) => {
  if (!name) return false;
  // Alphabets, spaces, dots allowed. Min 2 chars. No numbers/symbols.
  const nameRegex = /^[a-zA-Z\s.]{2,50}$/;
  return nameRegex.test(name.trim());
};

export const validateCity = (city) => {
  if (!city) return false;
  // Alphabets and spaces only. No numbers.
  const cityRegex = /^[a-zA-Z\s]+$/;
  return cityRegex.test(city.trim());
};

export const validateCourse = (course) => {
  if (!course) return false;
  // Alphabets, numbers, spaces, dots, plus signs, hyphens, parentheses allowed
  // e.g., "B.Tech", "C++", "MBA (Finance)", "B-Pharma"
  const courseRegex = /^[a-zA-Z0-9\s.+\-()]+$/;
  return courseRegex.test(course.trim());
};

export const validateYouTubeUrl = (url) => {
  if (!url) return true; // Optional field, so empty is valid if not required
  // Basic validation for YouTube URLs (standard, short, embed)
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
  return youtubeRegex.test(url);
};

export const validateLinkedInUrl = (url) => {
  if (!url) return true; // Optional field
  const linkedInRegex = /^(https?:\/\/)?(www\.)?linkedin\.com\/.*$/i;
  return linkedInRegex.test(url);
};

export const handleNumericInput = (e, maxLength) => {
  const value = e.target.value.replace(/\D/g, '');
  if (maxLength && value.length > maxLength) return undefined;
  return value;
};