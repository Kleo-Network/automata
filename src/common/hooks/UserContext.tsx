import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Define the UserData interface
export interface UserData {
    _id: string;
    name: string;
    address: string;
    encryptedPrivateKey: string;
    slug: string;
    iv: string;
}

// Define the context type
interface UserContextType {
    user: UserData | null;
    setUser: (user: UserData | null) => void;
}

// Create the UserContext with default values
export const UserContext = createContext<UserContextType>({
    user: null,
    setUser: () => { },
});

// Define the props for UserProvider
interface UserProviderProps {
    children: ReactNode;
}

// Function to get data from Chrome's local storage
export function getFromStorage(key: string): Promise<{ [key: string]: any }> {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(key, function (result) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result);
            }
        });
    });
}

// UserProvider component
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const navigate = useNavigate();

    // useEffect to load user from Chrome storage when the component mounts
    useEffect(() => {
        // Define an async function to fetch user data
        const fetchUser = async () => {
            try {
                const result = await getFromStorage('user');
                if (result.user) {
                    setUser(result.user as UserData);
                    navigate('/app/tasks');
                } else {
                    setUser(null);
                    navigate('/login');
                }
            } catch (error) {
                console.error('Error fetching user from storage:', error);
                setUser(null);
            }
        };

        // Call the fetchUser function
        fetchUser();
    }, []); // Empty dependency array ensures this runs once on mount

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
