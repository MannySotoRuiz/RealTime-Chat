"use client";

import { chatHrefConstructor } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import { FC, useEffect, useState } from 'react'

interface SidebarChatListProps {
    friends: User[]
    sessionId: string
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

export default SidebarChatList