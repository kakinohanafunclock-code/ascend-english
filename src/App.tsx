/**
 * App shell. Routes are wired up in the UI step; this minimal shell exists so the
 * dev server and scaffold boot cleanly before pages land.
 */
export default function App() {
  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="card card-pad max-w-md text-center">
        <p className="eyebrow mb-2">Ascend</p>
        <h1 className="text-h1 font-semibold mb-2">TOEFL 105+ English Studio</h1>
        <p className="text-ink-muted">Scaffold ready. Building modules…</p>
      </div>
    </main>
  );
}
