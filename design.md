# MyCar Design System & UX Specification

## 1. Design Direction
- Product: ระบบบริหารการขอใช้รถยนต์ โรงพยาบาลเกษตรวิสัย
- Visual direction: Modern Healthcare / Trustworthy / Clean / Accessible
- Primary language: Thai; technical labels may remain English where appropriate.
- UI must work on mobile, tablet, and desktop.
- Avoid dense government-form aesthetics; prioritize clear hierarchy and task completion.

## 2. Design Principles
1. Clarity before decoration.
2. One primary action per view.
3. Healthcare-grade trust: restrained color, strong contrast, predictable interactions.
4. Progressive disclosure for administration features.
5. Never expose Provider ID, Health ID tokens, secrets, internal database IDs, or security metadata in UI.
6. Every async operation has loading, success, failure, and retry states where applicable.
7. Destructive actions require confirmation and explain consequences.

## 3. Login Experience
- Full-height responsive layout with hospital identity and product title.
- Primary CTA: เข้าสู่ระบบด้วย Provider ID.
- Supporting copy: สำหรับบุคลากรโรงพยาบาลเกษตรวิสัยเท่านั้น.
- Authentication loading state disables duplicate submissions.
- Dedicated unauthorized state when Provider profile has no organization with hcode 11061.
- Dedicated provider/authentication error state without leaking upstream error details.

## 4. Application Shell
- Desktop: persistent sidebar + top bar.
- Mobile: compact top bar and collapsible navigation.
- Navigation groups: Dashboard, จัดการพนักงานขับรถ, จัดการรถยนต์, จัดการผู้ใช้งาน (role-gated).
- User menu: profile summary, role, logout.
- Active navigation must be visually obvious and keyboard accessible.

## 5. Dashboard
- Show concise operational summary cards.
- Initial cards: รถยนต์ที่ใช้งาน, พนักงานขับรถที่ใช้งาน, ผู้ใช้งานระบบ (where permitted).
- Use empty states instead of zero-value ambiguity.
- Future request/approval widgets must fit without redesigning the shell.

## 6. Master Data UX
### Drivers
- Table/list with photo, full name, nickname, status, actions.
- Create/edit via focused form dialog or dedicated panel.
- Photo upload accepts validated image formats only; show preview and upload progress.
- Status uses accessible badge + text, not color alone.
- Soft-deleted records are not shown in normal active lists.

### Vehicles
- Table/list with registration, vehicle details, status, actions.
- Keep field model extensible because detailed vehicle requirements are intentionally open in Phase 1.

### Users
- Super Admin only for role assignment.
- Show identity and organization summary; do not expose sensitive identifiers.
- Role changes require explicit save confirmation and audit logging.

## 7. Accessibility
- WCAG-oriented contrast and focus visibility.
- All controls have accessible names.
- Keyboard navigation for menus, dialogs, forms, and tables.
- Do not use color as the only status indicator.
- Thai text must remain readable at common mobile widths.

## 8. Interaction States
- Loading: skeleton/spinner with preserved layout.
- Empty: explain what is empty and provide the primary next action when permitted.
- Error: concise Thai explanation + retry/back action.
- Unauthorized: explain lack of permission without sensitive provider details.
- Success: short confirmation/toast; avoid interrupting workflow.

## 9. Security UX Constraints
- No access tokens in localStorage/sessionStorage.
- No secrets in client bundles.
- No raw internal IDs in URLs when a public opaque identifier is available.
- File upload UI communicates allowed type/size and rejects invalid files before submission where possible.

## 10. Responsive Breakpoints
- Mobile: < 640px; single-column forms and compact navigation.
- Tablet: 640-1023px; adaptive two-column content where useful.
- Desktop: >= 1024px; sidebar + multi-column dashboard/table layouts.

## 11. Future-proofing
- Request/approval/schedule/trip screens must reuse the same shell, forms, tables, badges, dialogs, and audit patterns.
- Domain components should not encode assumptions that prevent future vehicle-request workflow.

## 12. Source of Truth
- Functional requirements: `docs/REQUIREMENTS.md`
- Provider ID integration: attached Health ID/Provider ID integration guide
- This file: visual/UX/interaction direction for implementation.
