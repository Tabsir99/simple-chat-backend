--
-- PostgreSQL database dump
--

-- Dumped from database version 16.4 (Ubuntu 16.4-1.pgdg22.04+1)
-- Dumped by pg_dump version 16.4 (Ubuntu 16.4-1.pgdg22.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: tabsir2
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO tabsir2;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: tabsir2
--

COMMENT ON SCHEMA public IS '';


--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: ActivityType; Type: TYPE; Schema: public; Owner: tabsir2
--

CREATE TYPE public."ActivityType" AS ENUM (
    'newMessage',
    'friendRequestRejected',
    'friendRequestAccepted',
    'groupMessage'
);


ALTER TYPE public."ActivityType" OWNER TO tabsir2;

--
-- Name: ChatRole; Type: TYPE; Schema: public; Owner: tabsir2
--

CREATE TYPE public."ChatRole" AS ENUM (
    'member',
    'admin'
);


ALTER TYPE public."ChatRole" OWNER TO tabsir2;

--
-- Name: FriendshipStatus; Type: TYPE; Schema: public; Owner: tabsir2
--

CREATE TYPE public."FriendshipStatus" AS ENUM (
    'pending',
    'accepted',
    'blocked'
);


ALTER TYPE public."FriendshipStatus" OWNER TO tabsir2;

--
-- Name: MessageType; Type: TYPE; Schema: public; Owner: tabsir2
--

CREATE TYPE public."MessageType" AS ENUM (
    'text',
    'image',
    'video',
    'audio',
    'file'
);


ALTER TYPE public."MessageType" OWNER TO tabsir2;

--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: tabsir2
--

CREATE TYPE public."UserStatus" AS ENUM (
    'offline',
    'online',
    'away'
);


ALTER TYPE public."UserStatus" OWNER TO tabsir2;

--
-- Name: message_search_vector_update(); Type: FUNCTION; Schema: public; Owner: tabsir2
--

CREATE FUNCTION public.message_search_vector_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'A');
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.message_search_vector_update() OWNER TO tabsir2;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Attachment; Type: TABLE; Schema: public; Owner: tabsir2
--

CREATE TABLE public."Attachment" (
    "attachmentId" uuid NOT NULL,
    "fileUrl" character(500) NOT NULL,
    "createdAt" timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "messageId" uuid NOT NULL
);


ALTER TABLE public."Attachment" OWNER TO tabsir2;

--
-- Name: ChatRoom; Type: TABLE; Schema: public; Owner: tabsir2
--

CREATE TABLE public."ChatRoom" (
    "chatRoomId" uuid NOT NULL,
    "isGroup" boolean DEFAULT false NOT NULL,
    "roomName" character varying(100),
    "createdAt" timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastActivity" timestamp(6) without time zone,
    "lastMessageId" uuid
);


ALTER TABLE public."ChatRoom" OWNER TO tabsir2;

--
-- Name: ChatRoomMember; Type: TABLE; Schema: public; Owner: tabsir2
--

CREATE TABLE public."ChatRoomMember" (
    "chatRoomMemberId" uuid NOT NULL,
    "chatRoomId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    "userRole" public."ChatRole" DEFAULT 'member'::public."ChatRole" NOT NULL,
    "joinedAt" timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "muteUntil" timestamp(6) without time zone,
    "unreadCount" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."ChatRoomMember" OWNER TO tabsir2;

--
-- Name: Friendship; Type: TABLE; Schema: public; Owner: tabsir2
--

CREATE TABLE public."Friendship" (
    "friendshipId" uuid NOT NULL,
    "userId1" uuid NOT NULL,
    "userId2" uuid NOT NULL,
    status public."FriendshipStatus" DEFAULT 'pending'::public."FriendshipStatus" NOT NULL,
    "senderId" uuid NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Friendship" OWNER TO tabsir2;

--
-- Name: Message; Type: TABLE; Schema: public; Owner: tabsir2
--

CREATE TABLE public."Message" (
    "messageId" uuid NOT NULL,
    "chatRoomId" uuid NOT NULL,
    "senderId" uuid NOT NULL,
    content character varying(2000) NOT NULL,
    "parentMessageId" uuid,
    "createdAt" timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    search_vector tsvector
);


ALTER TABLE public."Message" OWNER TO tabsir2;

--
-- Name: MessageReaction; Type: TABLE; Schema: public; Owner: tabsir2
--

CREATE TABLE public."MessageReaction" (
    "messageReactionId" uuid NOT NULL,
    "messageId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    "reactionType" character varying(20) NOT NULL,
    "createdAt" timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MessageReaction" OWNER TO tabsir2;

--
-- Name: MessageReceipt; Type: TABLE; Schema: public; Owner: tabsir2
--

CREATE TABLE public."MessageReceipt" (
    "receiptId" uuid NOT NULL,
    "lastReadMessageId" uuid NOT NULL,
    "chatRoomMemberId" uuid NOT NULL,
    "readAt" timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MessageReceipt" OWNER TO tabsir2;

--
-- Name: RecentActivity; Type: TABLE; Schema: public; Owner: tabsir2
--

CREATE TABLE public."RecentActivity" (
    "recentActivityId" integer NOT NULL,
    "userId" uuid NOT NULL,
    "activityType" public."ActivityType" NOT NULL,
    "chatRoomId" uuid,
    "groupChatId" uuid,
    "targetUserId" uuid,
    description text,
    "createdAt" timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."RecentActivity" OWNER TO tabsir2;

--
-- Name: RecentActivity_recentActivityId_seq; Type: SEQUENCE; Schema: public; Owner: tabsir2
--

CREATE SEQUENCE public."RecentActivity_recentActivityId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."RecentActivity_recentActivityId_seq" OWNER TO tabsir2;

--
-- Name: RecentActivity_recentActivityId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tabsir2
--

ALTER SEQUENCE public."RecentActivity_recentActivityId_seq" OWNED BY public."RecentActivity"."recentActivityId";


--
-- Name: User; Type: TABLE; Schema: public; Owner: tabsir2
--

CREATE TABLE public."User" (
    "userId" uuid NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(200) NOT NULL,
    title character varying(100),
    "createdAt" timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "profilePicture" character varying(250),
    bio character varying(500),
    "lastActive" timestamp(6) without time zone,
    "userStatus" public."UserStatus" DEFAULT 'offline'::public."UserStatus" NOT NULL
);


ALTER TABLE public."User" OWNER TO tabsir2;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: tabsir2
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO tabsir2;

--
-- Name: RecentActivity recentActivityId; Type: DEFAULT; Schema: public; Owner: tabsir2
--

ALTER TABLE ONLY public."RecentActivity" ALTER COLUMN "recentActivityId" SET DEFAULT nextval('public."RecentActivity_recentActivityId_seq"'::regclass);


--
-- Data for Name: Attachment; Type: TABLE DATA; Schema: public; Owner: tabsir2
--

COPY public."Attachment" ("attachmentId", "fileUrl", "createdAt", "messageId") FROM stdin;
\.


--
-- Data for Name: ChatRoom; Type: TABLE DATA; Schema: public; Owner: tabsir2
--

COPY public."ChatRoom" ("chatRoomId", "isGroup", "roomName", "createdAt", "lastActivity", "lastMessageId") FROM stdin;
f47ac10b-58cc-4372-a567-0e02b2c3d479	f	\N	2024-10-09 10:00:00	2024-10-09 15:30:00	3e8bafe5-a3c1-491a-b7d0-caf6124db635
b5f8d450-75d4-4aed-8e38-9e3c7f8b165b	f	\N	2024-10-09 10:30:00	2024-10-09 15:45:00	7f5cd9e9-e8f7-4f1c-bf5e-0e4579f9f078
c6d2a790-3b21-4d37-9a98-5c46c12d503b	t	Friends Group	2024-10-09 11:00:00	2024-10-09 16:00:00	7f5cd9e9-e8f7-4f1c-bf5e-0e457929f078
\.


--
-- Data for Name: ChatRoomMember; Type: TABLE DATA; Schema: public; Owner: tabsir2
--

COPY public."ChatRoomMember" ("chatRoomMemberId", "chatRoomId", "userId", "userRole", "joinedAt", "muteUntil", "unreadCount") FROM stdin;
c6d2a790-3b21-4d37-9a98-5c4dc12d503b	f47ac10b-58cc-4372-a567-0e02b2c3d479	0d3c9ef4-8e11-45f8-a3dc-9b04404bb00b	member	2024-10-09 10:00:00	\N	0
c6d2a790-3b21-4d37-9a98-5c45c12d503b	f47ac10b-58cc-4372-a567-0e02b2c3d479	5935f4ce-7be1-45b6-aea8-a700b0823b54	member	2024-10-09 10:00:00	\N	3
a6d2a790-3b21-4d37-9a98-5c46c12d503b	b5f8d450-75d4-4aed-8e38-9e3c7f8b165b	0d3c9ef4-8e11-45f8-a3dc-9b04404bb00b	member	2024-10-09 10:30:00	\N	2
d6d2a790-3b21-4d37-9a98-5c46c12d503b	b5f8d450-75d4-4aed-8e38-9e3c7f8b165b	742161ae-7f60-4ce3-af98-e62416818f5a	member	2024-10-09 10:30:00	\N	0
c642a790-3b21-4d37-9a98-5c46c12d503b	c6d2a790-3b21-4d37-9a98-5c46c12d503b	0d3c9ef4-8e11-45f8-a3dc-9b04404bb00b	admin	2024-10-09 11:00:00	\N	0
c6d2b790-3b21-4d37-9a98-5c46c12d503b	c6d2a790-3b21-4d37-9a98-5c46c12d503b	5935f4ce-7be1-45b6-aea8-a700b0823b54	member	2024-10-09 11:00:00	\N	5
c6d6a790-3b21-4d37-9a98-5c46c12d503b	c6d2a790-3b21-4d37-9a98-5c46c12d503b	742161ae-7f60-4ce3-af98-e62416818f5a	member	2024-10-09 11:00:00	\N	2
\.


--
-- Data for Name: Friendship; Type: TABLE DATA; Schema: public; Owner: tabsir2
--

COPY public."Friendship" ("friendshipId", "userId1", "userId2", status, "senderId", "createdAt") FROM stdin;
839bc345-753f-4b6f-af7a-0dffc9ef32d7	5935f4ce-7be1-45b6-aea8-a700b0823b54	742161ae-7f60-4ce3-af98-e62416818f5a	accepted	742161ae-7f60-4ce3-af98-e62416818f5a	2024-10-09 15:10:15.483
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: tabsir2
--

COPY public."Message" ("messageId", "chatRoomId", "senderId", content, "parentMessageId", "createdAt", "isRead", "isDeleted", search_vector) FROM stdin;
0a2e9bb2-5318-4da9-9bfc-9e86e19f5c6a	f47ac10b-58cc-4372-a567-0e02b2c3d479	0d3c9ef4-8e11-45f8-a3dc-9b04404bb00b	Hey, how are you?	\N	2024-10-09 10:15:00	t	f	'hey':1A
0b9d8cc4-564a-4ae7-9b4e-c6e0f8916fc5	f47ac10b-58cc-4372-a567-0e02b2c3d479	5935f4ce-7be1-45b6-aea8-a700b0823b54	I'm good, thanks! Just finished my project	\N	2024-10-09 10:20:00	t	f	'finish':6A 'good':3A 'm':2A 'project':8A 'thank':4A
1c6f8dd3-7a8f-4e18-951d-a8f5d32bc915	f47ac10b-58cc-4372-a567-0e02b2c3d479	0d3c9ef4-8e11-45f8-a3dc-9b04404bb00b	That's great! How long did it take?	\N	2024-10-09 10:25:00	t	f	'great':3A 'long':5A 'take':8A
2d7a9ee4-92b0-4819-97c9-b9f5e23fc025	f47ac10b-58cc-4372-a567-0e02b2c3d479	5935f4ce-7be1-45b6-aea8-a700b0823b54	About two weeks. It was quite challenging!	\N	2024-10-09 10:30:00	f	f	'challeng':7A 'quit':6A 'two':2A 'week':3A
3e8bafe5-a3c1-491a-b7d0-caf6124db635	f47ac10b-58cc-4372-a567-0e02b2c3d479	5935f4ce-7be1-45b6-aea8-a700b0823b54	Would you like to see the demo?	\N	2024-10-09 15:30:00	f	f	'demo':7A 'like':3A 'see':5A 'would':1A
4f9cb0e6-b4d2-4a19-b8e1-dbfe35fcf045	b5f8d450-75d4-4aed-8e38-9e3c7f8b165b	0d3c9ef4-8e11-45f8-a3dc-9b04404bb00b	Did you see the latest update?	\N	2024-10-09 11:00:00	t	f	'latest':5A 'see':3A 'updat':6A
5f1ab7d7-c6f3-4e0a-9a2f-ed2345f7f056	b5f8d450-75d4-4aed-8e38-9e3c7f8b165b	742161ae-7f60-4ce3-af98-e62416818f5a	Yes, the new features are amazing!	\N	2024-10-09 11:05:00	t	f	'amaz':6A 'featur':4A 'new':3A 'yes':1A
6f3bc8d8-d7f5-4f0b-ae4f-fe3467e8f067	b5f8d450-75d4-4aed-8e38-9e3c7f8b165b	0d3c9ef4-8e11-45f8-a3dc-9b04404bb00b	The performance improvements are significant	\N	2024-10-09 11:10:00	t	f	'improv':3A 'perform':2A 'signific':5A
7f5cd9e9-e8f7-4f1c-bf5e-0e4579f9f078	b5f8d450-75d4-4aed-8e38-9e3c7f8b165b	742161ae-7f60-4ce3-af98-e62416818f5a	I think this will make our workflow smoother	\N	2024-10-09 15:45:00	f	f	'make':5A 'smoother':8A 'think':2A 'workflow':7A
7f5cd9e9-e8f7-4f1c-bf5e-0e4579c9f078	c6d2a790-3b21-4d37-9a98-5c46c12d503b	0d3c9ef4-8e11-45f8-a3dc-9b04404bb00b	Hello everyone! Let’s plan for the weekend.	\N	2024-10-09 11:20:00	t	f	'everyon':2A 'hello':1A 'let':3A 'plan':5A 'weekend':8A
7f5cd9e9-e8f7-4f1c-bf5e-0e4579a9f078	c6d2a790-3b21-4d37-9a98-5c46c12d503b	5935f4ce-7be1-45b6-aea8-a700b0823b54	Sounds good! I’m free on Saturday.	\N	2024-10-09 11:25:00	t	f	'free':5A 'good':2A 'm':4A 'saturday':7A 'sound':1A
7f5cd9e9-e8f7-4f1c-bf5e-0e4579d9f078	c6d2a790-3b21-4d37-9a98-5c46c12d503b	742161ae-7f60-4ce3-af98-e62416818f5a	Same here! Let’s meet in the afternoon	\N	2024-10-09 11:30:00	t	f	'afternoon':8A 'let':3A 'meet':5A
7f5cd9e9-e8f7-4f1c-bf5e-0e457929f078	c6d2a790-3b21-4d37-9a98-5c46c12d503b	0d3c9ef4-8e11-45f8-a3dc-9b04404bb00b	Great! I’ll book a place.	\N	2024-10-09 16:00:00	f	f	'book':4A 'great':1A 'll':3A 'place':6A
\.


--
-- Data for Name: MessageReaction; Type: TABLE DATA; Schema: public; Owner: tabsir2
--

COPY public."MessageReaction" ("messageReactionId", "messageId", "userId", "reactionType", "createdAt") FROM stdin;
\.


--
-- Data for Name: MessageReceipt; Type: TABLE DATA; Schema: public; Owner: tabsir2
--

COPY public."MessageReceipt" ("receiptId", "lastReadMessageId", "chatRoomMemberId", "readAt") FROM stdin;
88991122-3344-5566-7788-990011223344	2d7a9ee4-92b0-4819-97c9-b9f5e23fc025	c6d2a790-3b21-4d37-9a98-5c4dc12d503b	2024-10-09 10:25:00
99001122-3344-5566-7788-990011223355	3e8bafe5-a3c1-491a-b7d0-caf6124db635	c6d2a790-3b21-4d37-9a98-5c45c12d503b	2024-10-09 11:10:00
00112233-4455-6677-8899-001122334466	7f5cd9e9-e8f7-4f1c-bf5e-0e4579f9f078	a6d2a790-3b21-4d37-9a98-5c46c12d503b	2024-10-09 14:00:00
11223344-5566-7788-9900-112233445577	7f5cd9e9-e8f7-4f1c-bf5e-0e4579f9f078	d6d2a790-3b21-4d37-9a98-5c46c12d503b	2024-10-09 15:45:00
22334455-6677-8899-0011-223344556688	7f5cd9e9-e8f7-4f1c-bf5e-0e4579d9f078	c642a790-3b21-4d37-9a98-5c46c12d503b	2024-10-09 14:00:00
33445566-7788-9900-1122-334455667799	7f5cd9e9-e8f7-4f1c-bf5e-0e457929f078	c6d2b790-3b21-4d37-9a98-5c46c12d503b	2024-10-09 13:00:00
33445566-7788-9900-1122-334455669799	7f5cd9e9-e8f7-4f1c-bf5e-0e457929f078	c6d6a790-3b21-4d37-9a98-5c46c12d503b	2024-10-09 13:00:00
\.


--
-- Data for Name: RecentActivity; Type: TABLE DATA; Schema: public; Owner: tabsir2
--

COPY public."RecentActivity" ("recentActivityId", "userId", "activityType", "chatRoomId", "groupChatId", "targetUserId", description, "createdAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: tabsir2
--

COPY public."User" ("userId", username, email, title, "createdAt", "profilePicture", bio, "lastActive", "userStatus") FROM stdin;
5935f4ce-7be1-45b6-aea8-a700b0823b54	tabsirsfc	tabsirsfc@gmail.com	\N	2024-10-09 05:54:40.621	\N	\N	\N	online
742161ae-7f60-4ce3-af98-e62416818f5a	tabsir348	tabsir348@gmail.com	\N	2024-10-09 05:50:56.159	\N	\N	\N	online
0d3c9ef4-8e11-45f8-a3dc-9b04404bb00b	mdtabsir0021	mdtabsir0021@gmail.com	\N	2024-10-09 09:44:38.818	\N	\N	\N	offline
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: tabsir2
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
8a1e49b8-319a-4643-a683-014651d73ae7	b9f58a0069576d185534a6c81e92e934b6573985a0443cc8d39e01cc9c6fd5ee	2024-10-09 10:59:08.090845+06	20241009045857_init	\N	\N	2024-10-09 10:59:07.945496+06	1
custom_20240929_full_text_search.sql	13269d1e760e2c9bad444a12958e4d74	2024-10-09 10:59:10.575+06	20240929_full_text_search.sql	\N	\N	2024-10-09 10:59:10.575+06	1
\.


--
-- Name: RecentActivity_recentActivityId_seq; Type: SEQUENCE SET; Schema: public; Owner: tabsir2
--

SELECT pg_catalog.setval('public."RecentActivity_recentActivityId_seq"', 1, false);


--
-- Name: Attachment Attachment_pkey; Type: CONSTRAINT; Schema: public; Owner: tabsir2
--

ALTER TABLE ONLY public."Attachment"
    ADD CONSTRAINT "Attachment_pkey" PRIMARY KEY ("attachmentId");


--
-- Name: ChatRoomMember ChatRoomMember_pkey; Type: CONSTRAINT; Schema: public; Owner: tabsir2
--

ALTER TABLE ONLY public."ChatRoomMember"
    ADD CONSTRAINT "ChatRoomMember_pkey" PRIMARY KEY ("chatRoomMemberId");


--
-- Name: ChatRoom ChatRoom_pkey; Type: CONSTRAINT; Schema: public; Owner: tabsir2
--

ALTER TABLE ONLY public."ChatRoom"
    ADD CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("chatRoomId");


--
-- Name: Friendship Friendship_pkey; Type: CONSTRAINT; Schema: public; Owner: tabsir2
--

ALTER TABLE ONLY public."Friendship"
    ADD CONSTRAINT "Friendship_pkey" PRIMARY KEY ("friendshipId");


--
-- Name: MessageReaction MessageReaction_pkey; Type: CONSTRAINT; Schema: public; Owner: tabsir2
--

ALTER TABLE ONLY public."MessageReaction"
    ADD CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("messageReactionId");


--
-- Name: MessageReceipt MessageReceipt_pkey; Type: CONSTRAINT; Schema: public; Owner: tabsir2
--

ALTER TABLE ONLY public."MessageReceipt"
    ADD CONSTRAINT "MessageReceipt_pkey" PRIMARY KEY ("receiptId");


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: tabsir2
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY ("messageId");


--
-- Name: RecentActivity RecentActivity_pkey; Type: CONSTRAINT; Schema: public; Owner: tabsir2
--

ALTER TABLE ONLY public."RecentActivity"
    ADD CONSTRAINT "RecentActivity_pkey" PRIMARY KEY ("recentActivityId");


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: tabsir2
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY ("userId");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: tabsir2
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Attachment_messageId_idx; Type: INDEX; Schema: public; Owner: tabsir2
--

CREATE INDEX "Attachment_messageId_idx" ON public."Attachment" USING btree ("messageId");


--
-- Name: ChatRoomMember_chatRoomId_idx; Type: INDEX; Schema: public; Owner: tabsir2
--

CREATE INDEX "ChatRoomMember_chatRoomId_idx" ON public."ChatRoomMember" USING btree ("chatRoomId");


--
-- Name: ChatRoomMember_chatRoomId_userId_key; Type: INDEX; Schema: public; Owner: tabsir2
--

CREATE UNIQUE INDEX "ChatRoomMember_chatRoomId_userId_key" ON public."ChatRoomMember" USING btree ("chatRoomId", "userId");


--
-- Name: ChatRoomMember_muteUntil_idx; Type: INDEX; Schema: public; Owner: tabsir2
--

CREATE INDEX "ChatRoomMember_muteUntil_idx" ON public."ChatRoomMember" USING btree ("muteUntil");


--
-- Name: ChatRoomMember_userId_idx; Type: INDEX; Schema: public; Owner: tabsir2
--

CREATE INDEX "ChatRoomMember_userId_idx" ON public."ChatRoomMember" USING btree ("userId");


--
-- Name: ChatRoom_lastActivity_idx; Type: INDEX; Schema: public; Owner: tabsir2
--

CREATE INDEX "ChatRoom_lastActivity_idx" ON public."ChatRoom" USING btree ("lastActivity");


--
-- Name: Friendship_userId1_userId2_key; Type: INDEX; Schema: public; Owner: tabsir2
--

CREATE UNIQUE INDEX "Friendship_userId1_userId2_key" ON public."Friendship" USING btree ("userId1", "userId2");


--
-- Name: MessageReaction_messageId_idx; Type: INDEX; Schema: public; Owner: tabsir2
--

CREATE INDEX "MessageReaction_messageId_idx" ON public."MessageReaction" USING btree ("messageId");


--
-- Name: MessageReaction_messageId_userId_reactionType_key; Type: INDEX; Schema: public; Owner: tabsir2
--

CREATE UNIQUE INDEX "MessageReaction_messageId_userId_reactionType_key" ON public."MessageReaction" USING btree ("messageId", "userId", "reactionType");


--
-- Name: MessageReaction_userId_idx; Type: INDEX; Schema: public; Owner: tabsir2
--

CREATE INDEX "MessageReaction_userId_idx" ON public."MessageReaction" USING btree ("userId");


--
-- Name: MessageReceipt_lastReadMessageId_chatRoomMemberId_key; Type: INDEX; Schema: public; Owner: tabsir2
--

CREATE UNIQUE INDEX "MessageReceipt_lastReadMessageId_chatRoomMemberId_key" ON public."MessageReceipt" USING btree ("lastReadMessageId", "chatRoomMemberId");


--
-- Name: MessageReceipt_readAt_idx; Type: INDEX; Schema: public; Owner: tabsir2
--

CREATE INDEX "MessageReceipt_readAt_idx" ON public."MessageReceipt" USING btree ("readAt");


--
-- Name: RecentActivity_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: tabsir2
--

CREATE INDEX "RecentActivity_userId_createdAt_idx" ON public."RecentActivity" USING btree ("userId", "createdAt");


--
-- Name: User_email_idx; Type: INDEX; Schema: public; Owner: tabsir2
--

CREATE INDEX "User_email_idx" ON public."User" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: tabsir2
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_lastActive_idx; Type: INDEX; Schema: public; Owner: tabsir2
--

CREATE INDEX "User_lastActive_idx" ON public."User" USING btree ("lastActive");


--
-- Name: idx_username_trgm; Type: INDEX; Schema: public; Owner: tabsir2
--

CREATE INDEX idx_username_trgm ON public."User" USING gin (username public.gin_trgm_ops);


--
-- Name: message_search_idx; Type: INDEX; Schema: public; Owner: tabsir2
--

CREATE INDEX message_search_idx ON public."Message" USING gin (search_vector);


--
-- Name: Message message_search_vector_update; Type: TRIGGER; Schema: public; Owner: tabsir2
--

CREATE TRIGGER message_search_vector_update BEFORE INSERT OR UPDATE ON public."Message" FOR EACH ROW EXECUTE FUNCTION public.message_search_vector_update();


--
-- Name: Attachment Attachment_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tabsir2
--

ALTER TABLE ONLY public."Attachment"
    ADD CONSTRAINT "Attachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public."Message"("messageId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChatRoomMember ChatRoomMember_chatRoomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tabsir2
--

ALTER TABLE ONLY public."ChatRoomMember"
    ADD CONSTRAINT "ChatRoomMember_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES public."ChatRoom"("chatRoomId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChatRoomMember ChatRoomMember_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tabsir2
--

ALTER TABLE ONLY public."ChatRoomMember"
    ADD CONSTRAINT "ChatRoomMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"("userId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChatRoom ChatRoom_lastMessageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tabsir2
--

ALTER TABLE ONLY public."ChatRoom"
    ADD CONSTRAINT "ChatRoom_lastMessageId_fkey" FOREIGN KEY ("lastMessageId") REFERENCES public."Message"("messageId") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Friendship Friendship_userId1_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tabsir2
--

ALTER TABLE ONLY public."Friendship"
    ADD CONSTRAINT "Friendship_userId1_fkey" FOREIGN KEY ("userId1") REFERENCES public."User"("userId") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Friendship Friendship_userId2_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tabsir2
--

ALTER TABLE ONLY public."Friendship"
    ADD CONSTRAINT "Friendship_userId2_fkey" FOREIGN KEY ("userId2") REFERENCES public."User"("userId") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MessageReaction MessageReaction_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tabsir2
--

ALTER TABLE ONLY public."MessageReaction"
    ADD CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public."Message"("messageId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MessageReaction MessageReaction_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tabsir2
--

ALTER TABLE ONLY public."MessageReaction"
    ADD CONSTRAINT "MessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"("userId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MessageReceipt MessageReceipt_chatRoomMemberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tabsir2
--

ALTER TABLE ONLY public."MessageReceipt"
    ADD CONSTRAINT "MessageReceipt_chatRoomMemberId_fkey" FOREIGN KEY ("chatRoomMemberId") REFERENCES public."ChatRoomMember"("chatRoomMemberId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MessageReceipt MessageReceipt_lastReadMessageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tabsir2
--

ALTER TABLE ONLY public."MessageReceipt"
    ADD CONSTRAINT "MessageReceipt_lastReadMessageId_fkey" FOREIGN KEY ("lastReadMessageId") REFERENCES public."Message"("messageId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_chatRoomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tabsir2
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES public."ChatRoom"("chatRoomId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_parentMessageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tabsir2
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_parentMessageId_fkey" FOREIGN KEY ("parentMessageId") REFERENCES public."Message"("messageId") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Message Message_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tabsir2
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"("userId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RecentActivity RecentActivity_chatRoomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tabsir2
--

ALTER TABLE ONLY public."RecentActivity"
    ADD CONSTRAINT "RecentActivity_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES public."ChatRoom"("chatRoomId") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RecentActivity RecentActivity_groupChatId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tabsir2
--

ALTER TABLE ONLY public."RecentActivity"
    ADD CONSTRAINT "RecentActivity_groupChatId_fkey" FOREIGN KEY ("groupChatId") REFERENCES public."ChatRoom"("chatRoomId") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RecentActivity RecentActivity_targetUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tabsir2
--

ALTER TABLE ONLY public."RecentActivity"
    ADD CONSTRAINT "RecentActivity_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES public."User"("userId") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RecentActivity RecentActivity_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tabsir2
--

ALTER TABLE ONLY public."RecentActivity"
    ADD CONSTRAINT "RecentActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"("userId") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: tabsir2
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

