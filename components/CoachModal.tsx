import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ChatBubble from './agent/ChatBubble';
import ChatInput from './agent/ChatInput';
import TypingIndicator from './agent/TypingIndicator';
import ToolStatusCard, { ToolStatus } from './agent/ToolStatusCard';
import { apiClient, StreamEvent } from '../lib/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = {
  background: '#0c371e',
  surface: '#164a2e',
  surfaceLight: '#1e5c3a',
  primary: '#FF6F00',
  text: '#eef3e0',
  textSecondary: '#a8b99a',
  border: '#2d5a3f',
};

// FAB position for animation origin
const FAB_SIZE = 56;
const FAB_RIGHT = 16;
const FAB_BOTTOM_BASE = 56 + 16; // tab bar + padding

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

interface CoachModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CoachModal({ visible, onClose }: CoachModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTools, setActiveTools] = useState<ToolStatus[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  // Animation values
  const expandAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Expand animation
      Animated.parallel([
        Animated.spring(expandAnim, {
          toValue: 1,
          damping: 15,
          stiffness: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Collapse animation
      Animated.parallel([
        Animated.spring(expandAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleStreamEvent = useCallback((event: StreamEvent) => {
    switch (event.type) {
      case 'message_start':
        setConversationId(event.conversationId);
        break;

      case 'text_delta':
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

  // Calculate the corner position for the expand animation
  const fabBottomWithInset = FAB_BOTTOM_BASE + insets.bottom;

  // Animation interpolations
  const scale = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const translateX = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_WIDTH / 2 - FAB_RIGHT - FAB_SIZE / 2, 0],
  });

  const translateY = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT / 2 - fabBottomWithInset - FAB_SIZE / 2, 0],
  });

  const borderRadius = expandAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [FAB_SIZE / 2, 24, 0],
  });

  if (!visible && expandAnim._value === 0) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.modalContainer,
          {
            opacity: opacityAnim,
            transform: [
              { translateX },
              { translateY },
              { scale },
            ],
            borderRadius,
          },
        ]}
      >
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={COLORS.text}
                />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Coach</Text>
              <TouchableOpacity onPress={handleNewChat} style={styles.addButton}>
                <MaterialCommunityIcons
                  name="plus"
                  size={24}
                  color={COLORS.primary}
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
              keyboardShouldPersistTaps="handled"
            />

            {/* Error */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Input */}
            <View style={{ paddingBottom: insets.bottom }}>
              <ChatInput
                value={inputText}
                onChange={setInputText}
                onSend={handleSendMessage}
                loading={isLoading}
              />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
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
