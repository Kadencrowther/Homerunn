import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  getDocs,
  updateDoc, 
  query, 
  where,
  serverTimestamp
} from 'firebase/firestore';

const PENDING_AGENT_INVITES = 'PendingAgentInvites';
const AGENT_USERS_COLLECTION = 'AgentUsers';

/**
 * Normalize phone number to digits only
 */
export const normalizePhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

/**
 * Find existing agent by email OR phone
 */
export const findAgentByEmailOrPhone = async (email, phone) => {
  const normalizedPhone = normalizePhone(phone);
  
  // Try email first
  if (email) {
    const emailQuery = query(
      collection(db, AGENT_USERS_COLLECTION),
      where('Email', '==', email)
    );
    const emailResult = await getDocs(emailQuery);
    if (!emailResult.empty) {
      return { id: emailResult.docs[0].id, matchedBy: 'email' };
    }
  }
  
  // Try phone
  if (normalizedPhone) {
    const phoneQuery = query(
      collection(db, AGENT_USERS_COLLECTION),
      where('Phone', '==', normalizedPhone)
    );
    const phoneResult = await getDocs(phoneQuery);
    if (!phoneResult.empty) {
      return { id: phoneResult.docs[0].id, matchedBy: 'phone' };
    }
  }
  
  return null;
};

/**
 * User invites an Agent who doesn't exist in Homerunn yet
 */
export const inviteAgentToHomerunn = async (
  userId,
  userName,
  userEmail,
  agentData
) => {
  try {
    // Check if agent already exists
    const existingAgent = await findAgentByEmailOrPhone(agentData.email, agentData.phone);
    
    if (existingAgent) {
      // Agent exists! Create connection immediately
      const connectionData = {
        UserId: userId,
        AgentId: existingAgent.id,
        AgentName: agentData.name,
        UserName: userName,
        Status: 'Requested',
        CreatedAt: serverTimestamp(),
        UserContact: {
          Name: userName,
          Email: userEmail,
          Phone: ''
        },
        AgentContact: {
          Name: agentData.name,
          Email: agentData.email,
          Phone: normalizePhone(agentData.phone)
        },
        RequestType: 'AgentConnection',
        Notes: 'User requested to connect with existing agent',
        TextSent: false,
        EmailSent: false,
        LastNotificationSent: null
      };
      
      const connectionDoc = await addDoc(collection(db, 'AgentConnections'), connectionData);
      
      return { type: 'existing', connectionId: connectionDoc.id };
    }
    
    // Agent doesn't exist - create pending invite
    const inviteToken = Math.random().toString(36).substring(2, 15);
    const inviteData = {
      InvitedAgentEmail: agentData.email,
      InvitedAgentPhone: normalizePhone(agentData.phone),
      InvitedAgentName: agentData.name,
      InvitingUserId: userId,
      InvitingUserName: userName,
      InvitingUserEmail: userEmail,
      Status: 'PendingAgentSignup',
      CreatedAt: serverTimestamp(),
      InviteToken: inviteToken,
      InviteLink: `https://homerunn.com/register?invite=${inviteToken}&type=agent&user=${userId}`,
      EmailSent: false,
      MatchedByEmail: false,
      MatchedByPhone: false,
      MatchedAt: null,
      ConvertedToConnectionId: null,
    };
    
    const docRef = await addDoc(collection(db, PENDING_AGENT_INVITES), inviteData);
    
    return { type: 'pending', inviteId: docRef.id };
  } catch (error) {
    console.error('Error inviting agent:', error);
    throw new Error('Failed to invite agent');
  }
};

/**
 * Get pending invites for a user
 */
export const getUserPendingInvites = async (userId) => {
  try {
    const q = query(
      collection(db, PENDING_AGENT_INVITES),
      where('InvitingUserId', '==', userId),
      where('Status', '==', 'PendingAgentSignup')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      CreatedAt: doc.data().CreatedAt?.toDate(),
    }));
  } catch (error) {
    console.error('Error getting pending invites:', error);
    return [];
  }
};

