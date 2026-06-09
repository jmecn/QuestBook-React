import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

type QuestHoverLabelProps = {
  label: string
  className?: string
  children: ReactNode
} & (
  | ({ as?: 'span' } & React.ComponentPropsWithoutRef<'span'>)
  | ({ as: 'a' } & React.ComponentPropsWithoutRef<'a'>)
)

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Floating label on hover/focus; rendered in a portal so drawer overflow cannot clip it. */
export function QuestHoverLabel(props: QuestHoverLabelProps): ReactElement {
  const { label, className, children, as = 'span', ...rest } = props
  const anchorRef = useRef<HTMLAnchorElement | HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [tooltipStyle, setTooltipStyle] = useState<{ left: number; top: number } | null>(null)

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current
    const tooltip = tooltipRef.current
    if (!anchor || !tooltip) return

    const gap = 6
    const margin = 8
    const anchorRect = anchor.getBoundingClientRect()
    const tipWidth = tooltip.offsetWidth
    const tipHeight = tooltip.offsetHeight

    let left = anchorRect.left + anchorRect.width / 2 - tipWidth / 2
    left = clamp(left, margin, window.innerWidth - tipWidth - margin)

    let top = anchorRect.bottom + gap
    if (top + tipHeight > window.innerHeight - margin) {
      top = anchorRect.top - tipHeight - gap
    }
    top = clamp(top, margin, window.innerHeight - tipHeight - margin)

    setTooltipStyle({ left, top })
  }, [])

  useLayoutEffect(() => {
    if (!visible) {
      setTooltipStyle(null)
      return undefined
    }
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [updatePosition, visible, label])

  const show = () => setVisible(true)
  const hide = () => setVisible(false)

  const onMouseEnter = (event: MouseEvent<HTMLAnchorElement | HTMLSpanElement>) => {
    show()
    rest.onMouseEnter?.(event as never)
  }

  const onMouseLeave = (event: MouseEvent<HTMLAnchorElement | HTMLSpanElement>) => {
    hide()
    rest.onMouseLeave?.(event as never)
  }

  const onFocus = (event: FocusEvent<HTMLAnchorElement | HTMLSpanElement>) => {
    show()
    rest.onFocus?.(event as never)
  }

  const onBlur = (event: FocusEvent<HTMLAnchorElement | HTMLSpanElement>) => {
    hide()
    rest.onBlur?.(event as never)
  }

  const anchorProps = {
    ...rest,
    ref: anchorRef,
    className,
    'aria-label': label,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
  }

  const anchor = as === 'a'
    ? <a {...(anchorProps as React.ComponentPropsWithoutRef<'a'>)}>{children}</a>
    : <span {...(anchorProps as React.ComponentPropsWithoutRef<'span'>)}>{children}</span>

  return (
    <>
      {anchor}
      {visible
        ? createPortal(
            <div
              ref={tooltipRef}
              className={`quest-item-tooltip${tooltipStyle ? ' is-visible' : ''}`}
              style={tooltipStyle ?? { left: 0, top: 0 }}
              role="tooltip"
            >
              {label}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
