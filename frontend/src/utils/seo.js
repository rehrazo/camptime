const DEFAULT_TITLE = 'Razo Wild - Camping Gear E-commerce'
const DEFAULT_DESCRIPTION = 'Shop camping gear, tents, sleeping bags, and outdoor essentials at Razo Wild.'

function upsertMetaTag({ name, property, content }) {
  if (!content) {
    return
  }

  const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`
  let element = document.head.querySelector(selector)

  if (!element) {
    element = document.createElement('meta')
    if (name) {
      element.setAttribute('name', name)
    }
    if (property) {
      element.setAttribute('property', property)
    }
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

function upsertCanonical(path = '/') {
  let element = document.head.querySelector('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.appendChild(element)
  }

  const normalizedPath = String(path || '/').startsWith('/') ? String(path || '/') : `/${path}`
  element.setAttribute('href', `${window.location.origin}${normalizedPath}`)
}

function setRobots(noindex = false) {
  upsertMetaTag({
    name: 'robots',
    content: noindex ? 'noindex, nofollow' : 'index, follow',
  })
}

function applyPageSeo({
  title,
  description,
  path,
  imageUrl,
  type = 'website',
  noindex = false,
}) {
  const resolvedTitle = String(title || DEFAULT_TITLE).trim() || DEFAULT_TITLE
  const resolvedDescription = String(description || DEFAULT_DESCRIPTION).trim() || DEFAULT_DESCRIPTION
  const resolvedPath = String(path || window.location.pathname || '/').trim() || '/'
  const canonicalUrl = `${window.location.origin}${resolvedPath.startsWith('/') ? resolvedPath : `/${resolvedPath}`}`

  document.title = resolvedTitle

  upsertMetaTag({ name: 'description', content: resolvedDescription })
  upsertMetaTag({ property: 'og:title', content: resolvedTitle })
  upsertMetaTag({ property: 'og:description', content: resolvedDescription })
  upsertMetaTag({ property: 'og:type', content: type })
  upsertMetaTag({ property: 'og:url', content: canonicalUrl })
  upsertMetaTag({ name: 'twitter:card', content: imageUrl ? 'summary_large_image' : 'summary' })
  upsertMetaTag({ name: 'twitter:title', content: resolvedTitle })
  upsertMetaTag({ name: 'twitter:description', content: resolvedDescription })

  if (imageUrl) {
    upsertMetaTag({ property: 'og:image', content: imageUrl })
    upsertMetaTag({ name: 'twitter:image', content: imageUrl })
  }

  upsertCanonical(resolvedPath)
  setRobots(noindex)
}

function setJsonLd(id, payload) {
  if (!id || !payload) {
    return
  }

  const scriptId = `jsonld-${id}`
  let script = document.getElementById(scriptId)
  if (!script) {
    script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = scriptId
    document.head.appendChild(script)
  }

  script.textContent = JSON.stringify(payload)
}

function clearJsonLd(id) {
  if (!id) {
    return
  }

  const script = document.getElementById(`jsonld-${id}`)
  if (script?.parentNode) {
    script.parentNode.removeChild(script)
  }
}

export {
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  applyPageSeo,
  setJsonLd,
  clearJsonLd,
}
