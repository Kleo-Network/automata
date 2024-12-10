import React, { createContext, useState, ReactNode } from 'react';

// If not, you can leave `user` as `any` or define a more appropriate type later.
interface UserData {
    id: string;
    name: string;
    email: string;
}

interface UserContextType {
    address: string;
    encryptedPrivateKey: string;
    slug: string;
    user: UserData | null;
    setAddress: (addr: string) => void;
    setEncryptedPrivateKey: (key: string) => void;
    setSlug: (slug: string) => void;
    setUser: (user: UserData | null) => void;
}

export const UserContext = createContext<UserContextType>({
    address: '',
    encryptedPrivateKey: '',
    slug: '',
    user: null,
    setAddress: () => { },
    setEncryptedPrivateKey: () => { },
    setSlug: () => { },
    setUser: () => { },
});

interface UserProviderProps {
    children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
    const [address, setAddress] = useState('');
    const [encryptedPrivateKey, setEncryptedPrivateKey] = useState('');
    const [slug, setSlug] = useState('');
    const [user, setUser] = useState<UserData | null>(null);

    return (
        <UserContext.Provider
            value={{
                address,
                encryptedPrivateKey,
                slug,
                user,
                setAddress,
                setEncryptedPrivateKey,
                setSlug,
                setUser,
            }}
        >
            {children}
        </UserContext.Provider>
    );
};
