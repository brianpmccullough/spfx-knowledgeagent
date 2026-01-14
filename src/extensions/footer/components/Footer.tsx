import * as React from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import { ApplicationCustomizerContext } from '@microsoft/sp-application-base';
import ChatPanel from './ChatPanel';
import styles from './Footer.module.scss';

export interface IFooterProps {
  context: ApplicationCustomizerContext;
  aadClientId: string;
  message?: string;
}

const Footer: React.FC<IFooterProps> = ({ context, aadClientId }) => {
  const [isPanelOpen, setIsPanelOpen] = React.useState(false);

  const handleButtonClick = (): void => {
    setIsPanelOpen(true);
  };

  const handlePanelDismiss = (): void => {
    setIsPanelOpen(false);
  };

  return (
    <>
      <button
        className={styles.chatButton}
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
      />
    </>
  );
};

export default Footer;
