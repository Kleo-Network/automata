// src/pages/Login/Login.tsx

import { useState, useContext } from "react";
import { FormInputField } from "./FormInput";
import { FormButton } from "./FormButton";
import { useNavigate } from "react-router-dom";
import { UserContext } from '../../common/hooks/UserContext';

import { createNewUser, restoreAccount } from '../../../content/index'
const IMAGES = {
  KleoLogoInCirclePath: "../../assets/images/login/kleoLogoInCircle.svg",
  PersonIconPath: "../../assets/images/login/personIcon.svg",
  KeyIconPath: "../../assets/images/login/keyIcon.svg"
}

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
      textColor: "text-white"
    }
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
      textColor: "text-white"
    }
  ]
}

export const Login = () => {
  const { setAddress, setEncryptedPrivateKey } = useContext(UserContext);

  const [name, setName] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const navigate = useNavigate();

  // TODO: @vaibhav Update the logic for handling the submissions. Right now redirecting to home page.
  const handleCreateNewAccount = async () => {
    console.log("Creating new account for: ", name);
    const response = await createNewUser(name);
    if (response.success) {
      console.log("Account created with address: ", response.address);
      navigate('/app');
    } else {
      console.error("Error creating new account: ", response.error);
      // Handle error (e.g., show a message to user)
    }
  };
  const handleImportYourAccount = async () => {
    console.log("Importing account with private key: ", privateKey);
    const response = await restoreAccount(privateKey);
    if (response.success) {
      console.log("Account restored with address: ", response.address);
      navigate('/app');
    } else {
      console.error("Error restoring account: ", response.error);
      // Handle error
    }
  };

  return (
    <div className="w-full h-full p-8 flex flex-col justify-center items-center gap-6">
      {/* Logo */}
      <div className="flex flex-col gap-4 w-full max-w-md items-center">
        <img src={IMAGES.KleoLogoInCirclePath} alt="logo" />
      </div>
      {/* Create New Account Title + Desc */}
      <div className="flex flex-col items-center gap-1">
        <h1 className="font-inter font-bold text-2xl">{LOGIN_PAGE_DATA.title1}</h1>
        <p className="font-inter font-normal text-xs opacity-80">
          {LOGIN_PAGE_DATA.desc1}
        </p>
      </div>
      {/* Create New Account Form */}
      <div className="w-full max-w-md space-y-4">
        <FormInputField
          label={LOGIN_PAGE_DATA.createNewAccount[0].label || ''}
          placeholder={LOGIN_PAGE_DATA.createNewAccount[0].placeholder || ''}
          iconPath={LOGIN_PAGE_DATA.createNewAccount[0].iconPath}
          value={name}
          onChange={setName}
        />
        <FormButton
          text={LOGIN_PAGE_DATA.createNewAccount[1].text || ''}
          bgColor={LOGIN_PAGE_DATA.createNewAccount[1].bgColor || ''}
          textColor={LOGIN_PAGE_DATA.createNewAccount[1].textColor || ''}
          onClick={handleCreateNewAccount}
        />
      </div>
      {/* OR */}
      <div className="flex justify-between items-center gap-4 w-full max-w-md">
        <div className="flex-1 border border-grayblue-100/60" />
        <p className="text-grayblue-400 font-sans text-sm" >Or</p>
        <div className="flex-1 border border-grayblue-100/60" />
      </div>
      {/* Import Your Account Title + Desc */}
      <div className="flex flex-col items-center gap-1">
        <h1 className="font-inter font-bold text-2xl">{LOGIN_PAGE_DATA.title2}</h1>
        <p className="font-inter font-normal text-xs opacity-80">
          {LOGIN_PAGE_DATA.desc2}
        </p>
      </div>
      {/* Import Your Account Form */}
      <div className="w-full max-w-md space-y-4">
        <FormInputField
          label={LOGIN_PAGE_DATA.importYourAccount[0].label || ''}
          placeholder={LOGIN_PAGE_DATA.importYourAccount[0].placeholder || ''}
          iconPath={LOGIN_PAGE_DATA.importYourAccount[0].iconPath}
          value={privateKey}
          onChange={setPrivateKey}
        />
        <FormButton
          text={LOGIN_PAGE_DATA.importYourAccount[1].text || ''}
          bgColor={LOGIN_PAGE_DATA.importYourAccount[1].bgColor || ''}
          textColor={LOGIN_PAGE_DATA.importYourAccount[1].textColor || ''}
          onClick={handleImportYourAccount}
        />
      </div>
    </div>
  )
}
