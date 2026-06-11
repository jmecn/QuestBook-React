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

  subtitle?: string
  className?: string
  children: ReactNode
} & (
  | ({ as?: 'span' } & React.ComponentPropsWithoutRef<'span'>)
  | ({ as: 'a' } & React.ComponentPropsWithoutRef<'a'>)
  | ({ as: 'button' } & React.ComponentPropsWithoutRef<'button'>)
)

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function QuestHoverLabel(props: QuestHoverLabelProps): ReactElement {
  const { label, subtitle, className, children, as = 'span', ...rest } = props
  const tooltipLabel = subtitle?.trim() ? `${label}. ${subtitle}` : label
  const stacked = Boolean(subtitle?.trim())
  const anchorRef = useRef<HTMLAnchorElement | HTMLButtonElement | HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [tooltipStyle, setTooltipStyle] = useState<{ left: number; top: number } | null>(null)

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current
    const tooltip = tooltipRef.current
    if (!anchor || !tooltip) return

    const gap = 6
    const margin = 8
    let anchorRect = anchor.getBoundingClientRect()
    if (anchorRect.width === 0 && anchorRect.height === 0 && anchor.firstElementChild instanceof HTMLElement) {
      anchorRect = anchor.firstElementChild.getBoundingClientRect()
    }
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
  }, [updatePosition, visible, label, subtitle])

  const show = () => setVisible(true)
  const hide = () => setVisible(false)

  const onMouseEnter = (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement | HTMLSpanElement>) => {
    show()
    rest.onMouseEnter?.(event as never)
  }

  const onMouseLeave = (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement | HTMLSpanElement>) => {
    hide()
    rest.onMouseLeave?.(event as never)
  }

  const onFocus = (event: FocusEvent<HTMLAnchorElement | HTMLButtonElement | HTMLSpanElement>) => {
    show()
    rest.onFocus?.(event as never)
  }

  const onBlur = (event: FocusEvent<HTMLAnchorElement | HTMLButtonElement | HTMLSpanElement>) => {
    hide()
    rest.onBlur?.(event as never)
  }

  const anchorProps = {
    ...rest,
    ref: anchorRef,
    className,
    'aria-label': tooltipLabel,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
  }

  const anchor = as === 'a'
    ? <a {...(anchorProps as React.ComponentPropsWithoutRef<'a'>)}>{children}</a>
    : as === 'button'
      ? <button {...(anchorProps as React.ComponentPropsWithoutRef<'button'>)}>{children}</button>
      : <span {...(anchorProps as React.ComponentPropsWithoutRef<'span'>)}>{children}</span>

  return (
    <>
      {anchor}
      {visible
        ? createPortal(
            <div
              ref={tooltipRef}
              className={`quest-item-tooltip${stacked ? ' quest-item-tooltip--stacked' : ''}${tooltipStyle ? ' is-visible' : ''}`}
              style={tooltipStyle ?? { left: 0, top: 0 }}
              role="tooltip"
            >
              <span className="quest-item-tooltip__title">{label}</span>
              {stacked ? (
                <span className="quest-item-tooltip__subtitle">{subtitle}</span>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
