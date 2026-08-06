/**
 * Eksporterer et DOM-element som PNG-nedlasting.
 * Bruker html-to-image når tilgjengelig.
 */
export async function exportElementAsPng(element, filename = 'resultat.png') {
  if (!element) throw new Error('Mangler element å eksportere')

  const { toPng } = await import('html-to-image')
  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: '#071a1f',
    style: {
      // Unngå at sticky/overflow klipper i eksport
      transform: 'none',
    },
  })

  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}

export function slugifyFilename(name) {
  return String(name)
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'resultat'
}
