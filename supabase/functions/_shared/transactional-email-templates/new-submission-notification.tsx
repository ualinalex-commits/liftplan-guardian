import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'ADA Lifting UK'

interface NewSubmissionProps {
  serviceType?: string
  reference?: string
  equipment?: string
  clientName?: string
  clientEmail?: string
  clientCompany?: string
  paymentType?: string
  details?: string
  submissionId?: string
}

const NewSubmissionNotificationEmail = ({
  serviceType,
  reference,
  equipment,
  clientName,
  clientEmail,
  clientCompany,
  paymentType,
  details,
  submissionId,
}: NewSubmissionProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      New {serviceType || 'lift plan'} request from {clientName || 'a client'}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New {serviceType || 'lift plan'} request</Heading>
        <Text style={text}>
          A potential client has just submitted a request through {SITE_NAME}.
        </Text>

        <Section style={card}>
          <Row label="Service" value={serviceType} />
          <Row label="Reference" value={reference} />
          <Row label="Equipment" value={equipment} />
          <Row label="Client" value={clientName} />
          <Row label="Email" value={clientEmail} />
          <Row label="Company" value={clientCompany} />
          <Row label="Payment" value={paymentType} />
          <Row label="Submission ID" value={submissionId} />
        </Section>

        {details ? (
          <>
            <Hr style={hr} />
            <Heading as="h2" style={h2}>
              Details
            </Heading>
            <Text style={text}>{details}</Text>
          </>
        ) : null}

        <Hr style={hr} />
        <Text style={footer}>
          Sign in to the {SITE_NAME} dashboard to assign and follow up.
        </Text>
      </Container>
    </Body>
  </Html>
)

const Row = ({ label, value }: { label: string; value?: string }) =>
  value ? (
    <Text style={rowText}>
      <span style={rowLabel}>{label}:</span> {value}
    </Text>
  ) : null

export const template = {
  component: NewSubmissionNotificationEmail,
  subject: (d: Record<string, any>) =>
    `New ${d.serviceType || 'lift plan'} request${d.reference ? ` — ${d.reference}` : ''}`,
  to: 'contact@ada-liftinguk.com',
  displayName: 'New submission notification',
  previewData: {
    serviceType: 'Lift plan review',
    reference: 'Site B — Mobile crane',
    equipment: 'Mobile Crane',
    clientName: 'Jane Doe',
    clientEmail: 'jane@example.com',
    clientCompany: 'Acme Lifting',
    paymentType: 'Direct payment',
    details: 'Lifting a 12t HVAC unit onto a 4-storey roof.',
    submissionId: 'abc-123',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px' }
const h2 = { fontSize: '16px', fontWeight: 'bold', color: '#0f172a', margin: '20px 0 8px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 12px' }
const card = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
}
const rowText = { fontSize: '14px', color: '#334155', margin: '4px 0' }
const rowLabel = { color: '#64748b', fontWeight: 600 as const, marginRight: '6px' }
const hr = { borderColor: '#e2e8f0', margin: '20px 0' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '12px 0 0' }
