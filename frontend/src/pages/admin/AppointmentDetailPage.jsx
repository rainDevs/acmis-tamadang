import { useParams } from 'react-router'
import AppointmentDetail from '@/features/staff/AppointmentDetail'
import Reveal from '@/components/shared/Reveal'

// Staff request detail (live since TASK-015).
export default function AppointmentDetailPage() {
  const { referenceNo } = useParams()
  return (
    <div>
      <Reveal>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Request detail</h1>
      </Reveal>
      <Reveal delay={0.06}>
        <div className="mt-5">
          <AppointmentDetail referenceNo={String(referenceNo || '').toUpperCase()} />
        </div>
      </Reveal>
    </div>
  )
}
