export default function SectionHeading({ eyebrow, title, description, id }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow ? (
        <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase dark:text-emerald-400">{eyebrow}</p>
      ) : null}
      <h2 id={id} className="mt-2 text-2xl font-bold text-balance sm:text-3xl">
        {title}
      </h2>
      {description ? <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p> : null}
    </div>
  )
}
