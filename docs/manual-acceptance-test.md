# Manual acceptance test

Run this checklist on desktop Chrome/Edge and a real or emulated mobile viewport before production.

## Admin

- Sign in, switch light/dark mode, and confirm the preference survives refresh.
- Create receptionist and technician accounts with temporary passwords.
- Assign a repair and confirm the technician notification.
- Review inventory, fulfil a part request, manage staff and review audit records.

## New staff

- Sign in with the temporary password and confirm no dashboard is accessible.
- Change the password, sign in again and confirm the correct role dashboard opens.
- Use forgot password, receive the six-digit email code and reset the password.

## Receptionist and customer

- Record consent, create customer, device and repair.
- Send a quotation; track with repair number and phone; approve and reject separate test repairs.
- After completion, create an invoice and record partial and final counter payments.
- Confirm collection fails before full payment and succeeds after full payment.
- Confirm the customer can see only their repair, status notes, repair images and invoice.
- Confirm the paid invoice PDF downloads only after payment is complete.

## Technician

- Confirm only assigned repairs are accessible.
- Record inspection, request a part, use inventory and update statuses.
- Upload genuine JPEG, PNG and WebP images; confirm a renamed executable or fake image is rejected.
- Confirm uploaded images display for staff and the matching customer.

## Responsive and failure checks

- Check navigation, forms, tables, dialogs and image previews at 360 px, 768 px and desktop width.
- Test incorrect login, expired reset code, incorrect tracking phone, duplicate quotation response, insufficient stock and database/API unavailability.
- Confirm no passwords, cookies, access tokens or reset codes appear in production logs.
