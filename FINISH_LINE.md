# 🏁 Homerunn App - Finish Line Checklist

**Last Updated:** December 22, 2025

This document outlines the remaining features and tasks needed to take the Homerunn app to production-ready status.

---

## 🎯 Critical Features to Complete

### 1. Agent Connection - Add Listing to My Agent Connection
**Status:** ⏳ TODO

**Description:**
When a user has a connected agent, they should be able to share/send property listings directly to their agent through the My Agent connection interface.

**Requirements:**
- [ ] Add "Share with My Agent" button to PropertyDetails/PropertyImages screens
- [ ] Check if user has an active agent connection (HasAgent = true, ConnectedAgentId exists)
- [ ] Create function to send listing to agent via Firebase/API
- [ ] Update agent's dashboard/portal to display received listings from clients
- [ ] Add notification to agent when client shares a listing
- [ ] Show confirmation to user when listing is successfully shared
- [ ] Handle case when user doesn't have an agent (show prompt to connect)

**Technical Implementation:**
```javascript
// Pseudo-code structure
const shareListingWithAgent = async (property, userId, agentId) => {
  // 1. Validate user has connected agent
  // 2. Format property data
  // 3. Send to Firestore: AgentUsers/{agentId}/ClientListings/{listingId}
  // 4. Create notification for agent
  // 5. Track in user's activity
  // 6. Show success/error feedback
}
```

**Files to Modify:**
- `src/screens/PropertyDetailsScreen.js` (or PropertyImages screen)
- `src/screens/MyAgentScreen.js` (potentially)
- `src/services/agentService.js` (create if doesn't exist)
- Firebase Functions: `functions/index.js` (for agent notifications)

**Database Schema:**
```
AgentUsers/{agentId}/ClientListings/{listingId}
  - propertyId: string
  - clientId: string
  - clientName: string
  - clientEmail: string
  - listingData: object
  - sharedAt: timestamp
  - viewed: boolean
  - notes: string (optional)
```

---

### 2. Inbound Connection Invites from Agent Web App
**Status:** ⏳ TODO

**Description:**
Currently, users can request to connect with agents. We need to implement the reverse flow: agents should be able to send connection invites to users from the agent web app, and users should receive and accept/decline these invites in the mobile app.

**Requirements:**
- [ ] Agent Web App: Create UI for agents to send connection invites (email/phone lookup)
- [ ] Mobile App: Listen for incoming agent connection invites
- [ ] Mobile App: Show notification when invite is received
- [ ] Mobile App: Create UI to view and respond to pending invites
- [ ] Mobile App: Allow user to accept or decline the invite
- [ ] Update AgentConnections collection with proper status flow
- [ ] Send push notification to user when agent sends invite
- [ ] Handle edge cases (user already has agent, multiple pending invites, etc.)

**Technical Implementation:**

**Agent Web App (send invite):**
```javascript
// Agent web portal sends invite
const sendConnectionInvite = async (agentId, userEmail, userPhone) => {
  // 1. Look up user by email/phone in Users collection
  // 2. Create AgentConnections doc with Status: "Pending"
  // 3. Set InitiatedBy: "agent"
  // 4. Send push notification to user
  // 5. Send email notification to user
}
```

**Mobile App (receive & respond):**
```javascript
// Listen for incoming invites
const listenForAgentInvites = (userId) => {
  // Real-time listener on AgentConnections where
  // UserId = userId AND Status = "Pending" AND InitiatedBy = "agent"
}

// Accept invite
const acceptAgentInvite = async (connectionId, agentId, userId) => {
  // 1. Update AgentConnections Status: "Accepted"
  // 2. Update User doc: HasAgent = true, ConnectedAgentId = agentId
  // 3. Send confirmation notification to agent
  // 4. Navigate to MyAgent screen
}

// Decline invite
const declineAgentInvite = async (connectionId) => {
  // 1. Update AgentConnections Status: "Declined"
  // 2. Send notification to agent (optional)
}
```

**Files to Create/Modify:**
- `src/services/agentConnectionService.js` (create)
- `src/screens/InvitesScreen.js` (new screen to view pending invites)
- `src/components/AgentInviteCard.js` (new component)
- `src/navigation/AppNavigator.js` (add new route)
- `functions/index.js` (Cloud Functions for notifications)

**Database Schema Updates:**
```
AgentConnections/{connectionId}
  - AgentId: string
  - UserId: string
  - UserName: string
  - UserContact: { Email, Phone, Name }
  - AgentName: string
  - AgentContact: { Email, Phone, Name }
  - Status: "Pending" | "Accepted" | "Declined" | "Expired"
  - InitiatedBy: "user" | "agent"  // NEW FIELD
  - CreatedAt: timestamp
  - RespondedAt: timestamp (optional)
  - ExpiresAt: timestamp (optional - e.g., 7 days)
  - InviteMessage: string (optional - personal message from agent)
```

**UI Locations:**
- Profile screen: Add "Pending Invites" badge/button (if any)
- Notifications: Show invite notifications
- Dedicated Invites Screen: List all pending invites with accept/decline buttons

---

### 3. Email & SMS Notifications for Non-Platform Agents
**Status:** ⏳ TODO

**Description:**
When users invite agents who don't have accounts on the Homerunn platform yet (during onboarding or from the "My Agent" screen), the system should automatically send email and SMS notifications to those agents to inform them about the invitation and encourage them to join the platform.

**Current Flow:**
- User enters agent's email/phone during onboarding or in "My Agent" screen
- System checks if agent exists in AgentUsers collection
- If agent doesn't exist, connection request is created but agent is NOT notified

**What Needs to Be Built:**
- [ ] Email template for agent invitations (professional, branded)
- [ ] SMS template for agent invitations (concise, with link)
- [ ] Firebase Cloud Function to detect new agent invites to non-platform agents
- [ ] Integration with email service (SendGrid, AWS SES, or similar)
- [ ] Integration with SMS service (Twilio or similar)
- [ ] Tracking system for sent notifications (prevent spam/duplicates)
- [ ] Landing page for agents to sign up when they click invite link
- [ ] Auto-match connection once agent signs up with same email/phone

**Trigger Points:**
1. **Onboarding Screen** - When user enters agent info during setup
2. **My Agent Screen** - When user manually adds/invites an agent
3. **Potential:** Reminder emails if agent hasn't responded after X days

**Technical Implementation:**

```javascript
// Cloud Function - Trigger on AgentConnections create
exports.notifyNonPlatformAgent = functions.firestore
  .document('AgentConnections/{connectionId}')
  .onCreate(async (snap, context) => {
    const connection = snap.data();
    const agentEmail = connection.AgentContact.Email;
    const agentPhone = connection.AgentContact.Phone;
    
    // Check if agent exists in platform
    const agentQuery = await db.collection('AgentUsers')
      .where('Email', '==', agentEmail)
      .get();
    
    if (agentQuery.empty) {
      // Agent not on platform - send notifications
      
      // 1. Send Email
      await sendInviteEmail({
        to: agentEmail,
        agentName: connection.AgentName,
        clientName: connection.UserName,
        clientPhone: connection.UserContact.Phone,
        signupLink: `https://agent.homerunn.com/signup?invite=${connectionId}`
      });
      
      // 2. Send SMS (if phone provided)
      if (agentPhone) {
        await sendInviteSMS({
          to: agentPhone,
          message: `${connection.UserName} wants you as their agent on Homerunn! Join: https://homerunn.com/agent/${connectionId}`
        });
      }
      
      // 3. Track notification sent
      await snap.ref.update({
        EmailSent: true,
        TextSent: !!agentPhone,
        NotificationSentAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });

// Auto-match when agent signs up
exports.matchAgentConnection = functions.firestore
  .document('AgentUsers/{agentId}')
  .onCreate(async (snap, context) => {
    const agent = snap.data();
    const agentId = context.params.agentId;
    
    // Find pending connections for this agent
    const connectionsQuery = await db.collection('AgentConnections')
      .where('AgentContact.Email', '==', agent.Email)
      .where('Status', '==', 'Pending')
      .get();
    
    // Auto-complete connections
    connectionsQuery.forEach(async (doc) => {
      await doc.ref.update({
        AgentId: agentId,
        Status: 'Accepted',
        RespondedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update user's connected agent
      const connection = doc.data();
      await db.collection('Users').doc(connection.UserId).update({
        HasAgent: true,
        ConnectedAgentId: agentId
      });
    });
  });
```

**Email Template (Sample):**
```
Subject: You've been invited to join Homerunn by [Client Name]

Hi [Agent Name],

Great news! [Client Name] has chosen you as their real estate agent and invited you to connect on Homerunn.

Homerunn is a modern platform that helps you:
• Share curated property listings (Hot Decks) with your clients
• Track client engagement with properties
• Receive instant notifications when clients love a property
• Streamline communication with home buyers

[Client Name] is already browsing properties and is ready to work with you!

👉 Join Homerunn now: [Signup Link]

Phone: [Client Phone]
Email: [Client Email]

Questions? Contact our support team at support@homerunn.com

Best regards,
The Homerunn Team
```

**SMS Template (Sample):**
```
[Client Name] invited you to Homerunn! Connect & share listings: https://homerunn.com/a/[invite-code]
```

**Files to Create/Modify:**
- `functions/notifications/agentInviteEmail.js` (new)
- `functions/notifications/agentInviteSMS.js` (new)
- `functions/triggers/onAgentConnectionCreate.js` (new)
- `functions/triggers/onAgentUserCreate.js` (new)
- `functions/templates/agentInviteEmailTemplate.html` (new)
- Update `functions/index.js` to export new functions
- Update `AgentConnections` schema to track notifications

**Database Schema Updates:**
```
AgentConnections/{connectionId}
  ... existing fields ...
  - EmailSent: boolean
  - TextSent: boolean
  - NotificationSentAt: timestamp
  - LastReminderSent: timestamp (optional)
  - ReminderCount: number (optional)
```

**Third-Party Services Required:**
- **Email:** SendGrid, AWS SES, or Mailgun
- **SMS:** Twilio
- **Cost Estimate:** 
  - Email: ~$0.001 per email
  - SMS: ~$0.0075 per SMS

**Testing Checklist:**
- [ ] Email sends successfully to non-platform agent
- [ ] SMS sends successfully to non-platform agent
- [ ] Email/SMS not sent if agent already on platform
- [ ] Duplicate prevention works (same agent invited twice)
- [ ] Links in email/SMS work correctly
- [ ] Agent can sign up via invite link
- [ ] Connection auto-completes when agent signs up
- [ ] User is notified when agent joins
- [ ] Email templates render correctly on mobile/desktop
- [ ] Unsubscribe link works (if required by law)

---

## 📋 Additional Polish (Optional but Recommended)

### Nice-to-Have Features:
- [ ] Agent connection request expiration (auto-expire after 30 days)
- [ ] Agent connection history/log
- [ ] Ability to disconnect from agent
- [ ] In-app chat between user and agent (future feature)
- [ ] Agent can see client's saved properties (privacy settings?)

---

## 🧪 Testing Checklist

Before launch, ensure these scenarios are tested:

### Agent Connection - Share Listing:
- [ ] User with agent can share listing
- [ ] User without agent sees prompt to connect
- [ ] Agent receives notification
- [ ] Agent can view shared listing in web portal
- [ ] Multiple listings can be shared
- [ ] Duplicate listings are handled gracefully

### Agent Connection - Inbound Invites:
- [ ] Agent can send invite from web portal
- [ ] User receives push notification
- [ ] User can view invite details
- [ ] User can accept invite
- [ ] User can decline invite
- [ ] Accepting invite updates all relevant fields
- [ ] User with existing agent sees appropriate message
- [ ] Expired invites are handled properly

### Email & SMS Notifications:
- [ ] Email sends to non-platform agent when invited
- [ ] SMS sends to non-platform agent when invited
- [ ] Email/SMS NOT sent if agent already on platform
- [ ] No duplicate notifications for same agent
- [ ] Invite links work correctly
- [ ] Agent can sign up via link
- [ ] Connection auto-completes when agent joins
- [ ] Email renders properly on all devices
- [ ] User notified when invited agent joins platform

---

## 🚀 Launch Readiness

Once the above 2 critical features are complete:

✅ Core functionality (search, save, swipe) - **COMPLETE**
✅ Authentication & user profiles - **COMPLETE**
✅ Hot Decks from agents - **COMPLETE**
✅ Notifications system - **COMPLETE**
✅ Guest mode - **COMPLETE**
✅ Search screen location defaults - **COMPLETE**
⏳ Agent connection - Share listings - **TODO**
⏳ Agent connection - Inbound invites - **TODO**
⏳ Email & SMS for non-platform agents - **TODO**

**Status:** Ready for launch after completing 3 remaining features ✨

---

## 📞 Implementation Priority

### Phase 1 (Critical): Agent Connection Features
1. **Week 1:** Implement "Share Listing with Agent" feature
2. **Week 2:** Implement inbound connection invites
3. **Week 3:** Email & SMS notifications for non-platform agents
4. **Week 4:** Testing and bug fixes

### Phase 2 (Post-Launch):
- Enhanced agent-client communication
- Analytics and insights
- Premium features

---

## 🔧 Technical Considerations

### Security:
- Validate agent permissions before showing client data
- Ensure only connected agents can receive listings
- Protect user privacy (PII handling)

### Performance:
- Use Firestore real-time listeners efficiently (unsubscribe when not needed)
- Cache agent connection status to reduce reads
- Optimize notification delivery

### User Experience:
- Clear messaging about agent connections
- Easy-to-find invite management
- Smooth onboarding for new connections

---

## 📝 Notes

- Both features integrate with existing Firebase structure
- Agent web portal changes needed (coordinate with web team)
- Push notification service already in place - just need to add new notification types
- Consider A/B testing the invite flow for optimal UX

---

**Document Version:** 1.1
**Last Updated:** December 22, 2025
**Next Review:** After feature implementation

---

## 🎬 Quick Start Guide

To implement these features, start in this order:

1. Set up email/SMS services (Twilio, SendGrid) - **Infrastructure**
2. Build "Share Listing with Agent" feature - **Quick win**
3. Implement agent invite notifications - **Backend heavy**
4. Add inbound connection invites UI - **Frontend focus**
5. Test everything thoroughly - **QA phase**

**Estimated Total Time:** 4 weeks with 1 developer

