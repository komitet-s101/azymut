const MOTTO = 'Precyzyjny namiar na to, co dzieje się tuż obok,'

export function HomeHeader() {
  return (
    <header
      className="px-5 pt-[max(2.5rem,calc(env(safe-area-inset-top)+1rem))] text-primary-foreground"
      aria-label="Azymut"
    >
      <h1 className="flex flex-col items-center gap-2 text-center">
        <img
          src="/brand/logo.png"
          alt="Azymut"
          className="h-[4.75rem] w-auto max-w-[280px] object-contain brightness-0 invert"
          width={224}
          height={76}
        />
        <span className="text-sm font-medium text-white/90">{MOTTO}</span>
      </h1>
    </header>
  )
}
