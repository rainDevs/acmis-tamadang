import { Link } from 'react-router'
import { Clock, HeartPulse, MapPin, Phone } from 'lucide-react'

const quickLinks = [
  { to: '/', label: 'Home' },
  { to: '/request', label: 'Request appointment' },
  { to: '/status', label: 'Check status' },
  { to: '/admin/login', label: 'Staff login' },
]

const serviceLinks = [
  'General Consultation',
  'Maternal & Child Health',
  'Immunization',
  'Senior Citizen Care',
]

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-white">
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-600 text-white" aria-hidden="true">
              <HeartPulse className="size-4" />
            </span>
            ACMIS · Tamadang
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Online appointment requests for Barangay Tamadang Health Center, Kiamba, Sarangani Province.
          </p>
        </div>
        <nav aria-label="Footer">
          <p className="text-sm font-bold text-white">Quick links</p>
          <ul className="mt-3 space-y-2 text-sm">
            {quickLinks.map((l) => (
              <li key={l.to + l.label}>
                <Link to={l.to} className="rounded text-slate-400 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-emerald-400">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="text-sm font-bold text-white">Services</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            {serviceLinks.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-500">Full list on the home page.</p>
        </div>
        <div>
          <p className="text-sm font-bold text-white">Visit us</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Tamadang, Kiamba, Sarangani
            </li>
            <li className="flex items-start gap-2">
              <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Mon–Fri, 8:00 AM – 5:00 PM (except holidays)
            </li>
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Emergencies: go directly to the center
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs leading-relaxed text-slate-500 sm:px-6">
          ACMIS demo frontend with mock data. Personal and health information is handled under the Data Privacy Act of 2012.
        </p>
      </div>
    </footer>
  )
}
