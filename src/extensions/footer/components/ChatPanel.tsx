import * as React from 'react';
import { Panel, PanelType } from '@fluentui/react/lib/Panel';
import { TextField } from '@fluentui/react/lib/TextField';
import { IconButton } from '@fluentui/react/lib/Button';
import { Icon } from '@fluentui/react/lib/Icon';
import { ApplicationCustomizerContext } from '@microsoft/sp-application-base';
import { AadTokenProvider } from '@microsoft/sp-http';
import ChatMessage, { IChatMessage } from './ChatMessage';
import styles from './Footer.module.scss';

const API_URL: string = 'https://vvkqrydmkr.us-east-1.awsapprunner.com/api/me';

export interface IChatPanelProps {
  isOpen: boolean;
  onDismiss: () => void;
  context: ApplicationCustomizerContext;
  aadClientId: string;
}

const STARTER_PROMPTS = [
  'What can you help me with?',
  'Tell me about this site',
  'How do I find documents?'
];

const ChatPanel: React.FC<IChatPanelProps> = ({ isOpen, onDismiss, context, aadClientId }) => {
  const [messages, setMessages] = React.useState<IChatMessage[]>([]);
  const [inputValue, setInputValue] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateId = (): string => {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const callApi = async (userMessage: string): Promise<string> => {
    try {
      if (!aadClientId) {
        console.error('AAD Client ID not configured');
        return 'Error: AAD Client ID not configured';
      }

      const tokenProvider: AadTokenProvider = await context.aadTokenProviderFactory.getTokenProvider();
      const token: string = await tokenProvider.getToken(aadClientId);

      console.log('Token acquired successfully');

      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`API call failed with status: ${response.status}`);
        return `Error: API call failed with status ${response.status}`;
      }

      const data = await response.json();
      console.log('API Response:', data);
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Error calling API:', error);
      return `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
    }
  };

  const handleSend = async (): Promise<void> => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: IChatMessage = {
      id: generateId(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const responseText = await callApi(userMessage.text);

    const botMessage: IChatMessage = {
      id: generateId(),
      text: responseText,
      sender: 'bot',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);
    setIsLoading(false);
  };

  const handlePromptClick = (prompt: string): void => {
    setInputValue(prompt);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend().catch(console.error);
    }
  };

  const renderContent = (): JSX.Element => (
    <div className={styles.panelContent}>
      <div className={styles.panelHeader}>
        <Icon iconName="ChatBot" className={styles.headerIcon} />
        <span className={styles.headerTitle}>Knowledge Agent</span>
      </div>

      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.starterPrompts}>
            <div className={styles.promptsTitle}>How can I help you today?</div>
            <div className={styles.promptsSubtitle}>
              Ask me anything about this SharePoint site
            </div>
            <div className={styles.promptsList}>
              {STARTER_PROMPTS.map((prompt, index) => (
                <button
                  key={index}
                  className={styles.promptButton}
                  onClick={() => handlePromptClick(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className={styles.messageWrapper}>
                <div className={styles.loadingIndicator}>
                  <div className={styles.loadingDots}>
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className={styles.inputContainer}>
        <TextField
          className={styles.inputField}
          placeholder="Type your message..."
          value={inputValue}
          onChange={(_, newValue) => setInputValue(newValue || '')}
          onKeyPress={handleKeyPress}
          multiline
          autoAdjustHeight
          resizable={false}
        />
        <IconButton
          className={styles.sendButton}
          iconProps={{ iconName: 'Send' }}
          onClick={handleSend}
          disabled={!inputValue.trim() || isLoading}
          title="Send message"
          styles={{
            root: {
              backgroundColor: '#0078d4',
              color: 'white',
              borderRadius: '50%'
            },
            rootHovered: {
              backgroundColor: '#106ebe',
              color: 'white'
            },
            rootPressed: {
              backgroundColor: '#005a9e',
              color: 'white'
            },
            rootDisabled: {
              backgroundColor: '#c8c8c8'
            }
          }}
        />
      </div>
    </div>
  );

  return (
    <Panel
      isOpen={isOpen}
      onDismiss={onDismiss}
      type={PanelType.custom}
      customWidth="400px"
      headerText=""
      onRenderNavigation={() => null}
      styles={{
        main: {
          marginTop: 0
        },
        scrollableContent: {
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        },
        content: {
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }
      }}
    >
      {renderContent()}
    </Panel>
  );
};

export default ChatPanel;
