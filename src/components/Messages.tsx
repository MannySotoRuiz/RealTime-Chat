"use client";

import { pusherClient } from '@/lib/pusher';
import { cn, toPusherKey } from '@/lib/utils';
import { Message } from '@/lib/validations/message';
import { format } from 'date-fns';
import Image from 'next/image';
import { FC, useEffect, useRef, useState } from 'react';

interface MessagesProps {
    initialMessages: Message[]
    sessionId: string
    chatId: string
    sessionImg: string | null | undefined
    chatPartner: User
}

const Messages: FC<MessagesProps> = ({
    initialMessages,
    sessionId,
    chatId,
    sessionImg,
    chatPartner
}) => {

    // when a user sends a message, we can put into the state, showing it directly to the user instead of having to refresh the page
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const scrollDownRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        // doesnt allow back ticks so need to use function for that
        pusherClient.subscribe(toPusherKey(`chat:${chatId}`)); // now listening 

        // the message will get passed from the server
        const messageHandler = (message: Message) => {
            setMessages((prev) => [message, ...prev]); // get access to what they were previously
        }

        // now tell pusher what to do when something occurs
        pusherClient.bind('incoming_messaging', messageHandler);

        return () => {
            pusherClient.unsubscribe(toPusherKey(`chat:${chatId}`));
            pusherClient.unbind('incoming_messaging', messageHandler);
        }
    }, []);

    const formatTimestamp = (timestamp: number) => {
        return format(timestamp, 'HH:mm');
    }

    return <div id='messages' className='flex h-full flex-1 flex-col-reverse gap-4 p-3 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch'>
        {/* we created this div at the top of the component*/}
        {/* first of we reversed the order, everything is reveresed */}
        {/* secondly, when we send a message, we automatically want to scroll to that message (by using the ref)*/}
        <div ref={scrollDownRef} />

        {messages.map((message, idx) => {
            const isCurrentUser = message.senderId === sessionId

            // we need to know if there is a next msg from the same user
            const hasNextMessageFromSameUser = messages[idx - 1]?.senderId === messages[idx].senderId;

            return (
                <div key={`${message.id}-${message.timestamp}`} className='chat-message'>
                    <div className={cn('flex items-end', {
                        'justify-end': isCurrentUser,
                    })}>
                        <div className={cn('flex flex-col space-y-2 text-base max-w-xs mx-2', {
                            'order-1 items-end': isCurrentUser,
                            'order-2 items-start': !isCurrentUser,
                        })}>
                            <span className={cn('px-4 py-2 rounded-lg inline-block', {
                                'bg-indigo-600 text-white': isCurrentUser,
                                'bg-gray-200 text-gray-900': !isCurrentUser,
                                'rounded-br-none': !hasNextMessageFromSameUser && isCurrentUser, // only the last message that is sent concurrently from the same user has an endge border and others will be round 
                                'rounded-bl-none': !hasNextMessageFromSameUser && !isCurrentUser,
                            })}>
                                {message.text}{' '}
                                <span className='ml-2 text-xs text-gray-400'>
                                    {formatTimestamp(message.timestamp)}
                                </span>
                            </span>
                        </div>

                        <div className={cn('relative w-6 h-6', {
                            'order-2': isCurrentUser,
                            'order-1': !isCurrentUser,
                            'invisible': hasNextMessageFromSameUser,
                        })}>
                            <Image fill src={isCurrentUser ? (sessionImg as string) : chatPartner.image} alt="Profile picture" referrerPolicy='no-referrer' className='rounded-full' />
                        </div>
                    </div>
                </div>
            );
        })}
    </div>
}

export default Messages;