import DOMPurify from 'dompurify'

const purifier = DOMPurify

export function HtmlContent({ html }: { html: string }) {
  const clean = purifier.sanitize(html, { USE_PROFILES: { html: true } })
  return <div className="rich-html" dangerouslySetInnerHTML={{ __html: clean }} />
}
