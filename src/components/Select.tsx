"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  ariaLabel?: string;
  /** Classes for the trigger button — pass the border / radius / padding the
   *  call site wants; the popup inherits its own brand styling. */
  className?: string;
  /** Classes for the positioning wrapper. Defaults to a full-width block;
   *  pass "inline-block" for a control that should size to its content. */
  wrapperClassName?: string;
}

// Custom listbox replacing the native <select>. A native select's open
// option list is drawn by the OS — the blue highlight on Windows can't be
// themed — so this renders its own popup in brand colours. Keyboard and
// ARIA follow the APG combobox/listbox pattern: focus stays on the trigger
// and the active option is tracked with aria-activedescendant.
export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Selecciona…",
  disabled = false,
  required = false,
  id,
  ariaLabel,
  className,
  wrapperClassName,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef<{ buffer: string; timer: ReturnType<typeof setTimeout> | null }>({
    buffer: "",
    timer: null,
  });
  const listboxId = useId();

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  function nextEnabled(from: number, dir: 1 | -1): number {
    for (let i = from; i >= 0 && i < options.length; i += dir) {
      if (!options[i].disabled) return i;
    }
    return -1;
  }

  function openList() {
    if (disabled) return;
    setOpen(true);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : nextEnabled(0, 1));
  }

  function closeList(refocus = true) {
    setOpen(false);
    setActiveIndex(-1);
    if (refocus) buttonRef.current?.focus();
  }

  function choose(index: number) {
    const opt = options[index];
    if (!opt || opt.disabled) return;
    onValueChange(opt.value);
    closeList();
  }

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const node = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    node?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function onKeyDown(e: ReactKeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;

    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const n = nextEnabled(activeIndex + 1, 1);
        if (n >= 0) setActiveIndex(n);
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const p = nextEnabled(activeIndex - 1, -1);
        if (p >= 0) setActiveIndex(p);
        break;
      }
      case "Home":
        e.preventDefault();
        setActiveIndex(nextEnabled(0, 1));
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(nextEnabled(options.length - 1, -1));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (activeIndex >= 0) choose(activeIndex);
        break;
      case "Escape":
        e.preventDefault();
        closeList();
        break;
      case "Tab":
        closeList(false);
        break;
      default:
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          const ta = typeahead.current;
          ta.buffer += e.key.toLowerCase();
          if (ta.timer) clearTimeout(ta.timer);
          ta.timer = setTimeout(() => {
            ta.buffer = "";
          }, 500);
          const match = options.findIndex(
            (o) => !o.disabled && o.label.toLowerCase().startsWith(ta.buffer),
          );
          if (match >= 0) setActiveIndex(match);
        }
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", wrapperClassName ?? "block w-full")}>
      <button
        ref={buttonRef}
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel}
        aria-required={required || undefined}
        disabled={disabled}
        onClick={() => (open ? closeList(false) : openList())}
        onKeyDown={onKeyDown}
        className={cn(
          "flex w-full items-center justify-between gap-2 bg-white text-left outline-none",
          "focus-visible:border-brava-pink focus-visible:ring-2 focus-visible:ring-brava-pink/40",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        <span className={cn("truncate", !selected && "text-brava-muted")}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 12 8"
          className={cn("h-2 w-3 shrink-0 text-brava-muted transition-transform", open && "rotate-180")}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1 1l5 5 5-5" />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
          className="absolute left-0 top-full z-50 mt-1 max-h-60 w-max min-w-full max-w-[calc(100vw-3rem)] overflow-auto rounded-lg border border-brava-pink-light bg-white p-1 text-sm shadow-lg shadow-brava-pink-light/60"
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            const isActive = i === activeIndex;
            return (
              <li
                key={opt.value || `opt-${i}`}
                id={`${listboxId}-opt-${i}`}
                role="option"
                aria-selected={isSelected}
                aria-disabled={opt.disabled || undefined}
                onMouseEnter={() => {
                  if (!opt.disabled) setActiveIndex(i);
                }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(i)}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-md px-3 py-2",
                  opt.disabled && "cursor-not-allowed text-brava-muted opacity-50",
                  !opt.disabled && isActive && "cursor-pointer bg-brava-pink text-white",
                  !opt.disabled && !isActive && isSelected && "cursor-pointer font-medium text-brava-pink-dark",
                  !opt.disabled && !isActive && !isSelected && "cursor-pointer text-brava-ink",
                )}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 12 10"
                    className="h-2.5 w-3 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 5l3.5 3.5L11 1" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
