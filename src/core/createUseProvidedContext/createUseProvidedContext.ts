import { Context, useContext } from 'react';

/**
 *
 * @param ProvidedContext context which has `null` as default value
 * @param contextName name of `ProvidedContext` to use in error message
 * @returns hook which asserts that value is provided, and it's not `null`
 *
 * @example
 *
 * const AddressServiceContext = createContext<IAddressService | null>(null);
 * export const useAddressContext = createUseProvidedContext(AddressServiceContext, 'AddressServiceContext');
 *
 * const SomeComponent: FC = () => {
 *   const addressService: IAddressService = useAddressContext();
 *   addressService.someField
 * }
 */
export const createUseProvidedContext =
  <T>(ProvidedContext: Context<T | null>, contextName: string): (() => T) =>
  (): T => {
    const context = useContext(ProvidedContext);

    if (context === null) {
      const error = new Error(
        `"${contextName}" context is not provided or hook used outside of "${contextName}" provider`
      );
      throw error;
    }

    return context;
  };
