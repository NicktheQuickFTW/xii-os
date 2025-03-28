--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-03-27 19:22:21 CDT

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 27221)
-- Name: claude_contexts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.claude_contexts (
    id integer NOT NULL,
    context_id text NOT NULL,
    content jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.claude_contexts OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 27220)
-- Name: claude_contexts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.claude_contexts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.claude_contexts_id_seq OWNER TO postgres;

--
-- TOC entry 3736 (class 0 OID 0)
-- Dependencies: 221
-- Name: claude_contexts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.claude_contexts_id_seq OWNED BY public.claude_contexts.id;


--
-- TOC entry 220 (class 1259 OID 27214)
-- Name: tennis_matches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tennis_matches (
    id integer NOT NULL,
    team1 character varying(100),
    team2 character varying(100),
    team1_score integer,
    team2_score integer,
    match_date date,
    conference character varying(100)
);


ALTER TABLE public.tennis_matches OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 27213)
-- Name: tennis_matches_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tennis_matches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tennis_matches_id_seq OWNER TO postgres;

--
-- TOC entry 3737 (class 0 OID 0)
-- Dependencies: 219
-- Name: tennis_matches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tennis_matches_id_seq OWNED BY public.tennis_matches.id;


--
-- TOC entry 218 (class 1259 OID 27204)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100),
    email character varying(100)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 27203)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 3738 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3569 (class 2604 OID 27224)
-- Name: claude_contexts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claude_contexts ALTER COLUMN id SET DEFAULT nextval('public.claude_contexts_id_seq'::regclass);


--
-- TOC entry 3568 (class 2604 OID 27217)
-- Name: tennis_matches id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tennis_matches ALTER COLUMN id SET DEFAULT nextval('public.tennis_matches_id_seq'::regclass);


--
-- TOC entry 3567 (class 2604 OID 27207)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 3730 (class 0 OID 27221)
-- Dependencies: 222
-- Data for Name: claude_contexts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.claude_contexts (id, context_id, content, created_at, updated_at) FROM stdin;
1	transfer-portal-analyst	{"system": "\\n    You are an AI assistant specialized in analyzing college sports transfer portal data.\\n    \\n    Your capabilities include:\\n    1. Analyzing basketball and football transfer portal data\\n    2. Identifying trends in transfer patterns\\n    3. Comparing transfer classes across schools\\n    4. Providing insights on NIL valuations\\n    5. Analyzing the impact of transfers on team rosters\\n    \\n    Always provide concise, data-driven responses based on the transfer portal data in the XII-OS system.\\n  ", "messages": []}	2025-03-27 18:06:55.100942-05	2025-03-27 18:06:55.100942-05
\.


--
-- TOC entry 3728 (class 0 OID 27214)
-- Dependencies: 220
-- Data for Name: tennis_matches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tennis_matches (id, team1, team2, team1_score, team2_score, match_date, conference) FROM stdin;
1	UCF	Texas Tech	4	3	2025-03-01	Big 12
2	Test Team1	Test Team2	4	1	2025-03-28	Big 12
3	UCF	Texas Tech	4	3	2025-03-27	Big 12
4	UCF	Texas Tech	4	3	2025-03-27	Big 12
5	UCF	Texas Tech	3	4	2025-03-27	Big 12
6	BYU	Kansas State	4	2	2025-03-27	Big 12
\.


--
-- TOC entry 3726 (class 0 OID 27204)
-- Dependencies: 218
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email) FROM stdin;
1	Test User	test@example.com
\.


--
-- TOC entry 3739 (class 0 OID 0)
-- Dependencies: 221
-- Name: claude_contexts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.claude_contexts_id_seq', 2, true);


--
-- TOC entry 3740 (class 0 OID 0)
-- Dependencies: 219
-- Name: tennis_matches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tennis_matches_id_seq', 6, true);


--
-- TOC entry 3741 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- TOC entry 3577 (class 2606 OID 27232)
-- Name: claude_contexts claude_contexts_context_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claude_contexts
    ADD CONSTRAINT claude_contexts_context_id_key UNIQUE (context_id);


--
-- TOC entry 3579 (class 2606 OID 27230)
-- Name: claude_contexts claude_contexts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claude_contexts
    ADD CONSTRAINT claude_contexts_pkey PRIMARY KEY (id);


--
-- TOC entry 3575 (class 2606 OID 27219)
-- Name: tennis_matches tennis_matches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tennis_matches
    ADD CONSTRAINT tennis_matches_pkey PRIMARY KEY (id);


--
-- TOC entry 3573 (class 2606 OID 27209)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


-- Completed on 2025-03-27 19:22:21 CDT

--
-- PostgreSQL database dump complete
--

