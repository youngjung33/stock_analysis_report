import { createContext, useContext } from 'react';
import { AppServices } from '../../application/services.types';

const ServicesContext = createContext<AppServices | null>(null);

export function ServicesProvider({
  services,
  children,
}: {
  services: AppServices;
  children: React.ReactNode;
}) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

export function useServices(): AppServices {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error('useServices must be used within ServicesProvider');
  return ctx;
}
