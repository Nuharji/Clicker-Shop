// Läuft, bevor React hydratisiert, damit es beim Laden nicht kurz im
// falschen Theme aufblitzt ("flash of wrong theme"). Liest die
// gespeicherte Präferenz aus localStorage, sonst System-Einstellung.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var dark =
      stored === "dark" ||
      (stored !== "light" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
}
