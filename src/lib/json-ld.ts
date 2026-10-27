/**
 * JSON.stringify does not make a payload safe inside a <script> tag. A product
 * name containing `</script>` would break out of the element. Escaping the
 * HTML-sensitive characters (and JS line separators) prevents that XSS vector.
 */
export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
