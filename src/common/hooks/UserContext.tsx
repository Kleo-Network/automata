import React, { createContext, useState, ReactNode } from 'react';

// If not, you can leave `user` as `any` or define a more appropriate type later.
export interface UserData {
    _id: string;
    name: string;
    address: string;
    encryptedPrivateKey: string;
    slug: string;
    iv: string;
}

interface UserContextType {
    user: UserData | null;
    setUser: (user: UserData | null) => void;
}

export const UserContext = createContext<UserContextType>({
    user: null,
    setUser: () => { },
});

interface UserProviderProps {
    children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {

    const [user, setUser] = useState<UserData | null>(null);

    return (
        <UserContext.Provider
            value={{
                user,
                setUser,
            }}
        >
            {children}
        </UserContext.Provider>
    );
};
