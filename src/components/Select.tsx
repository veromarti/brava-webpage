"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { normalizeForSearch } from "@/lib/format";

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
  /** Adds a search box at the top of the popup that filters the option list
   *  as you type — for a list too long to scan/typeahead through (e.g. every
   *  product in the catalog). Off by default; every other Select is
   *  unaffected. */
  searchable?: boolean;
  /** Placeholder for the search box. Only used when `searchable` is set. */
  searchPlaceholder?: string;
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
  searchable = false,
  searchPlaceholder = "Buscar…",
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef<{ buffer: string; timer: ReturnType<typeof setTimeout> | null }>({
    buffer: "",
    timer: null,
  });
  const listboxId = useId();

  // The button always shows the selected option's label regardless of the
  // search filter, so this looks it up in the full list, not the filtered
  // one below.
  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  // The filtered list used for rendering, keyboard nav, and choosing.
  // Equals `options` whenever `searchable` is off (query never leaves ""),
  // so every existing non-searchable Select is unaffected. A plain function,
  // not state, so it can also be called inline in the search box's onChange
  // — which needs the *new* list immediately, to re-anchor activeIndex in
  // the same event rather than in a follow-up effect.
  function computeVisibleOptions(rawQuery: string): SelectOption[] {
    if (!searchable || rawQuery.trim().length === 0) return options;
    const q = normalizeForSearch(rawQuery);
    return options.filter((o) => normalizeForSearch(o.label).includes(q));
  }

  const visibleOptions = useMemo(
    () => computeVisibleOptions(query),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- computeVisibleOptions closes over options/searchable, both already listed
    [options, searchable, query],
  );

  function nextEnabled(from: number, dir: 1 | -1): number {
    for (let i = from; i >= 0 && i < visibleOptions.length; i += dir) {
      if (!visibleOptions[i].disabled) return i;
    }
    return -1;
  }

  function openList() {
    if (disabled) return;
    setOpen(true);
    // query is always "" here (reset on the previous close), so
    // visibleOptions === options at this exact moment.
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : nextEnabled(0, 1));
  }

  function closeList(refocus = true) {
    setOpen(false);
    setActiveIndex(-1);
    setQuery("");
    if (refocus) buttonRef.current?.focus();
  }

  function choose(index: number) {
    const opt = visibleOptions[index];
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
        setQuery("");
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

  // Moves focus into the search box the moment the popup opens, so typing
  // starts filtering immediately — same reasoning as a browser's own
  // address bar autofocusing its suggestion search.
  useEffect(() => {
    if (open && searchable) {
      inputRef.current?.focus();
    }
  }, [open, searchable]);

  // A new query can shrink/reorder visibleOptions out from under the current
  // activeIndex, so the search box's onChange re-anchors it to the first
  // enabled result (or none) right there — in the same event, using the
  // *new* query's list, rather than in a follow-up effect reacting to state
  // that already changed.
  function onSearchChange(rawQuery: string) {
    setQuery(rawQuery);
    const next = computeVisibleOptions(rawQuery);
    const firstEnabled = next.findIndex((o) => !o.disabled);
    setActiveIndex(firstEnabled);
  }

  // Shared by the trigger button and (for a searchable Select) the search
  // box — list navigation is identical either way. Space is a "choose" key
  // for the button (matching native <button>/<select> behavior) but must
  // type normally into the search box instead (product names have spaces),
  // so the caller says which one it wants. Returns whether it handled the
  // key, so the caller knows whether to fall through to its own handling
  // (typeahead for the button; nothing for the input — it types natively).
  function handleListNavKey(e: ReactKeyboardEvent<HTMLElement>, treatSpaceAsChoose: boolean): boolean {
    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const n = nextEnabled(activeIndex + 1, 1);
        if (n >= 0) setActiveIndex(n);
        return true;
      }
      case "ArrowUp": {
        e.preventDefault();
        const p = nextEnabled(activeIndex - 1, -1);
        if (p >= 0) setActiveIndex(p);
        return true;
      }
      case "Home":
        e.preventDefault();
        setActiveIndex(nextEnabled(0, 1));
        return true;
      case "End":
        e.preventDefault();
        setActiveIndex(nextEnabled(visibleOptions.length - 1, -1));
        return true;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0) choose(activeIndex);
        return true;
      case " ":
        if (!treatSpaceAsChoose) return false;
        e.preventDefault();
        if (activeIndex >= 0) choose(activeIndex);
        return true;
      case "Escape":
        e.preventDefault();
        closeList();
        return true;
      case "Tab":
        closeList(false);
        return true;
      default:
        return false;
    }
  }

  function onKeyDown(e: ReactKeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;

    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }

    if (handleListNavKey(e, true)) return;

    // Typeahead — only reachable while the button itself still has focus.
    // For a searchable Select that stops being true the instant it opens
    // (focus moves into the search box instead, see the effect above), so
    // this is effectively non-searchable-only in practice.
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const ta = typeahead.current;
      ta.buffer += e.key.toLowerCase();
      if (ta.timer) clearTimeout(ta.timer);
      ta.timer = setTimeout(() => {
        ta.buffer = "";
      }, 500);
      const match = visibleOptions.findIndex(
        (o) => !o.disabled && o.label.toLowerCase().startsWith(ta.buffer),
      );
      if (match >= 0) setActiveIndex(match);
    }
  }

  // The search box only ever renders while open (searchable && open), so
  // unlike the button it needs no "not open yet" branch.
  function onSearchKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    handleListNavKey(e, false);
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
        <div className="absolute left-0 top-full z-50 mt-1 w-max min-w-full max-w-[calc(100vw-3rem)] overflow-hidden rounded-lg border border-brava-pink-light bg-white shadow-lg shadow-brava-pink-light/60">
          {searchable && (
            <div className="border-b border-brava-pink-light p-1">
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={open}
                aria-controls={listboxId}
                aria-activedescendant={activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
                aria-autocomplete="list"
                aria-label={ariaLabel ? `Buscar — ${ariaLabel}` : searchPlaceholder}
                value={query}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={onSearchKeyDown}
                placeholder={searchPlaceholder}
                className="w-full rounded-md px-2 py-1.5 text-sm outline-none placeholder:text-brava-muted"
              />
            </div>
          )}
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-activedescendant={activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
            className="max-h-60 overflow-auto p-1 text-sm"
          >
            {visibleOptions.length === 0 ? (
              <li className="px-3 py-2 text-brava-muted">No se encontraron resultados.</li>
            ) : (
              visibleOptions.map((opt, i) => {
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
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
