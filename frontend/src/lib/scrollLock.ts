const LOCK_CLASS = 'azymut-scroll-locked'

/** Blokuje przewijanie głównego kontenera aplikacji (ramka telefonu lub body). */
export function lockAppScroll(): void {
  const scrollEl = document.querySelector('.screen-app-scroll')
  if (scrollEl instanceof HTMLElement) {
    scrollEl.classList.add(LOCK_CLASS)
    return
  }
  document.documentElement.classList.add(LOCK_CLASS)
  document.body.classList.add(LOCK_CLASS)
}

export function unlockAppScroll(): void {
  document.querySelectorAll(`.${LOCK_CLASS}`).forEach((el) => {
    el.classList.remove(LOCK_CLASS)
  })
  document.documentElement.classList.remove(LOCK_CLASS)
  document.body.classList.remove(LOCK_CLASS)
}

export function getPlanSheetPortalRoot(): HTMLElement {
  const screen = document.querySelector('.screen.screen-app')
  if (screen instanceof HTMLElement) {
    return screen
  }
  return document.body
}
