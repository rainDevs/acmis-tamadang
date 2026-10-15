import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">The page you opened does not exist or was moved.</p>
      <Button asChild className="mt-6 bg-emerald-700 hover:bg-emerald-700/90">
        <Link to="/">Go home</Link>
      </Button>
    </div>
  )
}
