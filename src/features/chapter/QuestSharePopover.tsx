import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '@/shared/i18n/useI18n'
import { useQuestDisplayTitle } from '@/shared/lib/quest-display'
import { copyTextToClipboard } from '@/shared/lib/copy-to-clipboard'
import { formatQuestShareOgTitle } from '@/shared/lib/quest-share-meta'
import { questSharePreviewText } from '@/shared/lib/quest-share-preview'
import {
  DEFAULT_SHARE_OG_IMAGE,
  questShareShellUrl,
  resolveQuestSiteBase,
} from '@/shared/lib/quest-share-url'
import type { QuestNode } from '@/shared/types/quest'
import { CheckIcon, CopyIcon, LinkIcon } from '@/shared/ui/copy-icons'
import '@/styles/quest-share-popover.css'

/** Keep in sync with `.quest-share-popover { width: … }` in quest-share-popover.css */
const SHARE_POPOVER_WIDTH_PX = 400
const SHARE_POPOVER_EDGE_PX = 8
const SHARE_POPOVER_ANCHOR_GAP_PX = 6
/** Below this width the popover is horizontally centered (phone / narrow drawer). */
const SHARE_POPOVER_CENTER_MAX_WIDTH_PX = 480

function sharePopoverWidthPx(): number {
  return Math.min(SHARE_POPOVER_WIDTH_PX, window.innerWidth - SHARE_POPOVER_EDGE_PX * 2)
}

function viewportHeightPx(): number {
  return window.visualViewport?.height ?? window.innerHeight
}

/** iOS / Material 常见的「托盘 + 向上箭头」分享图标 */
function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M12 3.5v10.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8.5 7.5 12 3.5 15.5 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 14.5v4A1.5 1.5 0 0 0 7.5 20h9a1.5 1.5 0 0 0 1.5-1.5v-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export interface QuestShareButtonProps {
  locale: string
  chapterFilename: string
  chapterTitle: string
  quest: QuestNode
  dict: Record<string, string>
}

export function QuestShareButton({
  locale,
  chapterFilename,
  chapterTitle,
  quest,
  dict,
}: QuestShareButtonProps) {
  const { t } = useI18n()
  const popoverId = useId()
  const anchorRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [siteBase, setSiteBase] = useState('')
  const [shareCopied, setShareCopied] = useState(false)
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})

  const questTitle = useQuestDisplayTitle(quest, dict, locale)
  const previewText = questSharePreviewText(quest, dict)
  const shareOgTitle = formatQuestShareOgTitle(questTitle)

  const shareUrl = siteBase
    ? questShareShellUrl(siteBase, locale, chapterFilename, quest.id)
    : ''

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void resolveQuestSiteBase().then((base) => {
      if (!cancelled) setSiteBase(base)
    })
    return () => {
      cancelled = true
    }
  }, [open])

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current
    const panel = panelRef.current
    if (!anchor) return

    const rect = anchor.getBoundingClientRect()
    const width = sharePopoverWidthPx()
    const panelHeight = panel?.offsetHeight ?? 280
    const viewportH = viewportHeightPx()
    const margin = SHARE_POPOVER_EDGE_PX
    const gap = SHARE_POPOVER_ANCHOR_GAP_PX

    let left: number
    if (window.innerWidth <= SHARE_POPOVER_CENTER_MAX_WIDTH_PX) {
      left = Math.max(margin, (window.innerWidth - width) / 2)
    } else {
      left = rect.right - width
      if (left < margin) left = margin
      if (left + width > window.innerWidth - margin) {
        left = window.innerWidth - width - margin
      }
    }

    let top = rect.bottom + gap
    if (top + panelHeight > viewportH - margin) {
      const aboveTop = rect.top - gap - panelHeight
      if (aboveTop >= margin) {
        top = aboveTop
      } else {
        top = Math.max(margin, viewportH - panelHeight - margin)
      }
    }

    setPanelStyle({ top, left, width })
  }, [])

  useLayoutEffect(() => {
    if (!open) return

    const reposition = () => updatePosition()
    reposition()
    const raf = requestAnimationFrame(reposition)

    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    const visualViewport = window.visualViewport
    visualViewport?.addEventListener('resize', reposition)
    visualViewport?.addEventListener('scroll', reposition)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
      visualViewport?.removeEventListener('resize', reposition)
      visualViewport?.removeEventListener('scroll', reposition)
    }
  }, [open, updatePosition, shareUrl])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      const target = event.target as Node
      if (anchorRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (!open) setShareCopied(false)
  }, [open])

  const copyShareLink = async () => {
    if (!shareUrl) return
    const ok = await copyTextToClipboard(shareUrl)
    if (!ok) return
    setShareCopied(true)
    window.setTimeout(() => setShareCopied(false), 2000)
  }

  const onNativeShare = async () => {
    if (!canNativeShare || !shareUrl) return
    try {
      await navigator.share({
        title: shareOgTitle,
        url: shareUrl,
      })
      setOpen(false)
    } catch {
      /* user cancelled */
    }
  }

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className={`chapter-detail__share${open ? ' chapter-detail__share--active' : ''}`}
        aria-label={t('shareQuest')}
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <ShareIcon />
      </button>

      {open
        ? createPortal(
            <>
              <div
                className="quest-share-popover__backdrop"
                aria-hidden="true"
                onClick={() => setOpen(false)}
              />
              <div
                ref={panelRef}
                id={popoverId}
                className="quest-share-popover"
                role="dialog"
                aria-label={t('shareQuest')}
                style={panelStyle}
              >
              <p className="quest-share-popover__title">{questTitle}</p>
              <p className="quest-share-popover__chapter">{chapterTitle}</p>

              <div className="quest-share-popover__preview" aria-hidden="true">
                <img
                  className="quest-share-popover__preview-img"
                  src={DEFAULT_SHARE_OG_IMAGE}
                  alt=""
                  width={40}
                  height={40}
                />
                <div className="quest-share-popover__preview-body">
                  <p className="quest-share-popover__preview-heading">{shareOgTitle}</p>
                  {previewText ? (
                    <p className="quest-share-popover__preview-text">{previewText}</p>
                  ) : null}
                </div>
              </div>

              <div className="quest-share-popover__link-panel">
                <div className="quest-share-popover__url-field">
                  <input
                    className="quest-share-popover__url-input"
                    readOnly
                    value={shareUrl}
                    aria-label={t('shareLink')}
                    onFocus={(event) => event.target.select()}
                  />
                  <button
                    type="button"
                    className={`quest-share-popover__url-copy${shareCopied ? ' is-copied' : ''}`}
                    disabled={!shareUrl}
                    aria-label={shareCopied ? t('shareCopied') : t('shareCopyLink')}
                    title={shareCopied ? t('shareCopied') : t('shareCopyLink')}
                    onClick={() => void copyShareLink()}
                  >
                    {shareCopied ? <CheckIcon /> : <CopyIcon />}
                  </button>
                </div>

                <div className="quest-share-popover__actions">
                  <button
                    type="button"
                    className="quest-share-popover__copy-link"
                    disabled={!shareUrl}
                    onClick={() => void copyShareLink()}
                  >
                    <LinkIcon />
                    <span>{shareCopied ? t('shareCopied') : t('shareCopyLink')}</span>
                  </button>
                  {canNativeShare ? (
                    <button
                      type="button"
                      className="quest-share-popover__native"
                      disabled={!shareUrl}
                      onClick={() => void onNativeShare()}
                    >
                      <ShareIcon />
                      <span>{t('shareNative')}</span>
                    </button>
                  ) : null}
                </div>
              </div>
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  )
}
