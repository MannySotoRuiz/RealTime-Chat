import { fetchRedis } from "./redis"

export const getFriendsByUserId = async (userId: string) => {
    // retrieve friends for current user
    const friendIds = await fetchRedis(
        'smembers',
        `user:${userId}:friends`
    ) as string[];

    // calls everything in here simultaneously since
    // so we pass it an array of promises and all of them are called at the same time
    // bc they dont depend on each other
    // so if we fetch one friend id, at the same time, it can fetch another bc it doenst need to fetch one before fetching the other
    // speeds up the process by querying all the friends simultaneously
    const friends = await Promise.all(
        friendIds.map(async (friendId) => {
            const friend = await fetchRedis(
                'get',
                `user:${friendId}`
            ) as User;
            return friend;
        })
    )

    return friends;
}