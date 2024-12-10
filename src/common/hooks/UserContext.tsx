import React, { createContext, useState, ReactNode } from 'react';

export const UserContext = createContext({
    address: '',
    encryptedPrivateKey: '',
    setAddress: (addr: string) => { },
    setEncryptedPrivateKey: (key: string) => { },
});

interface UserProviderProps {
    children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
    const [address, setAddress] = useState('');
    const [encryptedPrivateKey, setEncryptedPrivateKey] = useState('');

    return (
        <UserContext.Provider value={{ address, setAddress, encryptedPrivateKey, setEncryptedPrivateKey }}>
            {children}
        </UserContext.Provider>
    );
};