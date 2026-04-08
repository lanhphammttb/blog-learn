/**
 * Retrieves the localized value for a given field from a database document.
 * Follows the flat localization strategy where English fields have an '_en' suffix.
 * 
 * @param doc The document object from the database
 * @param fieldName The base name of the field (e.g. 'title', 'content')
 * @param locale The current active locale (e.g. 'en', 'vi')
 * @returns The localized string or the fallback default string.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getLocalizedField(doc: any, fieldName: string, locale: string): string {
  if (!doc) return '';
  
  if (locale === 'en') {
    const enField = `${fieldName}_en`;
    // If the _en field exists and is not an empty string, return it
    if (doc[enField] && typeof doc[enField] === 'string' && doc[enField].trim() !== '') {
      return doc[enField];
    }
  }
  
  // Fallback to the primary field (Vietnamese)
  return doc[fieldName as keyof typeof doc] as string || '';
}

/**
 * Returns a new object where all specified fields are replaced by their localized versions.
 * This is useful for passing localized objects to React Client Components.
 * 
 * @param doc The document object from the database
 * @param fields Array of field names to localize
 * @param locale The current active locale
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function localizeDocument<T extends Record<string, any>>(doc: T, fields: (keyof T)[], locale: string): T {
  if (!doc) return doc;
  
  const localizedDoc = { ...doc };
  
  for (const field of fields) {
    if (typeof field === 'string') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (localizedDoc as any)[field] = getLocalizedField(doc, field as string, locale);
    }
  }
  
  return localizedDoc;
}
