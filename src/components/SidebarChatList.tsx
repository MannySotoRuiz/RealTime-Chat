"use client";

import { pusherClient } from '@/lib/pusher';
import { chatHrefConstructor, toPusherKey } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import { FC, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import UnseenChatToast from './UnseenChatToast';

interface SidebarChatListProps {
    friends: User[]
    sessionId: string
}

interface ExtendedMessage extends Message {
    senderImg: string
    senderName: string
}

const SidebarChatList: FC<SidebarChatListProps> = ({friends, sessionId}) => {

    const router = useRouter();
    const pathname = usePathname();

    // just keep them in state.
    // we can also implement a functionality where u can also show the messages that are unseen 
    // when u were offline
    // In this case, since we are just keeping them in state, these are only going to show the messages u receive while you are online
    const [unseenMessages, setUnseenMessages] = useState<Message[]>([]);

    useEffect(() => {
        pusherClient.subscribe(toPusherKey(`user:${sessionId}:chats`)); // listening to their chats
        pusherClient.subscribe(toPusherKey(`user:${sessionId}:friends`)); // listening to their friends request

        const newFriendHandler = () => {
            router.refresh(); // refresh the page, without hard reloading
        }

        const chatHandler = (message: ExtendedMessage) => {
            const shouldNotify = 
                pathname !== 
                `/dashboard/chat/${chatHrefConstructor(sessionId, message.senderId)}`
            console.log(shouldNotify, sessionId, message.senderId, pathname);

            if (!shouldNotify) return

            // should be notified
            toast.custom((t) => (
                <UnseenChatToast 
                    t={t}
                    sessionId={sessionId}
                    senderId={message.senderId}
                    senderImg={message.senderImg}
                    senderMessage={message.text}
                    senderName={message.senderName}
                />
            ));

            setUnseenMessages((prev) => [...prev, message]); // pushing it into the prev unseen msgs
        }

        pusherClient.bind('new_message', chatHandler);
        pusherClient.bind('new_friend', newFriendHandler);

        return () => {
            pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:chats`)); // stop listening
            pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:friends`)); 
        }
    }, [pathname, sessionId, router]);

    useEffect(() => {
        if(pathname?.includes('chat')) {
            setUnseenMessages((prev) => {
                return prev?.filter((msg) => !pathname.includes(msg.senderId));
            });
        }
    }, [pathname]);

    return (
        <ul role='list' className='max-h-[25rem] overflow-y-auto -mx-2 space-y-1'>
            {friends.sort().map((friend) => {
                const unseenMessagesCount = unseenMessages.filter((unseenMsg) => {
                    return unseenMsg.senderId === friend.id;
                }).length; // access how many unseen friend msgs we have for that friend

                return (
                    <li key={friend.id}>
                        {/* we are using a link tag instead of a link bc everytime we visit the friend, we want there to be a hard refresh to get the latest msgs this friend has sent */}
                        <a 
                            href={`/dashboard/chat/${chatHrefConstructor(
                                sessionId,
                                friend.id
                            )}`}
                            className='text-gray-700 hover:text-indigo-600 hover:bg-gray-50 group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                        >
                            {friend.name}
                            {unseenMessagesCount > 0 ? (
                                <div className='bg-indigo-600 font-medium text-xs text-white h-4 w-4 rounded-full flex justify-center items-center'>
                                    {unseenMessagesCount}
                                </div>
                            ) : null}
                        </a>
                    </li>
                );
            })}
        </ul>
    );
}

export default SidebarChatList;