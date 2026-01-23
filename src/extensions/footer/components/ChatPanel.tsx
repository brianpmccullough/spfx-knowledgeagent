import * as React from 'react';
import { Panel, PanelType } from '@fluentui/react/lib/Panel';
import { TextField } from '@fluentui/react/lib/TextField';
import { IconButton } from '@fluentui/react/lib/Button';
import { Icon } from '@fluentui/react/lib/Icon';
import { Toggle } from '@fluentui/react/lib/Toggle';
import { ApplicationCustomizerContext } from '@microsoft/sp-application-base';
import { AadTokenProvider } from '@microsoft/sp-http';
import ChatMessage, { IChatMessage } from './ChatMessage';
import styles from './Footer.module.scss';
import {
  parseTranslationCommand
} from '../utils/pageContentExtractor';


interface IApiChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface IChatResponse {
  response: string;
  messages: IApiChatMessage[];
}

export interface IChatPanelProps {
  isOpen: boolean;
  onDismiss: () => void;
  context: ApplicationCustomizerContext;
  aadClientId: string;
  apiUrl: string;
}

const STARTER_PROMPTS = [
  'What can you help me with?',
  'Tell me about this site',
  'Translate this page to Spanish'
];

const ChatPanel: React.FC<IChatPanelProps> = ({ isOpen, onDismiss, context, aadClientId, apiUrl }) => {
  const [messages, setMessages] = React.useState<IChatMessage[]>([]);
  const [apiMessages, setApiMessages] = React.useState<IApiChatMessage[]>([]);
  const [inputValue, setInputValue] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRagMode, setIsRagMode] = React.useState(true);
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

  const callApi = async (userMessage: string, currentHistory: IApiChatMessage[]): Promise<{ response: string; updatedHistory: IApiChatMessage[] }> => {
    try {
      if (!aadClientId) {
        console.error('AAD Client ID not configured');
        return { response: 'Error: AAD Client ID not configured', updatedHistory: currentHistory };
      }

      const tokenProvider: AadTokenProvider = await context.aadTokenProviderFactory.getTokenProvider();
      const token: string = await tokenProvider.getToken(aadClientId);

      console.log('Token acquired successfully');

      const newUserMessage: IApiChatMessage = { role: 'user', content: userMessage };
      const messagesPayload = [...currentHistory, newUserMessage];

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: messagesPayload, context: { siteUrl: context.pageContext.web.absoluteUrl, searchMode: isRagMode ? 'rag' : 'kql' } })
      });

      if (!response.ok) {
        console.error(`API call failed with status: ${response.status}`);
        return { response: `Error: API call failed with status ${response.status}`, updatedHistory: currentHistory };
      }

      const data: IChatResponse = await response.json();
      console.log('API Response:', data);

      const assistantMessage: IApiChatMessage = { role: 'assistant', content: data.response };
      const updatedHistory = [...messagesPayload, assistantMessage];

      return { response: data.response, updatedHistory };
    } catch (error) {
      console.error('Error calling API:', error);
      return { response: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`, updatedHistory: currentHistory };
    }
  };

  const addBotMessage = (text: string): void => {
    const botMessage: IChatMessage = {
      id: generateId(),
      text,
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, botMessage]);
  };

  const handleTranslation = async (targetLanguage: string): Promise<void> => {
    const elements = document.querySelectorAll<HTMLElement>('[data-sp-feature-tag="Rich Text Editor"]');

    if (elements.length === 0) {
      addBotMessage('No text content found on this page to translate.');
      return;
    }

    addBotMessage(`Found ${elements.length} text section(s). Translating each to ${targetLanguage}...`);

    const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
    let currentHistory = apiMessages;

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const originalStyles = {
        border: element.style.border,
        backgroundColor: element.style.backgroundColor,
        transition: element.style.transition
      };

      try {
        // Scroll and highlight
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.style.transition = 'background-color 0.3s, border 0.3s';
        element.style.border = '2px dashed #0078d4';
        element.style.backgroundColor = 'rgba(0, 120, 212, 0.1)';

        await delay(500);

        const textContent = element.textContent?.trim() || '';
        if (!textContent) {
          addBotMessage(`Section ${i + 1}: (empty, skipping)`);
          element.style.border = originalStyles.border;
          element.style.backgroundColor = originalStyles.backgroundColor;
          continue;
        }

        addBotMessage(`**Section ${i + 1} of ${elements.length}** - Translating...`);

        // Translate this section
        const translationPrompt = `Translate the following text to ${targetLanguage}. Return ONLY the translated text, no explanations:\n\n${textContent}`;
        const { response, updatedHistory } = await callApi(translationPrompt, currentHistory);
        currentHistory = updatedHistory;

        // Mark as processed (green) and show translation
        element.style.border = '2px solid #107c10';
        element.style.backgroundColor = 'rgba(16, 124, 16, 0.1)';

        addBotMessage(response);

        // Pause 5 seconds for user to read
        await delay(5000);

        // Restore original styles
        element.style.transition = 'background-color 0.3s, border 0.3s';
        element.style.border = originalStyles.border;
        element.style.backgroundColor = originalStyles.backgroundColor;

        await delay(300);

      } catch (error) {
        console.error(`Error translating section ${i + 1}:`, error);
        addBotMessage(`Error translating section ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Restore styles on error
        element.style.border = originalStyles.border;
        element.style.backgroundColor = originalStyles.backgroundColor;
      }
    }

    setApiMessages(currentHistory);
    addBotMessage(`Translation complete! All ${elements.length} sections translated to ${targetLanguage}.`);
  };

  const handleSend = async (): Promise<void> => {
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    const userMessage: IChatMessage = {
      id: generateId(),
      text: userText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Check for translation command
    const targetLanguage = parseTranslationCommand(userText);
    if (targetLanguage) {
      await handleTranslation(targetLanguage);
      setIsLoading(false);
      return;
    }

    // Standard chat flow
    const { response, updatedHistory } = await callApi(userText, apiMessages);
    setApiMessages(updatedHistory);

    const botMessage: IChatMessage = {
      id: generateId(),
      text: response,
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
        <Toggle
          className={styles.modeToggle}
          checked={isRagMode}
          onChange={(_, checked) => setIsRagMode(checked ?? true)}
          onText="RAG"
          offText="KQL"
          styles={{
            root: { marginBottom: 0 },
            label: { marginLeft: 4 }
          }}
        />
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
