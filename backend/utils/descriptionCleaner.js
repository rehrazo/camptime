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
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(img|table|thead|tbody|tr|td|th)[^>]*>[\s\S]*?<\/(img|table|thead|tbody|tr|td|th)>/gi, ' ')
    .replace(/<(img|table|thead|tbody|tr|td|th)[^>]*>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h\d|ul|ol|section|article)>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
}

function normalize(value) {
  return String(value || '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([.:!?;,\-])\1{1,}/g, '$1')
    .trim()
}

function splitSentences(text) {
  const normalized = String(text || '')
    .replace(/\s*[\n]+\s*/g, '. ')
    .replace(/\s*;\s*/g, '. ')

  return normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => normalize(sentence))
    .filter(Boolean)
}

function sanitizeSentence(sentence) {
  return normalize(
    String(sentence || '')
      .replace(/\*+/g, '')
      .replace(/^\s*[-*•]+\s*/g, '')
      .replace(/^\s*\d+\s*[).:-]+\s*/g, '')
      .replace(/^(highlights?|details?|overview|illustrate|specifications?)\s*[:.-]*\s*/i, '')
  )
}

function isBoilerplate(sentence) {
  const text = String(sentence || '').toLowerCase()

  if (!text) {
    return true
  }

  const blocked = [
    /^(highlights?|details?|illustrate|overview|specifications?|warm tip|note)\s*[:.-]*$/i,
    /please refer to the online information of the supplier/i,
    /product notes?/i,
    /dropshipping to 48 states/i,
    /screenshots of communication records/i,
    /return (and|&) refund/i,
    /transit time is \d+-?\d*\s*business days/i,
    /data-v-[a-z0-9]+/i,
    /^\W+$/,
  ]

  if (text.length < 8) {
    return true
  }

  return blocked.some((pattern) => pattern.test(text))
}

function dedupeSentences(sentences) {
  const seen = new Set()
  const result = []

  for (const sentence of sentences) {
    const key = sentence.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()
    if (!key || seen.has(key)) {
      continue
    }

    seen.add(key)
    result.push(sentence)
  }

  return result
}

function trimBySentence(text, maxChars) {
  const normalized = normalize(text)
  if (!maxChars || normalized.length <= maxChars) {
    return normalized
  }

  const sentences = splitSentences(normalized)
  if (!sentences.length) {
    return normalized.slice(0, maxChars).trim()
  }

  let result = ''
  for (const sentence of sentences) {
    const next = result ? `${result} ${sentence}` : sentence
    if (next.length > maxChars) {
      break
    }
    result = next
  }

  if (result) {
    return result
  }

  const sliced = normalized.slice(0, maxChars)
  const lastSpace = sliced.lastIndexOf(' ')
  return (lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced).trim()
}

function cleanDescriptionForStorage({ description, htmlDescription, name, maxChars = 900 } = {}) {
  const plainDescription = normalize(decodeEntities(stripHtml(description)))
  const plainHtml = normalize(decodeEntities(stripHtml(htmlDescription)))
  const source = plainDescription.length >= plainHtml.length ? plainDescription : plainHtml

  const cleanedSentences = dedupeSentences(
    splitSentences(source)
      .map((sentence) => sanitizeSentence(sentence))
      .filter((sentence) => !isBoilerplate(sentence))
  )

  const nameFallback = name ? `${String(name).trim()} built for outdoor use.` : ''
  const fallback = source || nameFallback
  const result = cleanedSentences.length ? cleanedSentences.join(' ') : fallback
  const normalizedResult = normalize(result)

  if (!normalizedResult || isBoilerplate(normalizedResult)) {
    return trimBySentence(nameFallback, maxChars || 900)
  }

  return trimBySentence(normalizedResult, maxChars || 900)
}

module.exports = {
  cleanDescriptionForStorage,
}
