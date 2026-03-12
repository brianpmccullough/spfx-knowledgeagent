import * as React from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import { ApplicationCustomizerContext } from '@microsoft/sp-application-base';
import ChatPanel from './ChatPanel';
import styles from './Footer.module.scss';

export interface IFooterProps {
  context: ApplicationCustomizerContext;
  aadClientId: string;
  apiUrl: string;
}

interface ILegacyPageContext {
  isSiteAdmin?: boolean;
  isSiteOwner?: boolean;
  hasManageWebPermissions?: boolean;
}

const Footer: React.FC<IFooterProps> = ({ context, aadClientId, apiUrl }) => {
  const [isPanelOpen, setIsPanelOpen] = React.useState(false);
  const [isSiteOwnerMode, setIsSiteOwnerMode] = React.useState(false);

  React.useEffect(() => {
    const legacy = context.pageContext.legacyPageContext as ILegacyPageContext;
    setIsSiteOwnerMode(legacy.isSiteAdmin || legacy.isSiteOwner || legacy.hasManageWebPermissions || false);
  }, []);

  const handleButtonClick = (): void => {
    setIsPanelOpen(true);
  };

  const handlePanelDismiss = (): void => {
    setIsPanelOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className={isSiteOwnerMode ? styles.chatButtonOwner : styles.chatButton}
        onClick={handleButtonClick}
        title="Open Knowledge Agent"
        aria-label="Open Knowledge Agent chat"
      >
        <Icon iconName="ChatBot" />
      </button>

      <ChatPanel
        isOpen={isPanelOpen}
        onDismiss={handlePanelDismiss}
        context={context}
        aadClientId={aadClientId}
        apiUrl={apiUrl}
      />
    </>
  );
};

export default Footer;
