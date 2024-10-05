import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  const userCount = 50;
  const chatRoomCount = 20;
  const messageCount = 200;

  // Create Users
  const users = await Promise.all(
    Array.from({ length: userCount }).map(async () => {
      return prisma.user.create({
        data: {
          username: faker.internet.userName(),
          email: faker.internet.email(),
          title: faker.name.jobTitle(),
          profilePicture: faker.image.avatar(),
          bio: faker.lorem.sentence(),
          lastActive: faker.date.recent(),
          userStatus: faker.helpers.arrayElement(['offline', 'online', 'away']),
        },
      });
    })
  );

  // Create ChatRooms
  const chatRooms = await Promise.all(
    Array.from({ length: chatRoomCount }).map(async () => {
      const isGroup = faker.datatype.boolean();
      return prisma.chatRoom.create({
        data: {
          isGroup,
          roomName: isGroup ? faker.word.noun() + ' Group' : null,
          lastActivity: faker.date.recent(),
        },
      });
    })
  );

  // Create ChatRoomMembers
  for (const chatRoom of chatRooms) {
    const memberCount = chatRoom.isGroup ? faker.number.int({ min: 3, max: 10 }) : 2;
    const members = faker.helpers.arrayElements(users, memberCount);

    await Promise.all(
      members.map(async (user, index) => {
        return prisma.chatRoomMember.create({
          data: {
            chatRoomId: chatRoom.chatRoomId,
            userId: user.userId,
            userRole: index === 0 ? 'admin' : 'member',
            joinedAt: faker.date.past(),
            unreadCount: faker.number.int({ min: 0, max: 20 }),
          },
        });
      })
    );
  }

  // Create Messages
  for (let i = 0; i < messageCount; i++) {
    const chatRoom = faker.helpers.arrayElement(chatRooms);
    const members = await prisma.chatRoomMember.findMany({
      where: { chatRoomId: chatRoom.chatRoomId },
      include: { user: true },
    });
    const sender = faker.helpers.arrayElement(members);

    const message = await prisma.message.create({
      data: {
        chatRoomId: chatRoom.chatRoomId,
        senderId: sender.userId,
        content: faker.lorem.sentence(),
        createdAt: faker.date.recent(),
        isRead: faker.datatype.boolean(),
      },
    });

    // Update lastMessage for ChatRoom
    await prisma.chatRoom.update({
      where: { chatRoomId: chatRoom.chatRoomId },
      data: { lastMessageId: message.messageId },
    });

    // Create MessageReceipts
    await Promise.all(
      members
        .filter((member) => member.userId !== sender.userId)
        .map(async (member) => {
          return prisma.messageReceipt.create({
            data: {
              messageId: message.messageId,
              userId: member.userId,
              readAt: faker.date.recent(),
            },
          });
        })
    );

    // Randomly create MessageReactions
    if (faker.datatype.boolean()) {
      const reactionCount = faker.number.int({ min: 1, max: 3 });
      await Promise.all(
        faker.helpers.arrayElements(members, reactionCount).map(async (member) => {
          return prisma.messageReaction.create({
            data: {
              messageId: message.messageId,
              userId: member.userId,
              reactionType: faker.helpers.arrayElement(['like', 'love', 'laugh', 'wow', 'sad', 'angry']),
            },
          });
        })
      );
    }
  }

  // Create Friendships
  for (const user of users) {
    const friendCount = faker.number.int({ min: 1, max: 10 });
    const friends = faker.helpers.arrayElements(
      users.filter((u) => u.userId !== user.userId),
      friendCount
    );

    await Promise.all(
      friends.map(async (friend) => {
        return prisma.friendship.create({
          data: {
            userId1: user.userId,
            userId2: friend.userId,
            status: faker.helpers.arrayElement(['pending', 'accepted', 'blocked']),
            senderId: faker.helpers.arrayElement([user.userId, friend.userId]),
          },
        });
      })
    );
  }

  // Create RecentActivities
  for (const user of users) {
    const activityCount = faker.number.int({ min: 1, max: 5 });
    await Promise.all(
      Array.from({ length: activityCount }).map(async () => {
        const activityType = faker.helpers.arrayElement([
          'newMessage',
          'friendRequestRejected',
          'friendRequestAccepted',
          'groupMessage',
        ]);

        let chatRoomId, groupChatId, targetUserId;

        if (activityType === 'newMessage' || activityType === 'groupMessage') {
          const chatRoom = faker.helpers.arrayElement(chatRooms);
          if (chatRoom.isGroup) {
            groupChatId = chatRoom.chatRoomId;
          } else {
            chatRoomId = chatRoom.chatRoomId;
          }
        } else {
          targetUserId = faker.helpers.arrayElement(users.filter((u) => u.userId !== user.userId)).userId;
        }

        return prisma.recentActivity.create({
          data: {
            userId: user.userId,
            activityType,
            chatRoomId,
            groupChatId,
            targetUserId,
            description: faker.lorem.sentence(),
            createdAt: faker.date.recent(),
          },
        });
      })
    );
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });