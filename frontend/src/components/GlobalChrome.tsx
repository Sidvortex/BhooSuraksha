import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopUtilityBar } from './TopUtilityBar';
import { LanguageChooserModal } from './LanguageChooserModal';

export const GlobalChrome: React.FC = () => {
  return (
    <>
      <TopUtilityBar />
      <Outlet />
      <LanguageChooserModal />
    </>
  );
};
