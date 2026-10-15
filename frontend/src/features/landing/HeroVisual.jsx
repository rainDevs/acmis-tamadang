import doctorArt from '@/assets/doctor-undraw.svg'

// Doctor visual (unDraw open-source illustration, recolored to brand emerald;
// free for commercial use without attribution) with a short caption.
export default function HeroVisual() {
  return (
    <div className="mx-auto w-full max-w-md lg:max-w-none">
      <img
        src={doctorArt}
        alt="Doctor holding a medical chart"
        width="1086"
        height="783"
        className="h-auto w-full"
        loading="eager"
      />
      <p className="mt-2 text-center text-sm font-bold text-slate-900 dark:text-white">Care starts with a request</p>
      <p className="mt-1 text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        Quality health care, one appointment at a time.
      </p>
    </div>
  )
}
