export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-500 text-sm py-4" role="status">
      <span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-brand-600 animate-spin" />
      {label}
    </div>
  )
}
