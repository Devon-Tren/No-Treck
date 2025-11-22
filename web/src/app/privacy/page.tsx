// File: src/app/privacy/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy | No Trek',
  description:
    'How No Trek and Stella handle your information, what we collect, and the choices you have about your data.',
}

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      {/* Background – match app aesthetic */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-32 h-80 w-80 rounded-full bg-[#0E5BD8]/25 blur-3xl animate-[pulse_14s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 -left-40 h-96 w-96 rotate-12 bg-gradient-to-tr from-[#0E5BD8]/20 via-sky-500/10 to-transparent blur-3xl animate-[spin_50s_linear_infinite]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-72 w-72 rounded-full bg-sky-400/15 blur-3xl animate-[pulse_18s_ease-in-out_infinite]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0)_0,_#020617_55%)]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 py-10 lg:px-8 lg:py-16">
        {/* Top nav */}
        <nav className="mb-8 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/80 px-3 sm:px-4 py-2.5 sm:py-3 backdrop-blur">
          <Link href="/" className="flex items-center gap-2 text-slate-100">
            <div className="h-7 w-7 rounded-full bg-[#0E5BD8]/80 shadow-[0_0_20px_rgba(37,99,235,0.7)]" />
            <span className="text-sm font-semibold tracking-tight">
              NO <span className="font-extrabold italic">TREK</span>
            </span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <Link
              href="/"
              className="rounded-full border border-transparent px-3 py-1.5 text-slate-300 hover:border-slate-600 hover:bg-slate-900 hover:text-slate-50"
            >
              Home
            </Link>
            <Link
              href="/intake"
              className="rounded-full border border-transparent px-3 py-1.5 text-slate-300 hover:border-slate-600 hover:bg-slate-900 hover:text-slate-50"
            >
              Intake
            </Link>
            <Link
              href="/tasks"
              className="rounded-full border border-transparent px-3 py-1.5 text-slate-300 hover:border-slate-600 hover:bg-slate-900 hover:text-slate-50"
            >
              Tasks
            </Link>
            <Link
              href="/privacy"
              className="rounded-full border border-slate-200/70 bg-slate-100/10 px-3 py-1.5 text-slate-50"
            >
              Privacy
            </Link>
          </div>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <p className="text-[10px] font-semibold tracking-[0.25em] text-sky-300/80">
            PRIVACY &amp; DATA
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            No Trek Privacy Notice
          </h1>
          <p className="mt-4 text-sm text-slate-300">
            This page explains how No Trek (&quot;No Trek&quot;, &quot;we&quot;, &quot;our&quot;)
            and Stella, our AI guide, handle your information. It is meant to be clear and
            understandable, but it is not legal advice. You should review and adapt this notice with
            your own legal counsel.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Last updated: {/* TODO: update this date when you change the policy */}March 1, 2025
          </p>
        </header>

        <div className="space-y-10 text-sm leading-relaxed text-slate-200">
          {/* 1. Who we are */}
          <section aria-labelledby="who-we-are">
            <h2
              id="who-we-are"
              className="text-base font-semibold text-slate-50"
            >
              1. Who we are
            </h2>
            <p className="mt-2 text-slate-300">
              No Trek is a service designed to help people navigate healthcare: understanding what
              might be going on, what kind of care to seek, and how to handle logistics like
              scheduling and follow-up. Stella is the conversational AI interface that powers much
              of this experience.
            </p>
            <p className="mt-2 text-slate-300">
              For the purposes of data protection laws, No Trek (legal entity to be updated) is the{' '}
              <span className="font-medium">controller</span> of your personal information for most
              uses described here.
            </p>
            <p className="mt-2 text-slate-300">
              You can reach us about privacy questions at:
            </p>
            <ul className="mt-2 list-inside list-disc text-slate-300">
              <li>
                <span className="font-medium">Email:</span>{' '}
                <a
                  href="mailto:privacy@notrek.health"
                  className="text-sky-400 underline-offset-2 hover:underline"
                >
                  privacy@notrek.health
                </a>
              </li>
              <li>
                <span className="font-medium">Postal address:</span> {/* TODO: add full address */}
                City, State, Country
              </li>
            </ul>
          </section>

          {/* 2. Scope */}
          <section aria-labelledby="scope">
            <h2
              id="scope"
              className="text-base font-semibold text-slate-50"
            >
              2. What this notice covers
            </h2>
            <p className="mt-2 text-slate-300">
              This notice applies when you use No Trek or Stella through our website or app, when
              you contact us, and when we communicate with you about the service. It covers both:
            </p>
            <ul className="mt-2 list-inside list-disc text-slate-300">
              <li>
                <span className="font-medium">Personal information</span> (data that identifies you
                or can be reasonably linked to you), and
              </li>
              <li>
                <span className="font-medium">Sensitive information</span>, including information
                about your health, symptoms, care history, or insurance.
              </li>
            </ul>
            <p className="mt-2 text-slate-300">
              This notice does not replace any separate legal agreements we may have (for example, a
              business associate agreement or a provider contract) and does not itself make No Trek
              your healthcare provider.
            </p>
          </section>

          {/* 3. Information we collect */}
          <section aria-labelledby="info-we-collect">
            <h2
              id="info-we-collect"
              className="text-base font-semibold text-slate-50"
            >
              3. Information we collect
            </h2>

            <p className="mt-2 text-slate-300">
              The exact information we collect depends on how you use No Trek. In general, we may
              collect:
            </p>

            <div className="mt-3 space-y-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <h3 className="text-sm font-semibold text-slate-50">
                3.1 Information you provide directly
              </h3>
              <ul className="mt-2 list-inside list-disc text-slate-300">
                <li>
                  <span className="font-medium">Account details:</span> name, email address, login
                  credentials, and basic profile information if you create an account.
                </li>
                <li>
                  <span className="font-medium">Health and situation details:</span> anything you
                  type or say to Stella about symptoms, injuries, diagnoses, medications, previous
                  care, preferences, or worries (for example, &quot;my knee has hurt for a month
                  after a fall&quot;).
                </li>
                <li>
                  <span className="font-medium">Insurance and logistics:</span> information about
                  your insurance coverage, usual clinics or hospitals, preferred pharmacies, or
                  scheduling constraints, when you choose to share that with us.
                </li>
                <li>
                  <span className="font-medium">Communications with us:</span> emails, support
                  requests, or other messages sent to our team.
                </li>
              </ul>
            </div>

            <div className="mt-3 space-y-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <h3 className="text-sm font-semibold text-slate-50">
                3.2 Information collected automatically
              </h3>
              <ul className="mt-2 list-inside list-disc text-slate-300">
                <li>
                  <span className="font-medium">Usage data:</span> how you interact with the app,
                  such as features used, pages viewed, timestamps, and click paths.
                </li>
                <li>
                  <span className="font-medium">Device and technical data:</span> IP address,
                  browser type, device type, operating system, and basic settings to help us keep
                  the service secure and working.
                </li>
                <li>
                  <span className="font-medium">Approximate location:</span> city, region, or
                  geolocation derived from your IP address or what you tell us, used to show
                  relevant options near you. We do not continuously track your location.
                </li>
              </ul>
            </div>

            <div className="mt-3 space-y-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <h3 className="text-sm font-semibold text-slate-50">
                3.3 Information from other sources
              </h3>
              <p className="mt-1 text-slate-300">
                With your permission or when acting on your instructions, we may receive
                information from:
              </p>
              <ul className="mt-2 list-inside list-disc text-slate-300">
                <li>
                  Healthcare providers, clinics, or health systems you connect to through No Trek.
                </li>
                <li>
                  Insurance plans or benefits tools you ask us to use for coverage or cost checks.
                </li>
                <li>
                  Communication tools (for example, telephony or email providers) used to help with
                  calls, reminders, or confirmations.
                </li>
              </ul>
            </div>
          </section>

          {/* 4. How we use information */}
          <section aria-labelledby="how-we-use">
            <h2
              id="how-we-use"
              className="text-base font-semibold text-slate-50"
            >
              4. How we use your information
            </h2>
            <p className="mt-2 text-slate-300">
              We use your information only for reasons connected to providing and improving No Trek.
              Typical purposes include:
            </p>
            <ul className="mt-2 list-inside list-disc text-slate-300">
              <li>To operate Stella and respond to what you tell or ask us.</li>
              <li>To help you understand options, risks, and logistics related to your care.</li>
              <li>
                To support tasks you ask for, such as preparing call scripts or helping with
                bookings.
              </li>
              <li>To personalize suggestions and follow-ups based on your context.</li>
              <li>To maintain security, prevent misuse, and debug issues.</li>
              <li>To analyze how No Trek is used so we can make it better.</li>
              <li>To comply with legal obligations, resolve disputes, and enforce our terms.</li>
            </ul>
            <p className="mt-2 text-xs text-slate-400">
              If you are in a region that requires a specific &quot;legal basis&quot; for using
              personal information (for example, the European Economic Area or United Kingdom), we
              typically rely on a mix of consent, contract (providing the service you requested),
              and legitimate interests, depending on the context. You should adapt this section with
              your own counsel.
            </p>
          </section>

          {/* 5. Sharing & service providers */}
          <section aria-labelledby="sharing">
            <h2
              id="sharing"
              className="text-base font-semibold text-slate-50"
            >
              5. How we share information
            </h2>
            <p className="mt-2 text-slate-300">
              We do <span className="font-semibold uppercase">not</span> sell your personal
              information or share it with third parties for their own advertising.
            </p>
            <p className="mt-2 text-slate-300">
              We may share your information in these situations:
            </p>
            <ul className="mt-2 list-inside list-disc text-slate-300">
              <li>
                <span className="font-medium">Service providers:</span> with vendors that host our
                infrastructure, store data, provide analytics, send emails or SMS, support calls, or
                help operate the product—only as needed to provide those services and under
                contracts that limit their use.
              </li>
              <li>
                <span className="font-medium">AI and model providers:</span> with third-party model
                providers we use to generate or improve responses (for example, large language
                models). We aim to configure these providers so your data is not used to train their
                public models, and we will state clearly in this policy if that changes.
              </li>
              <li>
                <span className="font-medium">With your direction:</span> with healthcare providers,
                payers, or others when you explicitly ask us to help you contact or share
                information with them.
              </li>
              <li>
                <span className="font-medium">Legal and safety:</span> to comply with applicable
                laws, valid legal processes, or government requests; to protect the rights,
                property, or safety of you, No Trek, or others; and to detect and respond to
                fraud, security, or technical issues.
              </li>
              <li>
                <span className="font-medium">Business transfers:</span> in connection with a
                merger, acquisition, financing, or sale of all or part of our business, subject to
                appropriate confidentiality protections.
              </li>
            </ul>
            <p className="mt-2 text-xs text-slate-400">
              You should customize this section with the specific vendors and categories you actually
              use (hosting, telephony, analytics, etc.) and, where required by law, include a
              jurisdiction-specific &quot;sale/sharing&quot; disclosure.
            </p>
          </section>

          {/* 6. Cookies & tracking */}
          <section aria-labelledby="cookies">
            <h2
              id="cookies"
              className="text-base font-semibold text-slate-50"
            >
              6. Cookies, analytics, and similar technologies
            </h2>
            <p className="mt-2 text-slate-300">
              We may use cookies, local storage, and similar technologies to:
            </p>
            <ul className="mt-2 list-inside list-disc text-slate-300">
              <li>Keep you signed in and remember your settings.</li>
              <li>Measure and improve how people use No Trek.</li>
              <li>Protect the service from misuse and abuse.</li>
            </ul>
            <p className="mt-2 text-slate-300">
              You can often control cookies through your browser settings. Where required by law, we
              will obtain your consent for non-essential cookies or provide an in-product way to
              manage your preferences.
            </p>
          </section>

          {/* 7. Health context / not emergency care */}
          <section aria-labelledby="health-context">
            <h2
              id="health-context"
              className="text-base font-semibold text-slate-50"
            >
              7. Health context and limits of the service
            </h2>
            <p className="mt-2 text-slate-300">
              No Trek and Stella handle information that may relate to your health, but No Trek is
              not a replacement for emergency services or for care from licensed clinicians.
            </p>
            <ul className="mt-2 list-inside list-disc text-slate-300">
              <li>
                Stella provides educational support, organization, and logistics help, not a
                diagnosis or medical treatment.
              </li>
              <li>
                You should always seek immediate in-person care or call emergency services if you
                think you may be experiencing a medical emergency.
              </li>
              <li>
                Depending on how No Trek is deployed and your relationship with your providers, some
                information we handle may be subject to health privacy laws (such as HIPAA in the
                United States). This page is a general privacy notice and does not replace any
                required Notice of Privacy Practices from your provider.
              </li>
            </ul>
          </section>

          {/* 8. Retention */}
          <section aria-labelledby="retention">
            <h2
              id="retention"
              className="text-base font-semibold text-slate-50"
            >
              8. How long we keep your information
            </h2>
            <p className="mt-2 text-slate-300">
              We keep your information only as long as we reasonably need it for the purposes
              described above, including:
            </p>
            <ul className="mt-2 list-inside list-disc text-slate-300">
              <li>To provide and maintain your account and requested features.</li>
              <li>To comply with legal obligations and resolve disputes.</li>
              <li>To maintain business and security records.</li>
            </ul>
            <p className="mt-2 text-slate-300">
              In many cases, this means your data is kept for as long as your account is active,
              plus a period afterwards (for example, to comply with record-keeping or audit
              requirements). You can ask us to delete certain information, subject to applicable
              law and legitimate business or legal needs.
            </p>
          </section>

          {/* 9. Security */}
          <section aria-labelledby="security">
            <h2
              id="security"
              className="text-base font-semibold text-slate-50"
            >
              9. How we protect your information
            </h2>
            <p className="mt-2 text-slate-300">
              We use reasonable technical and organizational measures to protect your information,
              such as encryption in transit, access controls, and logging. However, no system or
              service can guarantee perfect security.
            </p>
            <p className="mt-2 text-slate-300">
              If we become aware of a security incident that affects your information, we will take
              steps to investigate, mitigate harm, and notify you and/or regulators when required by
              law.
            </p>
          </section>

          {/* 10. Your choices & rights */}
          <section aria-labelledby="your-rights">
            <h2
              id="your-rights"
              className="text-base font-semibold text-slate-50"
            >
              10. Your choices and rights
            </h2>
            <p className="mt-2 text-slate-300">
              Depending on where you live and how you use No Trek, you may have certain rights over
              your personal information. These can include the right to:
            </p>
            <ul className="mt-2 list-inside list-disc text-slate-300">
              <li>Access a copy of the personal information we have about you.</li>
              <li>Request that we correct inaccurate or incomplete information.</li>
              <li>Request deletion of some or all of your information.</li>
              <li>
                Object to or request restriction of certain types of processing (for example,
                analytics or personalization in some regions).
              </li>
              <li>
                Receive your data in a portable format, in situations where that is required by law.
              </li>
              <li>Withdraw consent where we rely on consent to process your information.</li>
            </ul>
            <p className="mt-2 text-slate-300">
              You can exercise many of these choices directly in your account (where available), or
              by emailing{' '}
              <a
                href="mailto:privacy@notrek.health"
                className="text-sky-400 underline-offset-2 hover:underline"
              >
                privacy@notrek.health
              </a>
              . We may need to verify your identity before fulfilling your request, and some
              requests may be limited by technical, legal, or contractual requirements.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              If you are covered by the laws of the European Economic Area, United Kingdom,
              California, or other jurisdictions with specific privacy rights, you should work with
              your legal counsel to adapt this section and provide any required links (such as a
              &quot;Do Not Sell or Share&quot; link, if applicable).
            </p>
          </section>

          {/* 11. International transfers */}
          <section aria-labelledby="international">
            <h2
              id="international"
              className="text-base font-semibold text-slate-50"
            >
              11. International data transfers
            </h2>
            <p className="mt-2 text-slate-300">
              No Trek may process and store information in countries that may have different data
              protection laws than the country where you live. When we transfer personal information
              internationally, we aim to do so in accordance with applicable laws—for example, by
              using standard contractual clauses or similar safeguards where required.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              You should adapt this section with counsel based on where you host data, where your
              users are located, and which cross-border transfer mechanisms you rely on.
            </p>
          </section>

          {/* 12. Children */}
          <section aria-labelledby="children">
            <h2
              id="children"
              className="text-base font-semibold text-slate-50"
            >
              12. Children and minors
            </h2>
            <p className="mt-2 text-slate-300">
              No Trek is currently designed primarily for adults. If you allow minors to use No Trek
              (for example, with a parent or guardian), you should update this section to explain
              how that works and what additional protections apply.
            </p>
            <p className="mt-2 text-slate-300">
              We do not knowingly collect personal information from children under 13 without
              appropriate parental consent. If you believe a child has provided us personal
              information in violation of this policy, please contact us and we will take steps to
              delete it when required by law.
            </p>
          </section>

          {/* 13. Changes */}
          <section aria-labelledby="changes">
            <h2
              id="changes"
              className="text-base font-semibold text-slate-50"
            >
              13. Changes to this notice
            </h2>
            <p className="mt-2 text-slate-300">
              We may update this Privacy Notice from time to time as our product, practices, or
              legal requirements change. When we do, we will change the &quot;Last updated&quot;
              date at the top of the page and, when appropriate, provide additional notice (such as
              an in-app banner, email, or other message).
            </p>
            <p className="mt-2 text-slate-300">
              We encourage you to review this page periodically to stay informed about how No Trek
              handles your information.
            </p>
          </section>

          {/* 14. Contact */}
          <section aria-labelledby="contact">
            <h2
              id="contact"
              className="text-base font-semibold text-slate-50"
            >
              14. How to contact us
            </h2>
            <p className="mt-2 text-slate-300">
              If you have questions or concerns about this Privacy Notice or our data practices,
              you can contact us at:
            </p>
            <ul className="mt-2 list-inside list-disc text-slate-300">
              <li>
                <span className="font-medium">Email:</span>{' '}
                <a
                  href="mailto:privacy@notrek.health"
                  className="text-sky-400 underline-offset-2 hover:underline"
                >
                  privacy@notrek.health
                </a>
              </li>
              <li>
                <span className="font-medium">Postal address:</span> {/* TODO: add full address */}
                City, State, Country
              </li>
            </ul>
            <p className="mt-2 text-xs text-slate-400">
              If you are located in a region with a data protection authority or similar regulator,
              you may also have the right to lodge a complaint with that authority.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-xs">
              <Link
                href="/"
                className="rounded-full border border-slate-700/80 bg-slate-950/80 px-4 py-2 text-slate-200 underline-offset-2 hover:border-sky-400 hover:text-sky-200 hover:underline"
              >
                ← Back to home
              </Link>
              <Link
                href="/intake"
                className="rounded-full bg-sky-500 px-4 py-2 font-semibold text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.7)] hover:bg-sky-400"
              >
                Start with Stella
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
