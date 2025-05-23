/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/staff/MessagesPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import StaffLayout from '../../layouts/StaffLayout';
import apiClient from '../../services/api';
import { MessageSquare, Send, Paperclip, Search, Plus, X, Users as UsersIconLucide } from 'lucide-react'; // Renamed Users
import { format } from 'date-fns'; // For formatting timestamps

// Types should ideally come from a shared types file (e.g., ../../types/api)
interface Message {
    id: string | number;
    sender: { id: number; name: string; user_type: string; } | { name: string }; // Make sender more flexible
    content: string;
    sent_at: string; // Assuming API sends this as ISO string
    isOwnMessage?: boolean; // To be determined on frontend
}

interface Conversation {
    id: string | number;
    display_name: string; // From ConversationResource
    participants?: { id: number; name: string; }[];
    latest_message?: { content: string; sent_at: string; } | null;
    // unread_count?: number; // Add if your API provides it
}

interface SelectableUser { // For the "New Conversation" modal user list
    id: string | number;
    name: string;
    email: string;
    user_type: 'admin' | 'officer' | 'staff'; // Types staff can message
}

const MessagesPage: React.FC = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    const [showNewConversationModal, setShowNewConversationModal] = useState(false);
    const [selectableUsers, setSelectableUsers] = useState<SelectableUser[]>([]);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'admin' | 'officer' | 'staff'>('all'); // Adjusted for staff context
    const [isLoadingSelectableUsers, setIsLoadingSelectableUsers] = useState(false);

    const [authUser, setAuthUser] = useState<{ id: number } | null>(null); // To determine isOwnMessage
    const [selectedRecipient, setSelectedRecipient] = useState<SelectableUser | null>(null);
    const [initialMessage, setInitialMessage] = useState('');
    const [isStartingConversation, setIsStartingConversation] = useState(false);

    // Fetch authenticated user ID once
    useEffect(() => {
        apiClient.get('/user').then(response => setAuthUser(response.data));
    }, []);


    const fetchConversations = useCallback(async () => {
        setIsLoadingConversations(true);
        try {
            const response = await apiClient.get<{ data: Conversation[] }>('/staff/messages/threads');
            setConversations(response.data.data || []);
            if (response.data.data && response.data.data.length > 0 && !selectedConversation) {
                // Auto-select first conversation if none is selected
                // handleConversationSelect(response.data.data[0]);
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setIsLoadingConversations(false);
        }
    }, [selectedConversation]); // Re-fetch if selectedConversation changes (e.g. after starting a new one)

    const fetchMessages = useCallback(async (conversationId: string | number) => {
        if (!conversationId) return;
        setIsLoadingMessages(true);
        setMessages([]); // Clear previous messages
        try {
            const response = await apiClient.get<{ data: Message[] }>(`/staff/messages/threads/${conversationId}`);
            const fetchedMessages = response.data.data || [];
            setMessages(fetchedMessages.map(msg => ({
                ...msg,
                isOwnMessage: 'id' in msg.sender && msg.sender.id === authUser?.id
            })));
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setIsLoadingMessages(false);
        }
    }, [authUser]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation?.id) return;

        try {
            const response = await apiClient.post<{ data: Message }>(`/staff/messages/threads/${selectedConversation.id}`, {
                content: newMessage,
            });
            // Add sent message to state optimistically or wait for WebSocket/refetch
            const sentApiMessage = response.data.data;
            const displayMessage: Message = {
                ...sentApiMessage,
                isOwnMessage: true, // Sender is current user
                sender: { name: 'You' } // Or use authUser.name
            };
            setMessages((prev) => [...prev, displayMessage]);
            setNewMessage('');
            // Optionally refetch conversations to update lastMessagePreview & order
            fetchConversations();
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Failed to send message. Please try again.');
        }
    };

    const handleConversationSelect = (conversation: Conversation) => {
        setSelectedConversation(conversation);
        fetchMessages(conversation.id);
    };

    const fetchMessageableUsers = useCallback(async () => {
        setIsLoadingSelectableUsers(true);
        try {
            const params = new URLSearchParams();
            if (userSearchTerm) params.append('search', userSearchTerm);
            if (userTypeFilter !== 'all') params.append('user_type', userTypeFilter);
            params.append('per_page', '20'); // Limit for modal display

            const response = await apiClient.get<{ data: SelectableUser[] }>(`/staff/messageable-users?${params.toString()}`);
            setSelectableUsers(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch users for messaging:', error);
        } finally {
            setIsLoadingSelectableUsers(false);
        }
    }, [userSearchTerm, userTypeFilter]);

    const startNewConversation = async () => {
        if (!selectedRecipient || !initialMessage.trim()) {
            alert("Please select a recipient and enter a message");
            return;
        }

        try {
            setIsStartingConversation(true);
            const response = await apiClient.post<{ data: Conversation }>('/staff/messages/threads', {
                recipient_user_id: selectedRecipient.id,
                initial_message_content: initialMessage.trim()
            });

            const newConversation = response.data.data;
            setShowNewConversationModal(false);
            setSelectedRecipient(null);
            setInitialMessage('');
            fetchConversations();
            handleConversationSelect(newConversation);
        } catch (error) {
            console.error('Failed to start new conversation:', error);
            alert('Could not start new conversation. Please try again.');
        } finally {
            setIsStartingConversation(false);
        }
    };

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]); // Initial fetch of conversations

    useEffect(() => {
        if (!showNewConversationModal) {
            setSelectedRecipient(null);
            fetchMessageableUsers();
            setInitialMessage('');
            setUserSearchTerm('');
            setUserTypeFilter('all');
        }
    }, [showNewConversationModal, fetchMessageableUsers]);

    return (
        <StaffLayout>
            <title>Messages - Staff Portal</title>
            {/* Add flex-1 and margin-left for sidebar width, plus consistent padding */}
            <div className="flex-1 p-6 ml-64">
                {/* Page Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                            <MessageSquare className="mr-3 text-brand-purple-admin" size={28} />
                            Messages
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Manage your conversations
                        </p>
                    </div>
                </div>

                {/* Messages Interface */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="flex h-[calc(100vh-12rem)]">
                        {/* Conversation List Sidebar */}
                        <div className="w-1/3 lg:w-1/4 border-r dark:border-gray-700 flex flex-col">
                            <div className="p-3 border-b dark:border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                    <h2 className="text-md font-semibold text-gray-700 dark:text-gray-200">Chats</h2>
                                    <button
                                        onClick={() => setShowNewConversationModal(true)}
                                        className="p-1.5 text-brand-purple-admin hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-md"
                                        title="New Conversation"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Conversations List */}
                            <div className="flex-grow overflow-y-auto custom-scrollbar">
                                {isLoadingConversations && <p className="p-3 text-xs text-gray-500">Loading chats...</p>}
                                {!isLoadingConversations && conversations.length === 0 && <p className="p-3 text-xs text-center text-gray-500">No conversations yet.</p>}
                                {conversations.map((convo) => (
                                    <div
                                        key={convo.id}
                                        onClick={() => handleConversationSelect(convo)}
                                        className={`p-3 border-b dark:border-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50
                                            ${selectedConversation?.id === convo.id ? 'bg-indigo-100 dark:bg-indigo-700/30 border-l-2 border-indigo-500' : 'border-l-2 border-transparent'}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate">{convo.display_name}</h3>
                                            {/* Unread count display needed */}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{convo.latest_message?.content || 'No messages yet.'}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 text-right">{convo.latest_message?.sent_at ? format(new Date(convo.latest_message.sent_at), 'p') : ''}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Message Display Area */}
                        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900/80">
                            {selectedConversation ? (
                                <>
                                    <div className="p-3 border-b dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center">
                                        {/* <img src="/path-to-avatar.png" alt={selectedConversation.display_name} className="w-8 h-8 rounded-full mr-3"/> */}
                                        <h2 className="font-semibold text-gray-800 dark:text-gray-100">{selectedConversation.display_name}</h2>
                                    </div>
                                    <div ref={(el) => { if (el) el.scrollTop = el.scrollHeight; }} // Auto-scroll to bottom
                                        className="flex-grow p-4 space-y-3 overflow-y-auto custom-scrollbar">
                                        {isLoadingMessages && <p className="text-center text-sm text-gray-500">Loading messages...</p>}
                                        {!isLoadingMessages && messages.length === 0 && <p className="text-center text-sm text-gray-500">No messages in this conversation yet.</p>}
                                        {messages.map(msg => (
                                            <div key={msg.id} className={`flex ${msg.isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[70%] px-3 py-2 rounded-xl text-sm ${msg.isOwnMessage ? 'bg-brand-purple-admin text-white rounded-br-none' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow rounded-bl-none'}`}>
                                                    <p>{msg.content}</p>
                                                    <p className={`text-xs mt-1 ${msg.isOwnMessage ? 'text-purple-200 text-right' : 'text-gray-400 dark:text-gray-500 text-left'}`}>{format(new Date(msg.sent_at), 'p')}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <form onSubmit={handleSendMessage} className="p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center gap-2">
                                        <button type="button" className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"><Paperclip size={20} /></button>
                                        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your message..."
                                            className="input-style flex-1 py-2 text-sm" />
                                        <button type="submit" className="primary-button px-4 py-2 text-sm"><Send size={18} /></button>
                                    </form>
                                </>
                            ) : (
                                <div className="flex-grow flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-10 text-center">
                                    <MessageSquare size={48} className="mb-4 text-gray-300 dark:text-gray-600" />
                                    <p className="font-medium">Select a conversation</p>
                                    <p className="text-xs">or start a new one to begin messaging.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* New Conversation Modal */}
                {/* New Conversation Modal */}
                {showNewConversationModal && (
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
                            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Start New Conversation</h3>
                                <button
                                    onClick={() => {
                                        setShowNewConversationModal(false);
                                        setSelectedRecipient(null);
                                        setInitialMessage('');
                                    }}
                                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-4 space-y-4">
                                {/* Search and Filter Section */}
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            <Search size={16} className="text-gray-400" />
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Search users by name or email..."
                                            value={userSearchTerm}
                                            onChange={(e) => setUserSearchTerm(e.target.value)}
                                            className="input-style w-full pl-10 text-sm py-1.5"
                                        />
                                    </div>
                                    <select
                                        value={userTypeFilter}
                                        onChange={(e) => setUserTypeFilter(e.target.value as any)}
                                        className="input-style w-auto text-sm py-1.5"
                                    >
                                        <option value="all">All Types</option>
                                        <option value="admin">Admins</option>
                                        <option value="officer">Officers</option>
                                        <option value="staff">Staff</option>
                                    </select>
                                </div>

                                {/* Users List */}
                                <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
                                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                        {isLoadingSelectableUsers && (
                                            <p className="text-center text-sm text-gray-500 py-4">Loading users...</p>
                                        )}
                                        {!isLoadingSelectableUsers && selectableUsers.length === 0 && (
                                            <p className="text-center text-sm text-gray-500 py-4">No users found matching criteria.</p>
                                        )}
                                        {selectableUsers.map((user) => (
                                            <button
                                                key={user.id}
                                                onClick={() => setSelectedRecipient(user)}
                                                className={`w-full p-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-left border-b dark:border-gray-700/50 last:border-b-0
                                    ${selectedRecipient?.id === user.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                                            >
                                                <UsersIconLucide className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                                <div>
                                                    <p className="font-medium text-sm text-gray-800 dark:text-gray-100">{user.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {user.email} <span className="text-gray-400 dark:text-gray-500">· {user.user_type}</span>
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Message Input */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Initial Message
                                    </label>
                                    <textarea
                                        value={initialMessage}
                                        onChange={(e) => setInitialMessage(e.target.value)}
                                        placeholder="Type your first message..."
                                        className="input-style w-full min-h-[100px] text-sm py-2 resize-none"
                                        disabled={!selectedRecipient}
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setShowNewConversationModal(false);
                                        setSelectedRecipient(null);
                                        setInitialMessage('');
                                    }}
                                    className="secondary-button text-sm"
                                    disabled={isStartingConversation}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={startNewConversation}
                                    disabled={!selectedRecipient || !initialMessage.trim() || isStartingConversation}
                                    className="primary-button text-sm flex items-center gap-2"
                                >
                                    {isStartingConversation ? (
                                        <>
                                            <span className="animate-spin">⌛</span>
                                            Starting...
                                        </>
                                    ) : (
                                        'Start Conversation'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </StaffLayout>
    );
};

export default MessagesPage;