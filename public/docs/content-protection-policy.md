# Fairtune Content Protection Policy

**Document Version:** 1.0
**Effective Date:** January 2026
**Last Updated:** January 19, 2026

---

## Overview

Fairtune is committed to protecting intellectual property rights and ensuring our platform hosts only legitimate, human-created music. This document outlines our content protection measures, DMCA compliance procedures, and AI content policy.

---

## 1. Legal Framework

### 1.1 DMCA Safe Harbor Compliance

Fairtune operates under the Digital Millennium Copyright Act (DMCA) Safe Harbor provisions (17 U.S.C. § 512). This provides legal protection for online service providers who:

- Do not have actual knowledge of infringing material
- Act expeditiously to remove infringing content upon notification
- Do not receive financial benefit directly attributable to infringing activity
- Have designated a DMCA agent and published contact information

### 1.2 Designated DMCA Agent

**Fairtune Copyright Agent**
Email: dmca@fairtune.fm
Web: https://fairtune.fm/dmca

---

## 2. Upload Process Safeguards

### 2.1 Artist Verification

Before uploading content, artists must:

1. Create an artist profile with verified email
2. Wait for admin approval (profile review)
3. Only approved artists can upload music

### 2.2 Required Declarations

During the upload process, artists must confirm:

| Checkbox | Purpose |
|----------|---------|
| **Rights Ownership** | "I confirm that I own or control all rights to distribute this music" |
| **AI Declaration** | "This music was created by me/my collaborators and is not AI-generated (AI tools for mixing/mastering are permitted)" |
| **Original Content** | "This is original content — not a cover, remix, or sample of copyrighted work (unless properly licensed and declared above)" |
| **False Information Warning** | "I understand that providing false information may result in account termination and legal action" |

### 2.3 Required Metadata

Each track upload requires:

- **ISRC Code** (International Standard Recording Code) - Validated for duplicates
- **Composer/Author Credits** - At least one composer credit required
- **Cover Song Declaration** - Must be marked if applicable

---

## 3. Content Moderation System

### 3.1 Track Moderation Queue

All uploaded tracks enter a moderation queue where admins can:

- Review track metadata and credits
- Verify ISRC codes
- Check for suspicious patterns
- Approve, reject, or request revisions

### 3.2 Content Reporting

Users can report tracks for:

| Reason | Description |
|--------|-------------|
| **Copyright Violation** | Content infringes on copyrighted material |
| **AI-Generated** | Content appears to be AI-generated |
| **Inappropriate** | Hate speech, violence, or illegal content |
| **Other** | Other issues not listed |

Reports are stored in the `content_reports` table and reviewed by admins.

### 3.3 Report Status Workflow

```
Pending → Investigating → Resolved/Dismissed
```

---

## 4. DMCA Takedown Process

### 4.1 Receiving a Takedown Notice

Valid DMCA notices must include:

1. Physical or electronic signature of copyright owner
2. Identification of the copyrighted work
3. Identification of infringing material with URL
4. Contact information (name, address, phone, email)
5. Good faith statement
6. Accuracy statement under penalty of perjury

### 4.2 Processing Timeline

| Action | Timeframe |
|--------|-----------|
| Acknowledge receipt | Within 24 hours |
| Review validity | Within 24-48 hours |
| Remove infringing content | Immediately upon validation |
| Notify uploader | Within 24 hours of removal |

### 4.3 Counter-Notification

Users who believe content was wrongly removed may file a counter-notification including:

1. Physical or electronic signature
2. Identification of removed material
3. Statement under penalty of perjury
4. Consent to jurisdiction
5. Agreement to accept service of process

### 4.4 Repeat Infringer Policy

Fairtune maintains a repeat infringer policy:

- **First offense:** Content removal + warning
- **Second offense:** Content removal + 30-day upload suspension
- **Third offense:** Account termination

---

## 5. AI-Generated Content Policy

### 5.1 Prohibition

Fairtune prohibits AI-generated music where the core composition, melody, or performance was created by AI systems (such as Suno, Udio, or similar).

### 5.2 Permitted AI Usage

Artists may use AI-assisted tools for:

- Mastering and mixing
- Noise reduction
- Production assistance
- Audio enhancement

The fundamental creative work (composition, lyrics, performance) must be human-created.

### 5.3 Enforcement

| Violation | Action |
|-----------|--------|
| First offense | Content removal + warning |
| Second offense | Account suspension |
| Third offense | Account termination |

---

## 6. Database Schema

### 6.1 Content Reports Table

```sql
content_reports (
  id UUID PRIMARY KEY,
  track_id UUID REFERENCES tracks(id),
  reporter_id UUID REFERENCES profiles(id),
  reporter_email TEXT,
  reason TEXT (copyright|ai_generated|inappropriate|other),
  details TEXT,
  evidence_url TEXT,
  status TEXT (pending|investigating|resolved|dismissed),
  resolution_notes TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
```

### 6.2 DMCA Requests Table

```sql
dmca_requests (
  id UUID PRIMARY KEY,
  claimant_name TEXT,
  claimant_email TEXT,
  claimant_address TEXT,
  claimant_phone TEXT,
  copyrighted_work_description TEXT,
  infringing_url TEXT,
  good_faith_statement BOOLEAN,
  accuracy_statement BOOLEAN,
  signature TEXT,
  status TEXT (pending|investigating|valid|invalid|resolved),
  resolution_notes TEXT,
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
```

### 6.3 Track Content Flags

```sql
tracks (
  ...
  ai_declaration BOOLEAN,      -- Artist declared NOT AI-generated
  content_flags JSONB,         -- Flagging system data
  flagged_at TIMESTAMPTZ,
  flagged_by UUID,
  flag_reason TEXT
)
```

### 6.4 Album Content Flags

```sql
albums (
  ...
  original_content_confirmed BOOLEAN,
  sample_declaration TEXT      -- no_samples|licensed_samples|public_domain
)
```

---

## 7. Admin Tools

### 7.1 Content Reports Tab

Located in `/admin` under "Content Reports":

- View all reports with filtering by status
- Stats dashboard (pending, investigating, resolved, dismissed)
- Actions: Mark Investigating, Mark Resolved, Dismiss
- Direct link to reported track

### 7.2 DMCA Management

DMCA requests stored in database for:

- Legal documentation
- Processing tracking
- Audit trail

---

## 8. Terms of Service Integration

The following sections in Terms of Service address content protection:

- **Section 5:** Artist Terms (rights ownership)
- **Section 6:** Prohibited Content
- **Section 6a:** AI-Generated Content Policy
- **Section 6b:** Copyright and DMCA
- **Section 7:** Intellectual Property

---

## 9. Risk Mitigation Summary

| Risk | Mitigation |
|------|------------|
| Copyright infringement | DMCA safe harbor, takedown process, reporting system |
| AI-generated content | Upload declaration, community reporting, moderation |
| Repeat infringers | Three-strike policy with account termination |
| Fraudulent uploads | Artist verification, ISRC validation, moderation queue |
| Legal liability | Terms of Service acceptance, documented consent |

---

## 10. Contact Information

**General Inquiries:** contact@fairtune.fm
**DMCA/Copyright:** dmca@fairtune.fm
**Website:** https://fairtune.fm

---

*This document is for internal reference and legal compliance purposes. For public-facing policies, see /terms and /dmca on the Fairtune website.*
