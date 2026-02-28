function decodeEntities(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#8217;|&#8216;/gi, "'")
    .replace(/&#8220;|&#8221;/gi, '"')
    .replace(/&#8211;|&#8212;/gi, '-')
    .replace(/&#\d+;/g, ' ')
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<br\s*\/?>/gi, '. ')
    .replace(/<\/(p|div|li|h\d)>/gi, '. ')
    .replace(/<[^>]*>/g, ' ')
}

function normalizeText(value) {
  return decodeEntities(stripHtml(value))
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim()
}

function splitSentences(text) {
  if (!text) {
    return []
  }

  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function clampLength(text, maxLength = 240) {
  if (!text || text.length <= maxLength) {
    return text
  }

  const sliced = text.slice(0, maxLength)
  const lastSpace = sliced.lastIndexOf(' ')
  const compact = lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced
  return compact.trim().replace(/[.,;:!?-]?$/, '') + '…'
}

function generateBriefDescription({ description, htmlDescription, name } = {}) {
  const source = normalizeText(description) || normalizeText(htmlDescription)

  if (!source) {
    return name ? `${String(name).trim()} — quality camping gear built for outdoor adventures.` : null
  }

  const sentences = splitSentences(source)
  if (!sentences.length) {
    return clampLength(source)
  }

  const first = sentences[0]
  const second = sentences[1]
  const combined = second ? `${first} ${second}` : first

  return clampLength(combined)
}

module.exports = {
  generateBriefDescription,
  normalizeText,
}
