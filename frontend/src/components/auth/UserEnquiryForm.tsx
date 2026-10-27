import { useState } from 'react'
import UserEnquiryForm from './UserEnquiryForm'

export default function CandidateEnquiryPage() {
  const [showForm, setShowForm] = useState(false)
  const [showWhatsApp, setShowWhatsApp] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')

  const formUrl = `${window.location.origin}/candidate-enquiry-form`

  const shareWhatsApp = () => {
    const number = mobile.replace(/\D/g, '')

    if (!/^[1-9]\d{7,14}$/.test(number)) {
      alert('Please enter a valid mobile number with country code.')
      return
    }

    const message = `Please fill out the Candidate Enquiry Form: ${formUrl}`

    window.open(
      `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  const shareEmail = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert('Please enter a valid email address.')
      return
    }

    const subject = 'Candidate Enquiry Form'
    const body = `Please fill out the Candidate Enquiry Form:\n${formUrl}`

    window.location.href =
      `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  if (showForm) {
    return (
      <div className="p-6">
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="mb-4 rounded border px-4 py-2"
        >
          if (showForm) {
            return <UserEnquiryForm />
          }
        </button>

        <UserEnquiryForm />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-2 text-2xl font-semibold">
        Candidate Enquiry
      </h1>

      <p className="mb-6 text-gray-600">
        Choose an option to continue.
      </p>

      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          type="button"
          onClick={() => {
            setShowWhatsApp(true)
            setShowEmail(false)
          }}
          style={{ backgroundColor: '#16a34a', color: '#fff' }}
          className="rounded-md px-5 py-3"
        >
          Share via WhatsApp
        </button>

        <button
          type="button"
          onClick={() => {
            setShowEmail(true)
            setShowWhatsApp(false)
          }}
          style={{ backgroundColor: '#2563eb', color: '#fff' }}
          className="rounded-md px-5 py-3"
        >
          Share via Email
        </button>

        <button
          type="button"
          onClick={() => setShowForm(true)}
          style={{ backgroundColor: '#1f2937', color: '#fff' }}
          className="rounded-md px-5 py-3"
        >
          Fill Here
        </button>
      </div>

      {showWhatsApp && (
        <div className="mt-6 rounded-lg border p-5">
          <div className="flex items-center gap-3">
            <input
              id="candidate-mobile"
              type="tel"
              value={mobile}
              onChange={(event) => setMobile(event.target.value)}
              placeholder="Mobile number with country code"
              aria-label="Mobile number with country code"
              className="min-w-0 flex-1 rounded-md border px-3 py-3"
            />

            <button
              type="button"
              onClick={shareWhatsApp}
              aria-label="Send via WhatsApp"
              title="Send via WhatsApp"
              style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {showEmail && (
        <div className="mt-6 rounded-lg border p-5">
          <label htmlFor="candidate-email" className="mb-2 block">
            Email Address
          </label>

          <input
            id="candidate-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter email address"
            className="mb-4 w-full rounded-md border px-3 py-2"
          />

          <button
            type="button"
            onClick={shareEmail}
            style={{ backgroundColor: '#2563eb', color: '#fff' }}
            className="flex items-center gap-2 rounded-md px-5 py-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
            Send
          </button>
        </div>
      )}
    </div>
  )
}