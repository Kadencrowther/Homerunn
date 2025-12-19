import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  addDoc, 
  updateDoc, 
  query, 
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

const CONNECTIONS_COLLECTION = 'AgentConnections';
const AGENT_USERS_COLLECTION = 'AgentUsers';
const USERS_COLLECTION = 'Users';

export const getAgentById = async (agentId) => {
  try {
    const agentDoc = await getDoc(doc(db, AGENT_USERS_COLLECTION, agentId));
    
    if (!agentDoc.exists()) return null;
    
    const data = agentDoc.data();
    return {
      id: agentDoc.id,
      name: `${data.FirstName || ''} ${data.LastName || ''}`.trim(),
      email: data.Email || data.EmailAddress || '',
      phone: data.Phone || data.PhoneNumber || '',
      state: data.State || '',
    };
  } catch (error) {
    console.error('Error getting agent:', error);
    return null;
  }
};

export const getUserConnection = async (userId) => {
  try {
    const connectionsRef = collection(db, CONNECTIONS_COLLECTION);
    const q = query(
      connectionsRef,
      where('UserId', '==', userId),
      where('Status', 'in', ['Requested', 'Accepted']),
      orderBy('CreatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return null;
    
    const docData = querySnapshot.docs[0];
    const data = docData.data();
    
    return {
      id: docData.id,
      AgentContact: data.AgentContact,
      AgentId: data.AgentId,
      AgentName: data.AgentName,
      UserContact: data.UserContact,
      UserId: data.UserId,
      UserName: data.UserName,
      CreatedAt: data.CreatedAt?.toDate() || new Date(),
      RequestType: data.RequestType,
      Status: data.Status,
      InitiatedBy: data.InitiatedBy,
      Notes: data.Notes,
      EmailSent: data.EmailSent,
      TextSent: data.TextSent,
      LastNotificationSent: data.LastNotificationSent?.toDate() || null,
      RespondedAt: data.RespondedAt?.toDate() || null,
      ExpiresAt: data.ExpiresAt?.toDate() || null,
      ConnectionActivatedAt: data.ConnectionActivatedAt?.toDate() || null,
    };
  } catch (error) {
    console.error('Error getting user connection:', error);
    return null;
  }
};

export const createConnectionRequest = async (data) => {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    const connectionData = {
      AgentContact: data.agentContact,
      AgentId: data.agentId,
      AgentName: data.agentContact.Name,
      UserContact: data.userContact,
      UserId: data.userId,
      UserName: data.userContact.Name,
      CreatedAt: serverTimestamp(),
      RequestType: 'AgentConnection',
      Status: 'Requested',
      InitiatedBy: data.initiatedBy,
      Notes: data.notes || '',
      EmailSent: false,
      TextSent: false,
      LastNotificationSent: null,
      RespondedAt: null,
      ExpiresAt: expiresAt,
      ConnectionActivatedAt: null,
    };
    
    const docRef = await addDoc(collection(db, CONNECTIONS_COLLECTION), connectionData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating connection request:', error);
    throw new Error('Failed to create connection request');
  }
};

export const acceptConnection = async (connectionId) => {
  try {
    const connectionRef = doc(db, CONNECTIONS_COLLECTION, connectionId);
    const connectionDoc = await getDoc(connectionRef);
    
    if (!connectionDoc.exists()) {
      throw new Error('Connection not found');
    }
    
    const connectionData = connectionDoc.data();
    
    await updateDoc(connectionRef, {
      Status: 'Accepted',
      RespondedAt: serverTimestamp(),
      ConnectionActivatedAt: serverTimestamp(),
    });
    
    await updateDoc(doc(db, USERS_COLLECTION, connectionData.UserId), {
      ConnectedAgentId: connectionData.AgentId,
      AgentConnectionStatus: 'connected',
      AgentConnectionId: connectionId,
      HasAgent: true,
    });
  } catch (error) {
    console.error('Error accepting connection:', error);
    throw new Error('Failed to accept connection');
  }
};

export const rejectConnection = async (connectionId) => {
  try {
    const connectionRef = doc(db, CONNECTIONS_COLLECTION, connectionId);
    const connectionDoc = await getDoc(connectionRef);
    
    if (!connectionDoc.exists()) {
      throw new Error('Connection not found');
    }
    
    const connectionData = connectionDoc.data();
    
    await updateDoc(connectionRef, {
      Status: 'Rejected',
      RespondedAt: serverTimestamp(),
    });
    
    await updateDoc(doc(db, USERS_COLLECTION, connectionData.UserId), {
      AgentConnectionStatus: 'none',
      AgentConnectionId: null,
      HasAgent: false,
    });
  } catch (error) {
    console.error('Error rejecting connection:', error);
    throw new Error('Failed to reject connection');
  }
};

export const disconnectConnection = async (connectionId) => {
  try {
    const connectionRef = doc(db, CONNECTIONS_COLLECTION, connectionId);
    const connectionDoc = await getDoc(connectionRef);
    
    if (!connectionDoc.exists()) {
      throw new Error('Connection not found');
    }
    
    const connectionData = connectionDoc.data();
    
    await updateDoc(connectionRef, {
      Status: 'Cancelled',
      RespondedAt: serverTimestamp(),
    });
    
    await updateDoc(doc(db, USERS_COLLECTION, connectionData.UserId), {
      ConnectedAgentId: null,
      AgentConnectionStatus: 'none',
      AgentConnectionId: null,
      HasAgent: false,
    });
  } catch (error) {
    console.error('Error disconnecting connection:', error);
    throw new Error('Failed to disconnect connection');
  }
};

export const hasActiveConnection = async (userId) => {
  try {
    const connection = await getUserConnection(userId);
    return connection !== null && connection.Status === 'Accepted';
  } catch (error) {
    console.error('Error checking active connection:', error);
    return false;
  }
};

export const hasExistingRequest = async (userId, agentId) => {
  try {
    const connectionsRef = collection(db, CONNECTIONS_COLLECTION);
    const q = query(
      connectionsRef,
      where('UserId', '==', userId),
      where('AgentId', '==', agentId),
      where('Status', 'in', ['Requested', 'Accepted'])
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking existing request:', error);
    return false;
  }
};
