import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import ToolResultCard from './ToolResultCard';

const COLORS = {
  background: '#0c371e',
  surface: '#164a2e',
  surfaceLight: '#1e5c3a',
  primary: '#FF6F00',
  text: '#eef3e0',
  textSecondary: '#a8b99a',
  border: '#2d5a3f',
};

interface ToolCall {
  id: string;
  name: string;
  input: Record<string, any>;
  result?: any;
}

interface ChatBubbleProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp?: Date;
  toolCalls?: ToolCall[];
  isStreaming?: boolean;
}

const markdownStyles = {
  body: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 22,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 8,
  },
  heading1: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700' as const,
    marginTop: 8,
    marginBottom: 8,
  },
  heading2: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600' as const,
    marginTop: 8,
    marginBottom: 6,
  },
  heading3: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600' as const,
    marginTop: 6,
    marginBottom: 4,
  },
  strong: {
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  em: {
    fontStyle: 'italic' as const,
  },
  bullet_list: {
    marginBottom: 8,
  },
  ordered_list: {
    marginBottom: 8,
  },
  list_item: {
    marginBottom: 4,
  },
  bullet_list_icon: {
    color: COLORS.primary,
    fontSize: 14,
    marginRight: 8,
  },
  code_inline: {
    backgroundColor: COLORS.surface,
    color: COLORS.primary,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 13,
    fontFamily: 'monospace',
  },
  code_block: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  fence: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  link: {
    color: COLORS.primary,
  },
  blockquote: {
    backgroundColor: COLORS.surface,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 8,
  },
  hr: {
    backgroundColor: COLORS.border,
    height: 1,
    marginVertical: 12,
  },
  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginVertical: 8,
  },
  th: {
    backgroundColor: COLORS.surface,
    padding: 8,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  td: {
    padding: 8,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
};

export default function ChatBubble({ content, role, timestamp, toolCalls, isStreaming }: ChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      {/* Tool results shown before assistant message (not during streaming) */}
      {!isUser && !isStreaming && toolCalls && toolCalls.length > 0 && (
        <View style={styles.toolResultsContainer}>
          <ToolResultCard toolCalls={toolCalls} />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {isUser ? (
          <Text style={[styles.content, styles.userContent]}>
            {content}
          </Text>
        ) : (
          <Markdown style={markdownStyles}>
            {content}
          </Markdown>
        )}
        {isStreaming && <Text style={styles.cursor}>▋</Text>}
      </View>
      {!isStreaming && timestamp && (
        <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.assistantTimestamp]}>
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  toolResultsContainer: {
    maxWidth: '80%',
    marginBottom: 8,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: COLORS.surfaceLight,
    borderBottomLeftRadius: 4,
  },
  content: {
    fontSize: 15,
    lineHeight: 20,
  },
  userContent: {
    color: '#fff',
  },
  assistantContent: {
    color: COLORS.text,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  userTimestamp: {
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  assistantTimestamp: {
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  cursor: {
    color: COLORS.primary,
  },
});
