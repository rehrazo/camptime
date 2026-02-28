function normalize(value) {
  return String(value || '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim()
}

function sanitizeSentence(value) {
  return normalize(
    String(value || '')
      .replace(/^\s*\d+\s*[).:-]+\s*/g, '')
      .replace(/^\s*[-*•]+\s*/g, '')
      .replace(/\b(details?|overview|highlights?|specifications?)\s*[:.-]*\s*/gi, ' ')
  )
}

function splitSentences(value) {
  const text = normalize(value)
    .replace(/\s*;\s*/g, '. ')
    .replace(/\s*\|\s*/g, '. ')

  if (!text) {
    return []
  }

  return text
    .split(/(?<=[.!?])\s+|\s(?=\d+\.)/)
    .map((sentence) => sanitizeSentence(sentence))
    .filter(Boolean)
}

function isPolicyNoise(sentence) {
  const text = String(sentence || '').toLowerCase()
  const blocked = [
    /return\s*(and|&)\s*refund/i,
    /accept returns?/i,
    /communication vouchers?/i,
    /screenshot/i,
    /wrong order|wrong purchase|customer dislike/i,
    /please contact (the )?online customer service/i,
    /items must be unworn|undamaged|original packaging/i,
    /dropshipping to 48 states/i,
    /drop\s*shipping to 48 states/i,
    /some remote states/i,
    /warm\s*tip/i,
    /no refund will be given/i,
    /for any product problems?/i,
    /must provide communication vouchers?/i,
    /pictures?,\s*videos?/i,
    /orders must meet the following requirements?/i,
    /accept returns? and refunds?/i,
    /with the buyer/i,
    /product photos? or dynamic videos? showing the product in question/i,
    /please provide a complete and detailed physical address/i,
    /please provide a complete and ed physical address/i,
    /delivery to po box addresses?/i,
    /please refer to the actual product for accuracy/i,
    /measurement allowed error is \+\/-?\s*1-?3\s*cm/i,
    /\+\/-?\s*10\s*g/i,
  ]

  return blocked.some((pattern) => pattern.test(text))
}

function isPackagingNoise(sentence) {
  const text = normalize(sentence).toLowerCase()
  if (!text) {
    return true
  }

  const blocked = [
    /^details?$/i,
    /^overview$/i,
    /^specifications?$/i,
    /^note:?$/i,
    /^package:?$/i,
    /^includes?:?$/i,
    /outer packaging and label pictures?/i,
    /communication vouchers?/i,
    /distributor.?s order refund/i,
  ]

  return blocked.some((pattern) => pattern.test(text))
}

function uniqueStrings(values = []) {
  const seen = new Set()
  const result = []

  values.forEach((value) => {
    const text = normalize(value)
    if (!text) {
      return
    }

    const key = text.toLowerCase()
    if (seen.has(key)) {
      return
    }

    seen.add(key)
    result.push(text)
  })

  return result
}

function classifySentence(sentence) {
  const text = sentence.toLowerCase()

  if (/\b(ship|shipping|delivery|processing time|transit|ups|usps|freight|po box)\b/.test(text)) {
    return 'shipping'
  }

  if (/\b(package|packaging|box|package includes?|includes?:|in the box|carton)\b/.test(text)) {
    return 'packaging'
  }

  if (/\b(option|optional|available|choose|selection|variant|color|size)\b/.test(text)) {
    return 'options'
  }

  if (/\b(specification|specifications|dimension|dimensions|material|weight|capacity|size)\b/.test(text)) {
    return 'specifications'
  }

  return 'general'
}

function buildOptions(variations = [], parameters = []) {
  const optionLikeParameters = parameters
    .filter((parameter) => /option|color|size|style|variant/i.test(String(parameter.parameter_name || '')))
    .map((parameter) => {
      const name = normalize(parameter.parameter_name)
      const value = normalize(parameter.parameter_value)
      return name && value ? `${name}: ${value}` : value || name
    })

  const variationOptions = variations.map((variation) => {
    const theme = normalize(variation.theme_name)
    const value = normalize(variation.variation_value)
    return theme && value ? `${theme}: ${value}` : value || theme
  })

  return uniqueStrings(variationOptions.concat(optionLikeParameters))
}

function buildPackaging(packagingRows = []) {
  return uniqueStrings(
    packagingRows.map((item) => {
      const packageLabel = item.package_number ? `Package ${item.package_number}` : null
      const size = normalize(item.size)
      const weight = item.weight ? `Weight ${item.weight}` : null
      const content = normalize(item.content)

      return [packageLabel, size, weight, content].filter(Boolean).join(' - ')
    })
  ).filter((item) => !isPackagingNoise(item))
}

function buildShippingDetails({ shippingMethod, shippingLimitations, processingTime } = {}) {
  const shippingClauses = splitSentences(shippingLimitations).filter((sentence) =>
    /\b(ship|shipping|delivery|transit|carrier|processing|po box|freight|ups|usps|fedex|dhl)\b/i.test(sentence)
  )

  return uniqueStrings([
    shippingMethod ? `Shipping method: ${shippingMethod}` : null,
    processingTime ? `Processing time: ${processingTime}` : null,
    ...shippingClauses,
  ]).filter((item) => {
    if (isPolicyNoise(item)) {
      return false
    }

    if (/^(vulnerable|unlimited)$/i.test(normalize(item))) {
      return false
    }

    if (/\bdrop\s*shipping\b/i.test(item)) {
      return false
    }

    return true
  })
}

function clampItems(values = [], maxItems = 6) {
  return uniqueStrings(values).slice(0, maxItems)
}

function buildDescriptionSections({
  name,
  longDescription,
  description,
  variations = [],
  parameters = [],
  packaging = [],
  shippingMethod,
  shippingLimitations,
  processingTime,
} = {}) {
  const sourceText = normalize(longDescription) || normalize(description) || ''
  const sentences = splitSentences(sourceText)

  const general = []
  const highlights = []
  const options = buildOptions(variations, parameters)
  const packagingSection = buildPackaging(packaging)
  const shipping = buildShippingDetails({ shippingMethod, shippingLimitations, processingTime })
  const specifications = []

  sentences.forEach((sentence) => {
    if (isPolicyNoise(sentence)) {
      return
    }

    const bucket = classifySentence(sentence)

    if (bucket === 'options') {
      options.push(sentence)
      return
    }

    if (bucket === 'packaging') {
      const hasPackagingSignal = /\b(package|packaging|box|includes?|carton|bag|case|kit|set|qty|quantity)\b/i.test(
        sentence
      )

      if (hasPackagingSignal && !isPackagingNoise(sentence)) {
        packagingSection.push(sentence)
      }
      return
    }

    if (bucket === 'shipping') {
      shipping.push(sentence)
      return
    }

    if (bucket === 'specifications') {
      specifications.push(sentence)
      return
    }

    general.push(sentence)
  })

  const lead = general.slice(0, 2)
  highlights.push(...general.slice(2, 10))

  if (!lead.length && name) {
    lead.push(`${String(name).trim()} built for outdoor use.`)
  }

  return {
    description: lead.join(' '),
    highlights: clampItems(highlights, 8),
    options: clampItems(options, 8),
    packaging: clampItems(packagingSection, 6),
    shipping: clampItems(shipping, 5),
    specifications: clampItems(specifications, 6),
  }
}

module.exports = {
  buildDescriptionSections,
}