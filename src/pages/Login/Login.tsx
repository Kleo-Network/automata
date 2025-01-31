// src/pages/Login/Login.tsx

import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";

import { FormInputField } from "./FormInput";
import { FormButton } from "./FormButton";
import { UserContext } from "../../common/hooks/UserContext";

const IMAGES = {
  KleoLogoInCirclePath: "../../assets/images/login/kleoLogoInCircle.svg",
  PersonIconPath: "../../assets/images/login/personIcon.svg",
  KeyIconPath: "../../assets/images/login/keyIcon.svg",
};

const LOGIN_PAGE_DATA = {
  title1: "Create an Account",
  desc1: "Enter your details to proceed further",
  title2: "Import Your Account",
  desc2: "Already have an account? Import by using your private key",
  createNewAccount: [
    {
      label: "Your Name",
      placeholder: "Your Name",
      iconPath: IMAGES.PersonIconPath,
    },
    {
      text: "Create New Account",
      bgColor: "bg-primary-600",
      textColor: "text-white",
    },
  ],
  importYourAccount: [
    {
      label: "Enter Private Key",
      placeholder: "Enter Private Key",
      iconPath: IMAGES.KeyIconPath,
    },
    {
      text: "Import Account",
      bgColor: "bg-black",
      textColor: "text-white",
    },
  ],
};

export const Login = () => {
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [isValidKey, setIsValidKey] = useState(false); // Track validity of private key
  const [error, setError] = useState<string | null>(null);

  // Function to validate the private key
  const validatePrivateKey = (key: string): boolean => {
    try {
      new ethers.Wallet(key.trim());
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleCreateNewAccount = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'createUser',
        name: name
      });

      if (response && response.success && response.user) {
        setUser(response.user);
        setError(null);
        navigate('/app/tasks');
      } else {
        setError(response.error || 'Failed to create user');
      }
    } catch (err) {
      setError((err as Error).message || 'An error occurred while creating user');
    }
  };

  const handleImportYourAccount = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'restoreAccount',
        privateKey: privateKey
      });

      if (response && response.success && response.user) {
        setUser(response.user);
        setError(null);
        navigate('/app/tasks');
      } else {
        setError(response.error || 'Failed to restore account');
      }
    } catch (err) {
      setError((err as Error).message || 'An error occurred while restoring account');
    }
  };

  // Handle changes to the private key input
  const onPrivateKeyChange = (value: string) => {
    setPrivateKey(value);
    setIsValidKey(validatePrivateKey(value));
  };

  return (
    <div className="w-full h-full p-8 flex flex-col justify-center items-center gap-6">
      {/* Logo */}
      {error && (
        <div className="text-red-500 mb-4 text-sm">
          {error}
        </div>
      )}
      <div className="flex flex-col gap-4 w-full max-w-md items-center">
        <img src={IMAGES.KleoLogoInCirclePath} alt="logo" />
      </div>
      {/* Create New Account Title + Desc */}
      <div className="flex flex-col items-center gap-1">
        <h1 className="font-inter font-bold text-2xl">
          {LOGIN_PAGE_DATA.title1}
        </h1>
        <p className="font-inter font-normal text-xs opacity-80">
          {LOGIN_PAGE_DATA.desc1}
        </p>
      </div>
      {/* Create New Account Form */}
      <div className="w-full max-w-md space-y-4">
        <FormInputField
          label={LOGIN_PAGE_DATA.createNewAccount[0].label || ""}
          placeholder={LOGIN_PAGE_DATA.createNewAccount[0].placeholder || ""}
          iconPath={LOGIN_PAGE_DATA.createNewAccount[0].iconPath}
          value={name}
          onChange={setName}
        />
        <FormButton
          text={LOGIN_PAGE_DATA.createNewAccount[1].text || ""}
          bgColor={LOGIN_PAGE_DATA.createNewAccount[1].bgColor || ""}
          textColor={LOGIN_PAGE_DATA.createNewAccount[1].textColor || ""}
          onClick={handleCreateNewAccount}
        />
      </div>
      {/* OR */}
      <div className="flex justify-between items-center gap-4 w-full max-w-md">
        <div className="flex-1 border border-grayblue-100/60" />
        <p className="text-grayblue-400 font-sans text-sm">Or</p>
        <div className="flex-1 border border-grayblue-100/60" />
      </div>
      {/* Import Your Account Title + Desc */}
      <div className="flex flex-col items-center gap-1">
        <h1 className="font-inter font-bold text-2xl">
          {LOGIN_PAGE_DATA.title2}
        </h1>
        <p className="font-inter font-normal text-xs opacity-80">
          {LOGIN_PAGE_DATA.desc2}
        </p>
      </div>
      {/* Import Your Account Form */}
      <div className="w-full max-w-md space-y-4">
        <FormInputField
          label={LOGIN_PAGE_DATA.importYourAccount[0].label || ""}
          placeholder={LOGIN_PAGE_DATA.importYourAccount[0].placeholder || ""}
          iconPath={LOGIN_PAGE_DATA.importYourAccount[0].iconPath}
          value={privateKey}
          onChange={onPrivateKeyChange}
        />
        <FormButton
          text={LOGIN_PAGE_DATA.importYourAccount[1].text || ""}
          bgColor={LOGIN_PAGE_DATA.importYourAccount[1].bgColor || ""}
          textColor={LOGIN_PAGE_DATA.importYourAccount[1].textColor || ""}
          onClick={handleImportYourAccount}
          disabled={!isValidKey} // Disable if invalid or empty
        />
      </div>
    </div>
  );
};
