import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { FormError } from '@/components/ui/field'
import EmptyState from '@/components/shared/EmptyState'
import LoadingState from '@/components/shared/LoadingState'
import Reveal from '@/components/shared/Reveal'
import { getAvailabilitySummary, getServices, submitAppointment } from '@/services/api'
import ServiceStep from './ServiceStep'
import ScheduleStep from './ScheduleStep'
import DetailsStep from './DetailsStep'

// Client checks mirror the server rules exactly; the server stays
// authoritative (RULES §6).
function validateDetails({ fullName, address, contactNumber }) {
  const errors = {}
  const name = fullName.trim()
  if (!name) {
    errors.fullName = 'Full name is required.'
  } else if (name.length > 100) {
    errors.fullName = 'Full name must be 100 characters or fewer.'
  }
  const addr = address.trim()
  if (!addr) {
    errors.address = 'Address is required so staff can verify your request.'
  } else if (addr.length > 255) {
    errors.address = 'Address must be 255 characters or fewer.'
  }
  const contact = contactNumber.replace(/\s/g, '')
  if (!contact) {
    errors.contactNumber = 'Contact number is required.'
  } else if (!/^09\d{9}$/.test(contact)) {
    errors.contactNumber = 'Enter a valid 11-digit mobile number (e.g. 09xx xxx xxxx).'
  }
  return errors
}
import ReviewDialog from './ReviewDialog'
import ConfirmationView from './ConfirmationView'

function toISO(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const steps = ['Service', 'Schedule', 'Details']

// Step transition: subtle slide/fade on user-driven step changes only
// (AnimatePresence initial={false} — no entrance animation on page load).
// Reduced-motion users get an instant swap. Focus moves to the step
// heading on every change so keyboard/screen-reader users land on the
// new panel instead of being left behind on the old one.
function StepPanel({ stepKey, title, reduce, panelRef, children }) {
  const body = (
    <>
      <h2 className="sr-only">{title}</h2>
      {children}
    </>
  )
  if (reduce) {
    return (
      <div ref={panelRef} tabIndex={-1} className="mt-5 outline-none">
        {body}
      </div>
    )
  }
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={stepKey}
        ref={panelRef}
        tabIndex={-1}
        className="mt-5 outline-none"
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -16 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {body}
      </motion.div>
    </AnimatePresence>
  )
}

// Mobile-first booking flow: service → date → slot → details → review → done.
// Server stays authoritative; client checks only prevent wasted round trips.
export default function BookingFlow() {
  const reduce = useReducedMotion()
  const [step, setStep] = useState(0)
  const [services, setServices] = useState([])
  const [svcStatus, setSvcStatus] = useState('loading')
  const [serviceId, setServiceId] = useState(null)
  const [days, setDays] = useState([])
  const [availVersion, setAvailVersion] = useState(0)
  const [availStatus, setAvailStatus] = useState('idle')
  const [availError, setAvailError] = useState('')
  const [date, setDate] = useState('')
  const [slot, setSlot] = useState('')
  const [fullName, setFullName] = useState('')
  const [address, setAddress] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [reviewOpen, setReviewOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState(null)

  // Move focus to the new step panel on every user-driven step change
  // (Continue, Back, 409-recovery). Skipped on first mount so page load
  // never steals focus past the page heading.
  const panelRef = useRef(null)
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    panelRef.current?.focus()
  }, [step])

  const fetchServices = useCallback(() => {
    getServices()
      .then((res) => {
        setServices(res.data)
        setSvcStatus('ready')
      })
      .catch(() => setSvcStatus('error'))
  }, [])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  function retryServices() {
    setSvcStatus('loading')
    fetchServices()
  }

  // Availability is cached per calendar month and fetched on demand as the
  // user browses (months without data render as placeholders meanwhile).
  // Only a fresh service choice remounts the calendar (availVersion bump).
  const fetchedRef = useRef([])
  const [loadingMonth, setLoadingMonth] = useState(false)

  function mergeDays(prev, incoming) {
    const map = Object.fromEntries(prev.map((d) => [d.date, d]))
    incoming.forEach((d) => {
      map[d.date] = d
    })
    return Object.values(map).sort((a, b) => (a.date < b.date ? -1 : 1))
  }

  const loadMonth = useCallback((sid, monthKey, { force = false } = {}) => {
    if (!sid) return Promise.resolve([])
    if (!force && fetchedRef.current.includes(monthKey)) return Promise.resolve([])
    if (!fetchedRef.current.includes(monthKey)) fetchedRef.current.push(monthKey)
    setLoadingMonth(true)
    const [y, m] = monthKey.split('-').map(Number)
    const last = new Date(y, m, 0).getDate()
    const pad = (n) => String(n).padStart(2, '0')
    return getAvailabilitySummary({ serviceId: sid, from: `${monthKey}-01`, to: `${monthKey}-${pad(last)}` })
      .then((res) => {
        setDays((prev) => mergeDays(prev, res.data))
        return res.data
      })
      .catch((err) => {
        fetchedRef.current = fetchedRef.current.filter((k) => k !== monthKey)
        setAvailError(err.message || 'Could not load schedules.')
        setAvailStatus('error')
        return []
      })
      .finally(() => {
        setLoadingMonth(false)
      })
  }, [])

  function chooseService(id) {
    setServiceId(id)
    setDays([])
    fetchedRef.current = []
    setDate('')
    setSlot('')
    setAvailError('')
    setAvailStatus('loading')
    const currentKey = toISO(new Date()).slice(0, 7)
    loadMonth(id, currentKey).then((data) => {
      setAvailVersion((v) => v + 1)
      const first = data.find((d) => !d.closed && d.slots_left > 0)
      setDate(first ? first.date : '')
      setAvailStatus('ready')
    })
  }

  function retrySchedules() {
    const key = (date || toISO(new Date())).slice(0, 7)
    setAvailStatus('loading')
    setAvailError('')
    loadMonth(serviceId, key, { force: true }).then((data) => {
      if (data.length > 0) setAvailStatus('ready')
    })
  }

  function changeField(key, value) {
    if (key === 'fullName') setFullName(value)
    else if (key === 'address') setAddress(value)
    else setContactNumber(value)
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function review() {
    const errors = validateDetails({ fullName, address, contactNumber })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return
    setSubmitError('')
    setReviewOpen(true)
  }

  async function confirm() {
    if (submitting) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await submitAppointment({
        full_name: fullName.trim(),
        address: address.trim(),
        contact_number: contactNumber.replace(/\s/g, ''),
        service_id: serviceId,
        appointment_date: date,
        start_time: slot,
      })
      setResult(res.data)
      setFullName('')
      setAddress('')
      setContactNumber('')
      setReviewOpen(false)
    } catch (err) {
      if (err.status === 409) {
        // Slot taken meanwhile: refresh its month, send back to schedule, keep inputs.
        setReviewOpen(false)
        setAvailError(err.message)
        if (serviceId && date) loadMonth(serviceId, date.slice(0, 7), { force: true })
        setStep(1)
      } else {
        setSubmitError(err.message || 'Submission failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const service = services.find((s) => s.id === serviceId)

  if (result) {
    return (
      <Reveal>
        <ConfirmationView
          referenceNo={result.reference_no}
          serviceName={service ? service.name : ''}
          date={result.appointment_date}
          slot={result.start_time}
        />
      </Reveal>
    )
  }

  return (
    <div>
      <ol className="flex gap-1.5" aria-label="Booking progress">
        {steps.map((label, i) => (
          <li
            key={label}
            aria-current={step === i ? 'step' : undefined}
            className={
              step === i
                ? 'flex-1 rounded-full bg-primary px-3 py-1.5 text-center text-xs font-bold text-primary-foreground'
                : 'flex-1 rounded-full bg-muted px-3 py-1.5 text-center text-xs font-medium text-muted-foreground'
            }
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      <StepPanel
        stepKey={step}
        title={`Step ${step + 1} of 3: ${steps[step]}`}
        reduce={reduce}
        panelRef={panelRef}
      >
        {step === 0 ? (
          svcStatus === 'loading' ? (
            <LoadingState message="Loading services…" />
          ) : svcStatus === 'error' ? (
            <div className="grid gap-3">
              <FormError message="Could not load services. Check your connection and try again." />
              <Button type="button" variant="outline" size="lg" onClick={retryServices}>
                Retry
              </Button>
            </div>
          ) : services.length === 0 ? (
            <EmptyState title="No services published yet" body="Please check back later or contact the health center directly." />
          ) : (
            <div className="grid gap-4">
              <ServiceStep services={services} selectedId={serviceId} onSelect={chooseService} />
              <Button type="button" size="lg" disabled={!serviceId} onClick={() => setStep(1)}>
                Continue
              </Button>
            </div>
          )
        ) : null}

        {step === 1 ? (
          <div className="grid gap-4">
            {availStatus === 'loading' ? (
              <LoadingState message="Loading schedules…" />
            ) : availStatus === 'error' ? (
              <div className="grid gap-3">
                <FormError message={availError} />
                <Button type="button" variant="outline" size="lg" onClick={retrySchedules}>
                  Retry
                </Button>
              </div>
            ) : (
              <>
                {availError ? <FormError message={availError} /> : null}
                <ScheduleStep key={availVersion} days={days} selectedDate={date} onDate={(d) => { setDate(d); setSlot('') }} selectedSlot={slot} onSlot={setSlot} onMonthChange={(mk) => loadMonth(serviceId, mk)} loadingMonth={loadingMonth} />
              </>
            )}
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <Button type="button" variant="outline" size="lg" onClick={() => setStep(0)} className="sm:w-auto">
                Back
              </Button>
              <Button type="button" size="lg" disabled={!slot} onClick={() => setStep(2)} className="sm:flex-1">
                Continue
              </Button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <DetailsStep
            fullName={fullName}
            address={address}
            contactNumber={contactNumber}
            errors={fieldErrors}
            onChange={changeField}
            onBack={() => setStep(1)}
            onReview={review}
          />
        ) : null}
      </StepPanel>

      <ReviewDialog
        open={reviewOpen}
        onClose={() => !submitting && setReviewOpen(false)}
        summary={{
          serviceName: service ? service.name : '',
          date,
          slot,
          fullName: fullName.trim(),
          address: address.trim(),
          contactNumber: contactNumber.replace(/\s/g, ''),
        }}
        submitting={submitting}
        error={submitError}
        onConfirm={confirm}
      />
    </div>
  )
}
