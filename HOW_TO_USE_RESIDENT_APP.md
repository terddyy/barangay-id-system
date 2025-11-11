# How to Use the Barangay ID System as a Resident

## 📱 Step-by-Step Guide for Residents

---

## Before You Start

You need to have your **Barangay ID Number** (example: `PUROK1-2025-001`) that was given to you by the barangay office when you registered.

Your ID status must be **"Released"** (green mark). If it's still Pending (red mark), visit the barangay office first.

---

## STEP 1: Create Your Account

### What you'll need:
- Your Barangay ID Number
- A password (at least 8 characters)
- Your email address (optional but recommended)
- Your mobile number (optional)

### How to register:

**If using a web browser or mobile app:**
1. Go to the registration page
2. Enter your ID Number: `PUROK1-2025-001`
3. Create a password: `YourSecurePassword123`
4. Enter your email: `juan@example.com`
5. Enter your mobile: `09171234567`
6. Click "Register"

**If someone is helping you test with curl/API:**
```bash
curl -X POST http://localhost:3000/api/resident-auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "idNumber": "PUROK1-2025-001",
    "password": "YourSecurePassword123",
    "email": "juan@example.com",
    "mobileNumber": "09171234567"
  }'
```

✅ **Success!** You'll see: "Account created successfully"

❌ **If it fails:**
- "ID number not found" → Visit barangay office to register first
- "Account already exists" → You already have an account, just login
- "Password must be at least 8 characters" → Use a longer password

---

## STEP 2: Login

### How to login:

**Using the app:**
1. Go to the login page
2. Enter your ID Number OR Email
3. Enter your password
4. Click "Login"

**Testing with API:**
```bash
curl -X POST http://localhost:3000/api/resident-auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "idNumber": "PUROK1-2025-001",
    "password": "YourSecurePassword123"
  }'
```

✅ **Success!** You'll receive a token (like a digital key) that lets you access services.

❌ **If it fails:**
- "Invalid credentials" → Wrong password or ID number
- "ID not yet released" → Visit barangay office to release your ID

---

## STEP 3: View Your Profile

After logging in, you can view your complete information:

**What you'll see:**
- Your full name
- Birth date
- Address
- Contact number
- Purok/Position
- Emergency contact
- Photo
- ID status (Released/Pending)
- When you created your account
- Last time you logged in

**How to view:**
- In the app: Click "My Profile" or "Profile" button
- The app automatically loads your information

---

## STEP 4: Request Documents

You can request these documents online:
- ✅ Barangay Clearance
- ✅ Certificate of Indigency  
- ✅ Certificate of Residency
- ✅ Other barangay certificates

### How to request:

**Using the app:**
1. Click "Request Document" or "E-Services"
2. Select document type: "Barangay Clearance"
3. Enter purpose: "Employment requirement"
4. Click "Submit Request"

**What happens next:**
1. **Pending** (🔴) - Your request is submitted, waiting for staff review
2. **Approved** (🟡) - Staff approved it, document is being prepared
3. **Released** (🟢) - Document is ready! Go to barangay office to claim

### View your requests:
- Click "My Requests" or "Document Requests"
- You'll see all your requests and their status
- You can filter by: Pending, Approved, Released

---

## STEP 5: File a Complaint or Feedback

Have a problem or suggestion for the barangay?

### How to submit a complaint:

**Using the app:**
1. Click "File Complaint" or "Feedback"
2. Describe your issue: "Street lighting is not working in our area for the past week"
3. Click "Submit"

**What happens next:**
- **Open** (🔴) - Complaint received, not yet reviewed
- **In Progress** (🟡) - Staff is working on it
- **Resolved** (🟢) - Issue has been fixed
- **Closed** (⚫) - Complaint is closed

### View your complaints:
- Click "My Complaints"
- See all your submitted complaints and their status

---

## STEP 6: View Barangay Events

See upcoming barangay events and activities:

### What events you can see:
- 🎉 Community events (fiesta, celebrations)
- 🧹 Clean-up drives
- 🏥 Medical missions
- 📦 Relief distribution
- 🏛️ Barangay assemblies
- 📚 Programs and activities

### How to view events:
1. Click "Events" or "Barangay Events"
2. You'll see:
   - Event title
   - Description
   - Date and time
   - Event type

### Register for an event:
1. Click on an event
2. Click "Register" or "Join Event"
3. ✅ Success! You're registered for the event

**Note:** You can't register for the same event twice.

---

## STEP 7: Update Your Profile

Keep your contact information up to date:

### What you can update:
- ✅ Email address
- ✅ Mobile number
- ✅ Contact number

### What you CANNOT change yourself:
- ❌ Name (visit barangay office)
- ❌ Address (visit barangay office)
- ❌ Birth date (visit barangay office)
- ❌ ID number (visit barangay office)

### How to update:
1. Click "Edit Profile"
2. Change your email, mobile, or contact
3. Click "Save Changes"

---

## STEP 8: Change Your Password

For security, change your password regularly:

### How to change password:
1. Click "Change Password" or "Security Settings"
2. Enter your **current password**
3. Enter your **new password** (at least 8 characters)
4. Confirm new password
5. Click "Update Password"

✅ **Success!** Use your new password next time you login.

---

## 📊 Dashboard Overview

When you login, you'll typically see:

### Your Quick Stats:
- 📄 Pending document requests
- 📝 Open complaints
- 📅 Upcoming events you're registered for
- ⚠️ Notifications (if any)

### Quick Actions:
- Request a document
- File a complaint
- View events
- Update profile

---

## 🔐 Security Tips

### Keep Your Account Safe:

1. **Use a strong password**
   - At least 8 characters
   - Mix letters, numbers, and symbols
   - Example: `MyPass2025!`

2. **Don't share your password**
   - Not even with family members
   - Each person should have their own account

3. **Remember your ID number**
   - You'll need it to login
   - Keep it in a safe place

4. **Logout when done**
   - Especially on shared computers
   - Click "Logout" button

5. **Your token expires after 7 days**
   - You'll need to login again
   - This is for your security

---

## ❓ Frequently Asked Questions

### Q: I forgot my password, what do I do?
**A:** Currently, you need to contact the barangay office to reset your password. (Password reset feature coming soon)

### Q: Can I use email instead of ID number to login?
**A:** Yes! Once you've added your email during registration, you can use either your ID number OR email to login.

### Q: Why can't I login? It says "ID not yet released"
**A:** Your barangay ID is still pending. Visit the barangay office to have your ID released first. Only residents with released IDs can use online services.

### Q: Can I request multiple documents at once?
**A:** Yes! You can submit multiple document requests. Each request is tracked separately.

### Q: How long does it take to process my document request?
**A:** Processing time depends on the barangay staff workload. Check your request status regularly. You'll see when it's approved and ready for pickup.

### Q: Can I cancel a document request?
**A:** Currently, you cannot cancel requests yourself. Contact the barangay office if you need to cancel.

### Q: Why can't I see other residents' information?
**A:** For privacy and security, you can only see your own information. Staff can see all resident data.

### Q: What if I registered for an event but can't attend?
**A:** Contact the barangay office to inform them. (Event cancellation feature may be added later)

### Q: Can I update my address in the profile?
**A:** No, important information like name, address, and birth date must be updated at the barangay office. You can only update contact information (email, phone numbers) online.

---

## 📱 What You Can Do as a Resident

### ✅ YOU CAN:
- Create your own account
- Login with ID number or email
- View your complete profile
- Update your contact information (email, mobile)
- Change your password
- Submit document requests (clearance, indigency, etc.)
- View status of your requests
- File complaints and feedback
- View status of your complaints
- View all barangay events
- Register for events
- See who's attending events

### ❌ YOU CANNOT:
- View other residents' information
- Change your request status (staff only)
- Change your complaint status (staff only)
- Create, edit, or delete events (staff only)
- Access staff/admin features
- Change your name, address, or birth date (visit office)
- See audit logs (staff only)
- Generate reports (staff only)

---

## 🆘 Need Help?

### If you have technical problems:
1. Check your internet connection
2. Make sure you're using the correct ID number
3. Verify your password is correct
4. Try logging out and back in

### If you need assistance:
- Visit the barangay office during office hours
- Bring your ID number
- Staff can help with:
  - Account issues
  - Password resets
  - Status updates
  - Document pickup
  - General questions

---

## 📞 Contact Information

**Barangay Office:**
- Office Hours: [Your office hours]
- Phone: [Your contact number]
- Email: [Your email]
- Address: [Your address]

---

## 🎯 Quick Reference

| What you want to do | Where to go |
|---------------------|-------------|
| Create account | Registration page |
| Login | Login page |
| View profile | My Profile |
| Request document | Request Document / E-Services |
| Check request status | My Requests |
| File complaint | File Complaint / Feedback |
| Check complaint status | My Complaints |
| View events | Events / Barangay Events |
| Register for event | Click event → Register |
| Update email/mobile | Edit Profile |
| Change password | Change Password / Security |

---

## ✨ Benefits of Using the Online System

### For You:
- 🏠 **Request documents from home** - No need to visit office just to request
- ⏰ **Track your requests** - See status updates anytime
- 📱 **File complaints easily** - Report issues online
- 📅 **Stay informed** - See upcoming events and programs
- 🔔 **Get updates** - Know when your documents are ready

### For the Community:
- 🌱 **Less paper** - Eco-friendly digital system
- ⚡ **Faster processing** - Staff can process requests efficiently
- 📊 **Better tracking** - Everything is recorded
- 🔒 **More secure** - Your data is protected
- 📈 **Improved service** - Better barangay services for everyone

---

**Welcome to the digital barangay! 🎉**

We hope this system makes it easier for you to access barangay services and stay connected with your community.

---

*Last updated: November 12, 2025*
