// Eine "debounce" Funktion. Sie sorgt dafür, dass eine Funktion (z.B. Speichern)
// nicht bei jeder einzelnen Tasten-Eingabe ausgeführt wird, sondern erst,
// wenn der Nutzer für eine kurze Zeit aufgehört hat zu tippen.
// Das schont die Performance und ist eine bessere Nutzererfahrung.

export function debounce(func, wait) {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
