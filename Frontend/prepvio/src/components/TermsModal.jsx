import React from "react";
import { X } from "lucide-react";

function TermsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* BACKDROP - Removed backdrop-blur-sm for performance, used darker overlay instead */}
      <div
        className="absolute inset-0 bg-black/70" 
        onClick={onClose}
      />

      {/* MODAL - Added transform-gpu for hardware acceleration */}
      <div className="relative bg-white w-full max-w-4xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col transform-gpu">

        {/* HEADER */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b bg-white">
          <h2 className="text-xl font-bold text-gray-900">
            Terms & Conditions
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT - Optimized scrolling with overscroll-contain and smooth touch scrolling */}
        <div className="flex-1 px-6 py-6 overflow-y-auto text-gray-700 space-y-6 text-sm leading-relaxed overscroll-contain [scrollbar-gutter:stable]">

          <p className="text-gray-500">
            <strong>Last Updated:</strong> 31 December 2025
          </p>

          <p>
            Welcome to <strong>PrepVio</strong>. These Terms & Conditions
            (&quot;Terms&quot;) govern your access to and use of the PrepVio
            website, applications, and services (collectively, the
            &quot;Platform&quot;).
          </p>

          <Section title="1. About PrepVio">
            PrepVio is an AI-powered interview preparation and learning platform
            designed to help users practice interviews, improve skills, and gain
            insights through AI-driven experiences. PrepVio is a{" "}
            <strong>training and preparation tool only</strong>. We do not
            guarantee job placement or interview success.
          </Section>

          <Section title="2. Eligibility">
            You must be at least <strong>13 years old</strong>, legally capable
            of agreeing to these Terms, and use the Platform only for lawful
            purposes.
          </Section>

          <Section title="3. Account Registration & Security">
            You are responsible for safeguarding your account credentials and
            all activity under your account. PrepVio is not liable for losses
            caused by unauthorized access due to your negligence.
          </Section>

          <Section title="4. AI-Powered Features">
            AI-generated feedback is automated and may not be fully accurate.
            Output is for <strong>educational purposes only</strong> and should
            not be treated as professional or hiring advice.
          </Section>

          <Section title="5. No Job Guarantee">
            PrepVio is not a hiring agency and does not promise employment,
            interviews, or job offers.
          </Section>

          <Section title="6. Acceptable Use">
            You agree not to misuse the Platform, reverse-engineer systems,
            upload harmful content, or cheat during real interviews.
          </Section>

          <Section title="7. User Content">
            You retain ownership of your content but grant PrepVio a limited
            license to process it for platform functionality and improvement.
          </Section>

          <Section title="8. Payments">
            Paid features are non-refundable unless required by law. Pricing
            may change with notice.
          </Section>

          <Section title="9. Intellectual Property">
            All PrepVio software, branding, and AI systems are protected by
            intellectual property laws.
          </Section>

          <Section title="10. Platform Availability">
            PrepVio may modify or discontinue features without liability.
          </Section>

          <Section title="11. Limitation of Liability">
            Use of the Platform is at your own risk. PrepVio is not liable for
            indirect or consequential damages.
          </Section>

          <Section title="12. Termination">
            We may suspend or terminate access for violations or security
            reasons.
          </Section>

          <Section title="13. Governing Law">
            These Terms are governed by the laws of <strong>India</strong>.
          </Section>

          <Section title="14. Contact">
            📧 prepvio.ai@gmail.com
          </Section>

          <p className="pt-4 font-medium text-gray-800">
            By using PrepVio, you acknowledge that you have read and agreed to
            these Terms & Conditions.
          </p>

        </div>
      </div>
    </div>
  );
}

/* Reusable section */
function Section({ title, children }) {
  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p>{children}</p>
    </div>
  );
}

export default TermsModal;