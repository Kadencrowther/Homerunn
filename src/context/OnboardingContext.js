import React, { createContext, useState, useContext } from 'react';

const OnboardingContext = createContext({});

export const OnboardingProvider = ({ children }) => {
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  const completeOnboarding = () => {
    console.log('🎉 OnboardingContext: Marking onboarding as complete');
    setOnboardingComplete(true);
  };

  const resetOnboarding = () => {
    console.log('🔄 OnboardingContext: Resetting onboarding status');
    setOnboardingComplete(false);
  };

  return (
    <OnboardingContext.Provider value={{
      onboardingComplete,
      completeOnboarding,
      resetOnboarding
    }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => useContext(OnboardingContext);

