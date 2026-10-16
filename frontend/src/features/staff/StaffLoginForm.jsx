import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Loader2, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FormError, TextInput } from '@/components/ui/field'
import { useStaffSession } from './useStaffSession'

// Live staff login (TASK-013). Server verifies credentials; incorrect logins
// and lockouts surface here with the server's safe messages.
export default function StaffLoginForm() {
  const { signIn } = useStaffSession()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    if (submitting) return
    const next = {}
    if (!username.trim()) next.username = 'Username is required.'
    if (!password) next.password = 'Password is required.'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    setSubmitting(true)
    setFormError('')
    try {
      await signIn(username.trim(), password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setFormError(err.message || 'Sign in failed. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3" noValidate>
      <Field label="Username" required htmlFor="staff-user" error={errors.username}>
        <TextInput
          id="staff-user"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value)
            setErrors((p) => ({ ...p, username: undefined }))
          }}
          invalid={Boolean(errors.username)}
          required
        />
      </Field>
      <Field label="Password" required htmlFor="staff-pass" error={errors.password}>
        <TextInput
          id="staff-pass"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setErrors((p) => ({ ...p, password: undefined }))
          }}
          invalid={Boolean(errors.password)}
          required
        />
      </Field>
      {formError ? <FormError message={formError} /> : null}
      <Button type="submit" size="lg" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Signing in…
          </>
        ) : (
          <>
            <LogIn className="size-4" aria-hidden="true" /> Sign in
          </>
        )}
      </Button>
    </form>
  )
}
