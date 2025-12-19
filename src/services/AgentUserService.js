import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
} from 'firebase/auth';

/**
 * Create a new agent user with standardized schema (PascalCase)
 */
export const createAgentUser = async (data) => {
  const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
  
  const agentData = {
    Email: data.email,
    FirstName: data.firstName,
    LastName: data.lastName,
    Phone: data.phone,
    State: data.state,
    MLS: data.mls || '',
    MlsNumber: data.mlsNumber || '',
    ZipCodes: data.zipCode ? [data.zipCode] : [],
    Role: 'agent',
    Plan: data.plan || 'free',
    PlanStartDate: new Date(),
    CreatedAt: new Date(),
    SubscriptionStatus: 'free',
  };

  await setDoc(doc(db, 'AgentUsers', userCredential.user.uid), agentData);

  return {
    uid: userCredential.user.uid,
    ...agentData,
  };
};

/**
 * Get agent user data from Firestore
 * Handles both new (PascalCase) and legacy schemas for backward compatibility
 */
export const getAgentUser = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'AgentUsers', uid));
    
    if (!userDoc.exists()) return null;
    
    const data = userDoc.data();
    
    // Handle both new (PascalCase) and legacy field names
    return {
      uid: uid,
      Email: data.Email || data.EmailAddress || '',
      FirstName: data.FirstName || '',
      LastName: data.LastName || '',
      Phone: data.Phone || data.PhoneNumber || '',
      State: data.State || '',
      MLS: data.MLS || data.MlsId || '',
      MlsNumber: data.MlsNumber || '',
      ZipCodes: data.ZipCodes || (data.ZipCode ? [data.ZipCode] : []),
      Role: data.Role || 'agent',
      Plan: data.Plan || data.PlanId || 'free',
      PlanStartDate: data.PlanStartDate?.toDate?.() || data.CreatedAt?.toDate?.(),
      CreatedAt: data.CreatedAt?.toDate?.() || new Date(),
      UpdatedAt: data.UpdatedAt?.toDate?.(),
      PayarcCustomerId: data.PayarcCustomerId,
      StripeCustomerId: data.StripeCustomerId,
      BillingFrequency: data.BillingFrequency,
      TotalMonthlyAmount: data.TotalMonthlyAmount,
      SubscriptionIds: data.SubscriptionIds || (data.SubscriptionId ? [data.SubscriptionId] : undefined),
      SubscriptionStatus: data.SubscriptionStatus || (data.Plan === 'free' ? 'free' : undefined),
      PromoCode: data.PromoCode,
      Company: data.Company || '',
      ProfileImage: data.ProfileImage || '',
      Bio: data.Bio || '',
      YearsExperience: data.YearsExperience || 0,
      Specialties: data.Specialties || [],
      Website: data.Website || '',
    };
  } catch (error) {
    console.error('Error fetching agent user:', error);
    return null;
  }
};

/**
 * Get current logged-in agent user
 */
export const getCurrentAgentUser = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  return getAgentUser(user.uid);
};

/**
 * Update agent user profile
 */
export const updateAgentUser = async (uid, updates) => {
  const userRef = doc(db, 'AgentUsers', uid);
  await updateDoc(userRef, {
    ...updates,
    UpdatedAt: new Date(),
  });
};

/**
 * Add payment method to agent user
 */
export const addPaymentMethod = async (uid, paymentData) => {
  const userRef = doc(db, 'AgentUsers', uid);
  await updateDoc(userRef, {
    PayarcCustomerId: paymentData.payarcCustomerId || '',
    StripeCustomerId: paymentData.stripeCustomerId || '',
    BillingFrequency: paymentData.billingFrequency,
    TotalMonthlyAmount: paymentData.totalMonthlyAmount,
    UpdatedAt: new Date(),
  });
};

/**
 * Add subscription to agent user
 */
export const addSubscription = async (uid, subscriptionData) => {
  const userRef = doc(db, 'AgentUsers', uid);
  const userData = await getAgentUser(uid);
  
  const subscriptionIds = userData?.SubscriptionIds || [];
  if (!subscriptionIds.includes(subscriptionData.subscriptionId)) {
    subscriptionIds.push(subscriptionData.subscriptionId);
  }
  
  await updateDoc(userRef, {
    SubscriptionIds: subscriptionIds,
    SubscriptionStatus: subscriptionData.status,
    Plan: subscriptionData.plan,
    PlanStartDate: new Date(),
    UpdatedAt: new Date(),
  });
};

/**
 * Update subscription status
 */
export const updateSubscriptionStatus = async (uid, status) => {
  const userRef = doc(db, 'AgentUsers', uid);
  await updateDoc(userRef, {
    SubscriptionStatus: status,
    UpdatedAt: new Date(),
  });
};

/**
 * Add ZIP code to agent's territory
 */
export const addZipCode = async (uid, zipCode) => {
  const userData = await getAgentUser(uid);
  if (!userData) throw new Error('User not found');
  
  const zipCodes = userData.ZipCodes || [];
  if (!zipCodes.includes(zipCode)) {
    zipCodes.push(zipCode);
  }
  
  const userRef = doc(db, 'AgentUsers', uid);
  await updateDoc(userRef, {
    ZipCodes: zipCodes,
    UpdatedAt: new Date(),
  });
};

/**
 * Remove ZIP code from agent's territory
 */
export const removeZipCode = async (uid, zipCode) => {
  const userData = await getAgentUser(uid);
  if (!userData) throw new Error('User not found');
  
  const zipCodes = (userData.ZipCodes || []).filter(z => z !== zipCode);
  
  const userRef = doc(db, 'AgentUsers', uid);
  await updateDoc(userRef, {
    ZipCodes: zipCodes,
    UpdatedAt: new Date(),
  });
};

