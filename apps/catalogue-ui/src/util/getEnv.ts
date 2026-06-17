export const getPublicEnv = (): PublicEnv => {
  if (typeof window !== 'undefined') {
    // Client-side
    return window.envVars;
  } else {
    const publicVars = Object.fromEntries(
      Object.entries(process.env).filter(([key]) => key.startsWith('PUBLIC_'))
    ) as PublicEnv;

    // locally we don't use process.env but we get vars from .env file

    return publicVars;
  }
};

export const isConsumerEnvironment = (): boolean => {
  const environmentVariables = getPublicEnv();

  return (
    environmentVariables.PUBLIC_AGENT_TYPE && environmentVariables.PUBLIC_AGENT_TYPE === 'consumer'
  );
};
