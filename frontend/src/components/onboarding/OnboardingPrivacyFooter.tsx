export function OnboardingPrivacyFooter() {
  return (
    <div className="mx-auto max-w-full text-center text-[0.625rem] leading-snug text-muted-foreground">
      <p>
        Dane użytkownika przechowujemy wyłącznie lokalnie oraz do celów AI.
      </p>
      <a
        href="/polityka-prywatnosci"
        className="mt-1 inline-block text-primary underline underline-offset-2"
      >
        Zapoznaj się z polityką prywatności
      </a>
    </div>
  )
}
