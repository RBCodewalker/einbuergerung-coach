export function normalizeTitle(label = "") {
  // collapse spaces
  let t = String(label).replace(/\s+/g, " ").trim();

  // If there's a slash form (e.g., "die Bundespräsidentin/der Bundespräsident")
  if (t.includes("/")) {
    // Take the part after the last slash (usually the generic/masc form)
    t = t.split("/").pop() || t;
  }

  // Strip common German articles
  t = t.replace(/\b(der|die|das|den|dem|des)\b\s*/gi, "").trim();

  // Lowercase -> capitalize first letter (cosmetic)
  t = t.charAt(0).toUpperCase() + t.slice(1);
  return t;
}
