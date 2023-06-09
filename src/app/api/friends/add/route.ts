import { fetchRedis } from "@/helpers/redis";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";
import { addFriendValidator } from "@/lib/validations/add-friend";
import { getServerSession } from "next-auth";
import { z } from "zod";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const { email: emailToAdd } = addFriendValidator.parse(body.email);

        const idToAdd = await fetchRedis('get', `user:email:${emailToAdd}`) as string;

        if (!idToAdd) {
            return new Response('This person does not exist.', { status: 400 });
        }

        const session = await getServerSession(authOptions);

        if (!session) {
            return new Response('Unathorized', { status: 401 });
        }

        if (idToAdd === session.user.id) {
            return new Response('You cannot add yourself as a friend', { status: 400 });
        }

        // check if user is already added
        const isAlreadyAdded = (await fetchRedis(
            'sismember', 
            `user:${idToAdd}:incoming_friend_requests`, 
            session.user.id
        )) as 0 | 1;

        if (isAlreadyAdded) {
            return new Response('Already added this user', { status: 400 });
        }

        // check if user is already added
        const isAlreadyFriends = (await fetchRedis(
            'sismember', 
            `user:${session.user.id}:friends`, 
            idToAdd
        )) as 0 | 1;

        if (isAlreadyFriends) {
            return new Response('Already friends with this user', { status: 400 });
        }

        // notify clients they have been added
        pusherServer.trigger(
            toPusherKey(`user:${idToAdd}:incoming_friend_requests`), // channel we are triggering to.
            'incoming_friend_requests', // function name we are triggering 
            { // the data we send along with this request
                senderId: session.user.id,
                senderEmail: session.user.email,
            }
        )

        // if we have all the checks done, valid request, send friend request
        db.sadd(`user:${idToAdd}:incoming_friend_requests`, session.user.id); // the user that is logged in
        // this is going to be put into list of the incoming friend requests of the user they are trying to add

        return new Response('OK');

    } catch (error) {
        if (error instanceof z.ZodError) {
            return new Response('Invalid request payload', { status: 402 });
        }

        return new Response('Invalid request', { status: 400 });
    }
}