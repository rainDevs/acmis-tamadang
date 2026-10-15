import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FormError } from '@/components/ui/field'
import EmptyState from '@/components/shared/EmptyState'
import LoadingState from '@/components/shared/LoadingState'
import { getAvailabilitySummary, getServices, submitAppointment } from '@/services/api'
import ServiceStep from './ServiceStep'
import ScheduleStep from './ScheduleStep'
import DetailsStep from './DetailsStep'

// Client checks mirror the server rules exactly; the server stays
// authoritative (RULES §6).
function validateDetails({ fullName, contactNumber }) {
  const errors = {}
  const name = fullName.trim()
  if (!name) {
    errors.fullName = 'Full name is required.'
  } else if (name.length > 100) {
    errors.fullName = 'Full name must be 100 characters or fewer.'
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

// Mobile-first booking flow: service → date → slot → details → review → done.
// Server stays authoritative; client checks only prevent wasted round trips.
export default function BookingFlow() {
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
  const [contactNumber, setContactNumber] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [reviewOpen, setReviewOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState(null)

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

  const loadAvailability = useCallback((sid) => {
    setAvailStatus('loading')
    setAvailError('')
    const from = new Date()
    const to = new Date()
    to.setDate(to.getDate() + 13)
    getAvailabilitySummary({ serviceId: sid, from: toISO(from), to: toISO(to) })
      .then((res) => {
        setDays(res.data)
        setAvailStatus('ready')
        setAvailVersion((v) => v + 1)
        const first = res.data.find((d) => !d.closed && d.slots_left > 0)
        setDate(first ? first.date : '')
        setSlot('')
      })
      .catch((err) => {
        setAvailStatus('error')
        setAvailError(err.message || 'Could not load schedules.')
      })
  }, [])

  function chooseService(id) {
    setServiceId(id)
    setDate('')
    setSlot('')
    loadAvailability(id)
  }

  function changeField(key, value) {
    if (key === 'fullName') setFullName(value)
    else setContactNumber(value)
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function review() {
    const errors = validateDetails({ fullName, contactNumber })
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
        contact_number: contactNumber.replace(/\s/g, ''),
        service_id: serviceId,
        appointment_date: date,
        start_time: slot,
      })
      setResult(res.data)
      setFullName('')
      setContactNumber('')
      setReviewOpen(false)
    } catch (err) {
      if (err.status === 409) {
        // Slot taken meanwhile: refresh, send back to schedule, keep inputs.
        setReviewOpen(false)
        setAvailError(err.message)
        if (serviceId) loadAvailability(serviceId)
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
      <ConfirmationView
        referenceNo={result.reference_no}
        serviceName={service ? service.name : ''}
        date={result.appointment_date}
        slot={result.start_time}
      />
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

      <div className="mt-5">
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
                <Button type="button" variant="outline" size="lg" onClick={() => loadAvailability(serviceId)}>
                  Retry
                </Button>
              </div>
            ) : (
              <>
                {availError ? <FormError message={availError} /> : null}
                <ScheduleStep key={availVersion} days={days} selectedDate={date} onDate={(d) => { setDate(d); setSlot('') }} selectedSlot={slot} onSlot={setSlot} />
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
            contactNumber={contactNumber}
            errors={fieldErrors}
            onChange={changeField}
            onBack={() => setStep(1)}
            onReview={review}
          />
        ) : null}
      </div>

      <ReviewDialog
        open={reviewOpen}
        onClose={() => !submitting && setReviewOpen(false)}
        summary={{
          serviceName: service ? service.name : '',
          date,
          slot,
          fullName: fullName.trim(),
          contactNumber: contactNumber.replace(/\s/g, ''),
        }}
        submitting={submitting}
        error={submitError}
        onConfirm={confirm}
      />
    </div>
  )
}
