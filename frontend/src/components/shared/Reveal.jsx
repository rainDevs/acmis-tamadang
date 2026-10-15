import { motion, useReducedMotion } from 'motion/react'

// Subtle scroll reveal for low-end phones: opacity + short rise only.
// Respects prefers-reduced-motion; renders plain div when reduced.
export default function Reveal({ children, className, delay = 0, y = 16 }) {
  const reduce = useReducedMotion()
  if (reduce) {
    return <div className={className}>{children}</div>
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-64px' }}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
