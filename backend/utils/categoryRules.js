const { splitCategoryPath } = require('./categories')

function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function withoutOutdoorRoot(rawCategory) {
  const parts = splitCategoryPath(rawCategory)
    .map((part) => normalizeWhitespace(part))
    .filter(Boolean)

  if (!parts.length) {
    return []
  }

  const first = parts[0].toLowerCase()
  if (first === 'outdoor' || first === 'outdoors') {
    return parts.slice(1)
  }

  return parts
}

function buildContext(mapped = {}) {
  const segments = [
    mapped.name,
    mapped.category,
    mapped.description,
    mapped.html_description,
    mapped.brand,
  ]

  return normalizeWhitespace(segments.filter(Boolean).join(' | ')).toLowerCase()
}

function containsAny(text, patterns = []) {
  return patterns.some((pattern) => pattern.test(text))
}

function mapByRules(context) {
  const rules = [
    {
      categoryPath: 'Tents & Shelters > Tents',
      include: [/\b(tent|rooftop tent|pop up tent|dome tent|camping tent)\b/i],
      exclude: [/\btarp\b/i],
    },
    {
      categoryPath: 'Tents & Shelters > Canopies & Tarps',
      include: [/\b(canopy|tarp|rainfly|sunshade tent|shade shelter)\b/i],
      exclude: [/\bchair\b/i],
    },
    {
      categoryPath: 'Sleeping Gear > Sleeping Bags',
      include: [/\bsleeping bag\b/i],
    },
    {
      categoryPath: 'Sleeping Gear > Sleeping Pads',
      include: [/\b(sleeping pad|sleeping mat|foam mat|self inflating|inflatable seat cushion|seat cushion)\b/i],
    },
    {
      categoryPath: 'Sleeping Gear > Air Mattresses',
      include: [/\b(air mattress|inflatable mattress|blow up bed|car air mattress)\b/i],
      exclude: [/\b(sleeping pad|sleeping mat|foam mat)\b/i],
    },
    {
      categoryPath: 'Camp Furniture > Hammocks',
      include: [/\bhammock\b/i],
    },
    {
      categoryPath: 'Camp Furniture > Chairs',
      include: [/\b(camping chair|folding chair|rocking chair|beach chair|director.?s chair|camp stool|lawn chair|portable chair)\b/i],
    },
    {
      categoryPath: 'Camp Furniture > Tables',
      include: [/\bcamping table\b/i, /\bfold(ing)? table\b/i],
    },
    {
      categoryPath: 'Camp Furniture > Outdoor Utilities',
      include: [/\b(portable hand wash sink|hand wash sink|faucet station)\b/i],
    },
    {
      categoryPath: 'Backpacks & Bags > Backpacks',
      include: [/\b(backpack|daypack|mountaineering backpack|drawstring backpack)\b/i],
      exclude: [/\bsleeping bag\b/i],
    },
    {
      categoryPath: 'Backpacks & Bags > Pouches',
      include: [/\b(molle pouch|waist belt bag|edc pouch|utility pouch)\b/i],
    },
    {
      categoryPath: 'Camp Kitchen > Stoves & Burners',
      include: [/\b(stove|burner|hot plate|charcoal starter)\b/i],
    },
    {
      categoryPath: 'Camp Kitchen > Grills',
      include: [/\b(grill|grate|campfire grill|bbq)\b/i],
    },
    {
      categoryPath: 'Camp Kitchen > Cooking Utensils',
      include: [/\b(spatula|utensil|tableware|fork|spoon|knife)\b/i],
    },
    {
      categoryPath: 'Camp Kitchen > Cookware',
      include: [/\b(skillet|cookware|pot\b|pan\b|teapot\b|sauce pan|cast iron)\b/i],
    },
    {
      categoryPath: 'Camp Kitchen > Coolers & Food Storage',
      include: [/\b(cooler bag|cooling bag|insulated grocery bag|lunch bag)\b/i],
    },
  ]

  for (const rule of rules) {
    if (!containsAny(context, rule.include)) {
      continue
    }

    if (rule.exclude && containsAny(context, rule.exclude)) {
      continue
    }

    return rule.categoryPath
  }

  return null
}

function normalizeProductCategory(mapped = {}) {
  const context = buildContext(mapped)
  const mappedPath = mapByRules(context)
  if (mappedPath) {
    return mappedPath
  }

  const trimmedPath = withoutOutdoorRoot(mapped.category)
  if (!trimmedPath.length) {
    return 'Camp Accessories > General'
  }

  return trimmedPath.join(' > ')
}

module.exports = {
  normalizeProductCategory,
  withoutOutdoorRoot,
}
