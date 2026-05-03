import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ChatBubble from '../../components/agent/ChatBubble';
import ChatInput from '../../components/agent/ChatInput';
import TypingIndicator from '../../components/agent/TypingIndicator';
import ToolStatusCard, { ToolStatus } from '../../components/agent/ToolStatusCard';
import { apiClient, StreamEvent } from '../../lib/api';

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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTools, setActiveTools] = useState<ToolStatus[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  // Calculate tab bar height for keyboard offset
  const tabBarHeight = 60 + Math.max(insets.bottom, 10);

  const handleStreamEvent = useCallback((event: StreamEvent) => {
    switch (event.type) {
      case 'message_start':
        setConversationId(event.conversationId);
        break;

      case 'text_delta':
        // Ignore text streaming - we only care about tool calls
        break;

      case 'tool_start':
        setActiveTools((prev) => [
          ...prev,
          {
            id: event.id,
            name: event.name,
            input: event.input,
            status: 'running',
          },
        ]);
        break;

      case 'tool_result':
        setActiveTools((prev) =>
          prev.map((tool) =>
            tool.id === event.id
              ? {
                  ...tool,
                  status: event.success ? 'success' : 'error',
                  result: event.result,
                }
              : tool
          )
        );
        break;

      case 'message_complete':
        setMessages((prev) => [
          ...prev,
          {
            id: event.message.id,
            role: 'assistant',
            content: event.message.content,
            timestamp: new Date(event.message.timestamp),
            toolCalls: event.message.toolCalls,
          },
        ]);
        setActiveTools([]);
        setIsLoading(false);
        break;

      case 'error':
        setError(event.message);
        setIsLoading(false);
        setActiveTools([]);
        break;
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setError(null);
    setActiveTools([]);

    try {
      await apiClient.sendChatMessageStream(
        userMessage.content,
        conversationId || undefined,
        handleStreamEvent
      );
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err.message || 'Failed to send message');
      setIsLoading(false);
      setActiveTools([]);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    setActiveTools([]);
  };

  const renderStreamingContent = () => {
    if (!isLoading && activeTools.length === 0) {
      return null;
    }

    return (
      <View style={styles.streamingContainer}>
        {/* Show tool status cards */}
        {activeTools.length > 0 ? (
          <ToolStatusCard tools={activeTools} />
        ) : (
          <TypingIndicator />
        )}
      </View>
    );
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <ChatBubble
      content={item.content}
      role={item.role}
      timestamp={item.timestamp}
      toolCalls={item.toolCalls}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name="robot-happy-outline"
        size={64}
        color={COLORS.textSecondary}
      />
      <Text style={styles.emptyTitle}>Your AI Coach</Text>
      <Text style={styles.emptySubtitle}>
        I can help you track food, plan meals, and reach your health goals.
      </Text>
      <View style={styles.suggestions}>
        <TouchableOpacity
          style={styles.suggestionChip}
          onPress={() => setInputText('I had a banana for breakfast')}
        >
          <Text style={styles.suggestionText}>Log a meal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.suggestionChip}
          onPress={() => setInputText('Create a 7-day meal plan for me')}
        >
          <Text style={styles.suggestionText}>Create meal plan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.suggestionChip}
          onPress={() => setInputText('I just did 30 minutes of running')}
        >
          <Text style={styles.suggestionText}>Log exercise</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // On iOS (native or PWA), use padding behavior with tab bar offset
  const isIOSorWeb = Platform.OS === 'ios' || Platform.OS === 'web';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={isIOSorWeb ? 'padding' : 'height'}
        keyboardVerticalOffset={tabBarHeight}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons
              name="robot-happy-outline"
              size={24}
              color={COLORS.primary}
            />
            <Text style={styles.headerTitle}>Coach</Text>
          </View>
          <TouchableOpacity onPress={handleNewChat} style={styles.newChatButton}>
            <MaterialCommunityIcons
              name="plus"
              size={24}
              color={COLORS.text}
            />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.messageList,
            messages.length === 0 && styles.emptyMessageList,
          ]}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderStreamingContent}
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }}
        />

        {/* Error */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Input */}
        <ChatInput
          value={inputText}
          onChange={setInputText}
          onSend={handleSendMessage}
          loading={isLoading}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  newChatButton: {
    padding: 8,
  },
  messageList: {
    paddingVertical: 16,
  },
  emptyMessageList: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
  },
  suggestionChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  suggestionText: {
    fontSize: 13,
    color: COLORS.text,
  },
  errorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ff4444',
  },
  errorText: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
  },
  streamingContainer: {
    paddingHorizontal: 16,
  },
});
