'use client'

import { useEffect, useState } from 'react'

const TOKEN = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|(https?:\/\/[^\s)<]+[^\s)<.,;:!?'"])/g

export const stripMarkdown = (s: string) =>
  s.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim()

function Img({ alt, src }: { alt: string; src: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    <figure className="my-2 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="max-h-64 w-full object-cover" />
      {alt && <figcaption className="px-3 py-1 text-xs italic text-gray-500">{alt}</figcaption>}
    </figure>
  )
}

type Preview = { title?: string; description?: string; image?: string; site?: string }

function LinkCard({ label, href }: { label: string; href: string }) {
  const [p, setP] = useState<Preview | null>(null)
  const [imgOk, setImgOk] = useState(true)
  useEffect(() => {
    let alive = true
    fetch(`/api/link-preview?url=${encodeURIComponent(href)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => alive && setP(d))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [href])
  const host = (() => {
    try {
      return new URL(href).hostname.replace(/^www\./, '')
    } catch {
      return href
    }
  })()
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      className="my-2 flex overflow-hidden rounded-xl border border-gray-200 bg-white no-underline shadow-sm transition hover:border-green-400 hover:shadow"
    >
      {p?.image && imgOk && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setImgOk(false)} className="h-24 w-28 shrink-0 object-cover sm:w-36" />
      )}
      <div className="min-w-0 p-3">
        <div className="text-[11px] uppercase tracking-wide text-gray-400">{p?.site || host}</div>
        <div className="truncate text-sm font-semibold text-gray-900">{p?.title || label}</div>
        {p?.description && <div className="line-clamp-2 text-xs text-gray-500">{p.description}</div>}
      </div>
    </a>
  )
}

function Inline({ text }: { text: string }) {
  const out: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  const re = new RegExp(TOKEN)
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[2]) out.push(<Img key={m.index} alt={m[1]} src={m[2]} />)
    else if (m[4])
      out.push(
        <a key={m.index} href={m[4]} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="font-medium text-green-700 underline decoration-green-300 underline-offset-2 hover:text-green-900">
          {m[3]} ↗
        </a>
      )
    else if (m[6])
      out.push(
        <a key={m.index} href={m[6]} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="break-all font-medium text-green-700 underline decoration-green-300 underline-offset-2 hover:text-green-900">
          {m[6]}
        </a>
      )
    else out.push(<strong key={m.index}>{m[5]}</strong>)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return <>{out}</>
}

export default function RichItem({ text }: { text: string }) {
  const lines = text.split('\n').filter(l => l.trim())
  return (
    <div className="min-w-0 flex-1">
      {lines.map((line, i) => {
        const isImg = /^\s*!\[/.test(line)
        const first = i === 0
        const only = line.trim().match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/)
        const bare = line.trim().match(/^(https?:\/\/\S+)$/)
        if (only && !first) return <LinkCard key={i} label={only[1]} href={only[2]} />
        if (bare && !first) return <LinkCard key={i} label={bare[1]} href={bare[1]} />
        return (
          <div key={i} className={first ? 'text-lg font-semibold leading-snug' : isImg ? '' : 'mt-1 text-sm leading-relaxed text-gray-600'}>
            <Inline text={line} />
          </div>
        )
      })}
    </div>
  )
}
