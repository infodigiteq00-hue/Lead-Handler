import { Select } from './Field'

type Period = 'AM' | 'PM'

/** Parse a 24h "HH:MM" string into 12-hour parts. */
function parse(value: string): { h12: number; m: number; period: Period } {
  const [hStr, mStr] = (value || '10:00').split(':')
  const h = Number(hStr)
  const m = Number(mStr)
  const hour = Number.isNaN(h) ? 10 : h
  const min = Number.isNaN(m) ? 0 : m
  const period: Period = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return { h12, m: min, period }
}

/** Build a 24h "HH:MM" string from 12-hour parts. */
function build(h12: number, m: number, period: Period): string {
  let h = h12 % 12
  if (period === 'PM') h += 12
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)
const BASE_MINUTES = Array.from({ length: 12 }, (_, i) => i * 5) // 0,5,…,55

/**
 * 12-hour time picker with an explicit AM/PM option. Emits a 24h "HH:MM"
 * string so it stays a drop-in for the previous <input type="time">.
 */
export function TimePicker({
  value,
  onChange,
  id,
}: {
  value: string
  onChange: (value: string) => void
  id?: string
}) {
  const { h12, m, period } = parse(value)

  // Keep an odd existing minute (e.g. 13) selectable.
  const minutes = BASE_MINUTES.includes(m)
    ? BASE_MINUTES
    : [...BASE_MINUTES, m].sort((a, b) => a - b)

  const update = (next: Partial<{ h12: number; m: number; period: Period }>) =>
    onChange(build(next.h12 ?? h12, next.m ?? m, next.period ?? period))

  return (
    <div className="flex items-center gap-2">
      <Select
        id={id}
        aria-label="Hour"
        value={h12}
        onChange={(e) => update({ h12: Number(e.target.value) })}
        className="w-auto"
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </Select>
      <span className="text-slate-400">:</span>
      <Select
        aria-label="Minute"
        value={m}
        onChange={(e) => update({ m: Number(e.target.value) })}
        className="w-auto"
      >
        {minutes.map((mm) => (
          <option key={mm} value={mm}>
            {String(mm).padStart(2, '0')}
          </option>
        ))}
      </Select>
      <Select
        aria-label="AM or PM"
        value={period}
        onChange={(e) => update({ period: e.target.value as Period })}
        className="w-auto"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </Select>
    </div>
  )
}
