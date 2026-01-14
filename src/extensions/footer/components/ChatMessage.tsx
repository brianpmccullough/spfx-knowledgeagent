import * as React from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import styles from './Footer.module.scss';

export interface IChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface IChatMessageProps {
  message: IChatMessage;
}

const ChatMessage: React.FC<IChatMessageProps> = ({ message }) => {
  const [feedback, setFeedback] = React.useState<'up' | 'down' | null>(null);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleFeedback = (type: 'up' | 'down'): void => {
    setFeedback(feedback === type ? null : type);
  };

  return (
    <div className={`${styles.messageWrapper} ${styles[message.sender]}`}>
      <div className={`${styles.messageBubble} ${styles[message.sender]}`}>
        <div className={styles.messageText}>{message.text}</div>
        <div className={styles.messageTime}>{formatTime(message.timestamp)}</div>
        {message.sender === 'bot' && (
          <div className={styles.messageFeedback}>
            <button
              onClick={() => handleFeedback('up')}
              className={feedback === 'up' ? styles.active : ''}
              title="Helpful"
            >
              <Icon iconName="Like" />
            </button>
            <button
              onClick={() => handleFeedback('down')}
              className={feedback === 'down' ? styles.active : ''}
              title="Not helpful"
            >
              <Icon iconName="Dislike" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
