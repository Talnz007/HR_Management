--
-- PostgreSQL database dump
--

\restrict v8O6RyX3fpgTJRqbISGgRCz3vUBDlkBjEfn7KSrbE7Ntg52dMtgzl3cuvOXAdvz

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

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
-- Name: attendance_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.attendance_type AS ENUM (
    'present',
    'absent',
    'late'
);


ALTER TYPE public.attendance_type OWNER TO postgres;

--
-- Name: chat_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.chat_status AS ENUM (
    'active',
    'closed',
    'escalated'
);


ALTER TYPE public.chat_status OWNER TO postgres;

--
-- Name: employee_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.employee_status AS ENUM (
    'active',
    'inactive',
    'terminated'
);


ALTER TYPE public.employee_status OWNER TO postgres;

--
-- Name: employment_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.employment_type AS ENUM (
    'full_time',
    'part_time',
    'contract',
    'intern'
);


ALTER TYPE public.employment_type OWNER TO postgres;

--
-- Name: leave_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.leave_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public.leave_status OWNER TO postgres;

--
-- Name: leave_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.leave_type AS ENUM (
    'vacation',
    'sick',
    'personal',
    'unpaid'
);


ALTER TYPE public.leave_type OWNER TO postgres;

--
-- Name: message_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.message_type AS ENUM (
    'text',
    'system',
    'temp_password',
    'file'
);


ALTER TYPE public.message_type OWNER TO postgres;

--
-- Name: schema_change_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.schema_change_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public.schema_change_status OWNER TO postgres;

--
-- Name: schema_change_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.schema_change_type AS ENUM (
    'create_table',
    'create_column'
);


ALTER TYPE public.schema_change_type OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    admin_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- Name: attendances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendances (
    attendance_id uuid DEFAULT gen_random_uuid() NOT NULL,
    date date NOT NULL,
    clock_in time without time zone,
    clock_out time without time zone,
    break_start time without time zone,
    break_end time without time zone,
    attendance_type public.attendance_type NOT NULL,
    total_hours double precision,
    overtime_hours double precision,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone,
    user_id uuid NOT NULL
);


ALTER TABLE public.attendances OWNER TO postgres;

--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chat_session_id uuid NOT NULL,
    sender_id uuid,
    message_type public.message_type,
    content text NOT NULL,
    is_encrypted boolean,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone
);


ALTER TABLE public.chat_messages OWNER TO postgres;

--
-- Name: chat_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    password_reset_request_id uuid,
    employee_id uuid NOT NULL,
    admin_id uuid,
    status public.chat_status,
    created_at timestamp with time zone DEFAULT now(),
    closed_at timestamp with time zone,
    last_activity_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.chat_sessions OWNER TO postgres;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    department_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    employee_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    employee_number character varying(20) NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    date_of_birth date NOT NULL,
    phone character varying(20) NOT NULL,
    hire_date date NOT NULL,
    job_title character varying(100) NOT NULL,
    department_id uuid NOT NULL,
    employment_type public.employment_type NOT NULL,
    status public.employee_status NOT NULL,
    salary numeric(10,2),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    middle_name character varying(50),
    updated_at timestamp with time zone,
    manager_id uuid
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- Name: leaves; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leaves (
    leave_id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid NOT NULL,
    leave_type public.leave_type NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status public.leave_status NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone
);


ALTER TABLE public.leaves OWNER TO postgres;

--
-- Name: password_reset_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone,
    admin_id uuid,
    request_reason text,
    CONSTRAINT valid_status CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'resolved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.password_reset_requests OWNER TO postgres;

--
-- Name: payrolls; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payrolls (
    payroll_id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    base_salary double precision NOT NULL,
    overtime_pay double precision,
    deductions double precision,
    net_pay double precision NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone
);


ALTER TABLE public.payrolls OWNER TO postgres;

--
-- Name: registrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.registrations (
    registration_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone
);


ALTER TABLE public.registrations OWNER TO postgres;

--
-- Name: schema_change_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schema_change_requests (
    request_id uuid DEFAULT gen_random_uuid() NOT NULL,
    change_type public.schema_change_type NOT NULL,
    target_table character varying(100) NOT NULL,
    change_details json NOT NULL,
    requested_by uuid NOT NULL,
    approved_by uuid,
    status public.schema_change_status DEFAULT 'pending'::public.schema_change_status NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone
);


ALTER TABLE public.schema_change_requests OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id uuid DEFAULT gen_random_uuid() NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    phone character varying(20) NOT NULL,
    password_hash character varying(255) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone,
    last_login timestamp with time zone,
    must_change_password boolean DEFAULT false,
    profile_picture_key character varying(255)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins (admin_id, user_id, created_at, updated_at) FROM stdin;
b8b64687-c542-4e81-be17-c45114ce591e	b5e3e7b2-fd6c-467c-88ec-7a732a7d5db9	2025-07-22 15:08:13.987474+05	\N
83290bcf-24e6-489f-ad0e-bb23a36f32f1	cd64e920-7174-4bd3-b4cc-9e138a92715d	2025-07-22 15:08:14.91212+05	\N
b7b4333a-839d-47e6-baa1-f8c2b0cdb2c9	cb6106e5-646c-4e58-a28c-450adc8bdb35	2025-07-22 15:08:15.730474+05	\N
772842bf-d712-4925-9882-5bdcc62fe62b	cc01ae26-559b-4470-9054-fffb2329c384	2025-07-22 15:08:16.560079+05	\N
83dfbb8f-1c8e-49aa-8bde-e6cde5bc315a	69d74987-cbad-4e92-9167-ccfafde71ab5	2025-07-22 15:08:37.066386+05	\N
e7c36c03-c63e-4ab5-895b-71901a2fe3a9	ed0dfec9-e977-4031-b805-7dafe6448547	2025-07-22 15:08:37.915936+05	\N
25e055fa-2143-4a7f-8f59-fe40af5f30e7	923c56e9-ed27-4128-bcd7-72b9fd0b7dfe	2025-07-22 15:11:10.561967+05	\N
b4b2562d-7e81-4f87-bb8a-8d734f4c3623	ec7c450f-b525-49fc-a9ff-2119af4f7b86	2025-07-22 15:11:11.43089+05	\N
af4cebe0-3d66-42b3-929e-db5940960d1c	3a91696c-6095-4920-8639-0974a55867e1	2025-07-22 15:11:12.353229+05	\N
435ee9b3-1f39-407b-97f0-c10621e1f81f	f2c243bd-3c59-4df7-a595-30a89344378f	2025-07-22 15:11:13.155432+05	\N
264fcbad-517a-4481-8081-e4fb50c6604f	197932db-d679-4c4f-bac0-720a480c801a	2025-07-22 15:38:44.675955+05	\N
cccd8553-88f0-4eff-a394-588bf91866fa	c41866fb-4f89-45aa-97af-833ae1ec9627	2025-07-22 15:38:45.63513+05	\N
6506c0f1-405e-4357-b6f1-abff199c63ff	77bd5dab-3eb9-4eda-9306-2b5ab1519042	2025-07-22 15:38:46.544434+05	\N
04f91c86-539c-4a30-bae6-c7a60f438942	8f4fcc52-1ba2-4481-9dff-450df1e76dc4	2025-07-22 15:38:47.373629+05	\N
\.


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alembic_version (version_num) FROM stdin;
af7cb86e9d7e
\.


--
-- Data for Name: attendances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendances (attendance_id, date, clock_in, clock_out, break_start, break_end, attendance_type, total_hours, overtime_hours, created_at, updated_at, user_id) FROM stdin;
869646c9-23b1-4c4c-8e63-96d9f7a06c63	2025-07-23	09:00:00	17:00:00	13:00:00	14:00:00	present	7	0	2025-07-23 12:26:53.828777+05	\N	054cbace-5bcf-4e8d-973b-caa852ebca65
e5f80969-b8f2-403c-9d85-8220f0250ad1	2025-07-24	09:00:00	17:00:00	13:00:00	14:00:00	present	8	0	2025-07-23 15:13:21.675598+05	\N	054cbace-5bcf-4e8d-973b-caa852ebca65
7ee38436-56f3-4e6d-b4e7-10d83b29fea4	2025-07-25	11:00:59.096477	11:01:14.45002	\N	\N	present	0.004166666666666667	0	2025-07-25 16:00:59.096492+05	2025-07-25 16:01:14.450057+05	ec7c450f-b525-49fc-a9ff-2119af4f7b86
0f10d17b-bd8e-4659-9982-cbb66e58ce80	2025-07-28	10:52:31	11:26:21	11:08:58	11:10:12	present	0.5433333333333333	0	2025-07-28 10:52:31+05	2025-07-28 11:26:21+05	197932db-d679-4c4f-bac0-720a480c801a
c5796ffe-2fa1-4a28-b474-aced70564e4d	2025-07-30	12:11:07	12:24:35	12:23:52	12:24:14	present	0.21833333333333332	0	2025-07-30 12:11:07+05	2025-07-30 12:24:35+05	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1
561c7053-0311-45b8-ac0f-ad4b6ce4b7d7	2025-07-31	09:25:44	09:26:39	09:26:05	09:26:39	present	0.005833333333333334	0	2025-07-31 09:25:44+05	2025-07-31 09:26:39+05	da11c730-751f-458e-a351-bf2040173eab
e15c8928-26f9-4af0-8fa7-dd23e27350aa	2025-07-31	09:40:26	10:55:20	09:42:04	10:55:12	present	0.029444444444444443	0	2025-07-31 09:40:26+05	2025-07-31 10:55:20+05	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1
72166124-e9dd-4c31-9d82-5206d147aede	2025-08-01	10:15:16	10:15:38	10:15:27	10:15:30	present	0.005277777777777778	0	2025-08-01 10:15:16+05	2025-08-01 10:15:38+05	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1
4575edf9-4816-482d-85a1-94fdc4faa703	2025-08-05	09:00:23	09:00:34	\N	\N	present	0.0030555555555555557	0	2025-08-05 09:00:23+05	2025-08-05 09:00:34+05	da11c730-751f-458e-a351-bf2040173eab
0fef28e3-68ee-4095-b865-70d0e3f1e697	2025-08-05	09:22:28	\N	\N	\N	present	\N	\N	2025-08-05 09:22:28+05	\N	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1
ece0272d-0f98-4a13-a4ad-7c6420bd365e	2025-08-06	11:15:34	\N	\N	\N	present	\N	\N	2025-08-06 11:15:34+05	\N	da11c730-751f-458e-a351-bf2040173eab
fc6223df-646e-41f8-a3ed-1e67d957d229	2025-08-06	11:23:26	\N	\N	\N	present	\N	\N	2025-08-06 11:23:26+05	\N	bfa58084-b9ee-4332-aeb9-69d7f913f3f5
d5b8ce1f-7d0f-423d-a9a4-e57ed2a8bfde	2025-08-06	16:05:06	16:05:26	16:05:09	16:05:18	present	0.0030555555555555557	0	2025-08-06 16:05:06+05	2025-08-06 16:05:26+05	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_messages (id, chat_session_id, sender_id, message_type, content, is_encrypted, read_at, created_at, expires_at) FROM stdin;
30ef5507-6bbc-4d62-bbb5-3a1be6f65dd3	daa07699-7f29-45a8-9a9c-d1b16d946d35	\N	system	Chat session started. An admin will respond to your password reset request shortly.	f	\N	2025-08-05 11:47:03.964501+05	\N
788c162c-7694-435c-be64-c9c1d1bf8cd7	5bda6dcd-b19d-414b-b9f6-c26c2e993e5c	\N	system	Chat session started. An admin will respond to your password reset request shortly.	f	\N	2025-08-05 11:53:41.640684+05	\N
0e21acb2-b21e-4f81-9f9c-5b673923cfb5	b82d9be8-8ec7-4c0c-8ebd-f5812863061e	\N	system	Chat session started. An admin will respond to your password reset request shortly.	f	\N	2025-08-05 12:00:48.90223+05	\N
b6ed542f-2900-402e-8bd1-0395d373e354	7a0de7f7-daaf-4860-8259-d0754941ba46	\N	system	Chat session started. An admin will respond to your password reset request shortly.	f	\N	2025-08-05 12:20:49.512614+05	\N
013928ac-d86d-47d4-b6b7-7462835d8231	5ef47403-8e6e-4643-ba5a-64e02a4e45a7	\N	system	Chat session started. An admin will respond to your password reset request shortly.	f	\N	2025-08-05 12:33:41.867214+05	\N
779edbc5-2828-4126-9a7e-f565a3a45b3a	8e08d361-1152-484a-9a2a-65701db09b59	\N	system	Chat session started. An admin will respond to your password reset request shortly.	f	\N	2025-08-05 12:47:10.514239+05	\N
4805a2b3-0184-4403-a3bc-175ebf8d3601	e90f2f6a-4bab-414c-b251-aac944620c1b	\N	system	Chat session started. An admin will respond to your password reset request shortly.	f	\N	2025-08-05 14:34:52.431741+05	\N
6cffe2b2-0499-4cc9-9b3a-76323a5bee30	6a560766-5c11-4c85-8cd0-090b916605ac	\N	system	Chat session started. An admin will respond to your password reset request shortly.	f	\N	2025-08-05 14:50:58.367541+05	\N
d1d86b2f-983a-44df-8617-c788119abfaf	6a560766-5c11-4c85-8cd0-090b916605ac	ed0dfec9-e977-4031-b805-7dafe6448547	temp_password	gAAAAABokdQLiJRFNjC4TwVpxVVAJYET5jNnZM28UuMe01Au4Zr9l24eVkipznTwwcMhifNQjm9XMwsONtFnUPWKqn3TllsuRQ==	t	\N	2025-08-05 14:51:06.729914+05	2025-08-06 09:51:07.284964+05
4b2e4087-1705-442f-98c6-e92b34bab946	6a560766-5c11-4c85-8cd0-090b916605ac	\N	system	Admin has joined the chat and will assist with your password reset request.	f	\N	2025-08-05 14:51:29.899457+05	\N
2137029f-c579-43eb-a8ce-813d19ea9e3d	6a560766-5c11-4c85-8cd0-090b916605ac	ed0dfec9-e977-4031-b805-7dafe6448547	temp_password	gAAAAABokdQuF3nvqZsqA8sf1U21SKOwuoLy-rLo9eZth-mE0Ou84Tf4VWfmdC0DgfNSE0YczZu8WVZj-rAdV_6LBkpyLB1DOA==	t	\N	2025-08-05 14:51:42.380226+05	2025-08-06 09:51:42.872464+05
6684f14e-725c-4184-93c9-0bdb234b8a7a	6a560766-5c11-4c85-8cd0-090b916605ac	ed0dfec9-e977-4031-b805-7dafe6448547	temp_password	gAAAAABokdRD6lo2MDW9mEoj7Dn3WO6ZmFxHrMQdqrLGyLzFlcvF0tvaDSEXySMDPryoxYjYfmd9wDMFrq1RNx21eY53TPtukw==	t	\N	2025-08-05 14:52:02.539828+05	2025-08-06 09:52:03.021829+05
02dbe2ca-9b24-43e4-81d8-0c2e1c72afb7	d26af5e9-f86f-4a46-b205-35f05df8c992	\N	system	Chat session started. An admin will respond to your password reset request shortly.	f	\N	2025-08-05 15:25:04.148557+05	\N
dd67ef68-e9d7-46e6-9a7a-8a1563a2f49b	3aa87729-f29c-4624-8493-da05462a3781	\N	system	Chat session started. An admin will respond to your password reset request shortly.	f	\N	2025-08-05 15:32:28.255469+05	\N
1c532934-7360-4138-b75e-6b76fed5b9f5	3aa87729-f29c-4624-8493-da05462a3781	ed0dfec9-e977-4031-b805-7dafe6448547	temp_password	gAAAAABokd3Eu-uZF5C-lrlTGqQJvpI7t5mMk3sX7EBnWRI-lNeklUXKcf4ynEPnmPY30etxq3IYPwBchjKiD7yBhfEQ3o8usw==	t	\N	2025-08-05 15:32:35.806425+05	2025-08-06 10:32:36.340641+05
3f574f16-9595-4180-b168-f79a94ea0059	3aa87729-f29c-4624-8493-da05462a3781	ed0dfec9-e977-4031-b805-7dafe6448547	temp_password	gAAAAABokd3OmkTLmm6CKn3P_wY41uKCpXCIsYGB4_BS4Rroaj1O57jETmto5l9J4qLyHW5iuqvVS50aCXBou4Zde5pZBjRQzw==	t	\N	2025-08-05 15:32:45.38956+05	2025-08-06 10:32:46.104657+05
0071cbba-ea6d-4481-aa94-cc14f2e979b5	3aa87729-f29c-4624-8493-da05462a3781	ed0dfec9-e977-4031-b805-7dafe6448547	text	see the pass aboce	f	\N	2025-08-05 15:33:02.456665+05	\N
1c296ff3-bd2c-46ed-8142-d78b8a079719	3aa87729-f29c-4624-8493-da05462a3781	\N	system	Admin has joined the chat and will assist with your password reset request.	f	\N	2025-08-05 15:33:37.078516+05	\N
07320b1b-4079-4e37-891e-7f669e78d30f	3aa87729-f29c-4624-8493-da05462a3781	ed0dfec9-e977-4031-b805-7dafe6448547	temp_password	gAAAAABokd4H24y3aTrMFCRffBYyh7STnBuq9SoQ92o4MlRfEbyZMWFVEnHtvWGvxN5qPDV6hxYgK740UMzt5ar8cClVZptqXQ==	t	\N	2025-08-05 15:33:43.250605+05	2025-08-06 10:33:43.672549+05
11ac4c59-132e-45d0-9df9-083ecfc00760	3aa87729-f29c-4624-8493-da05462a3781	ed0dfec9-e977-4031-b805-7dafe6448547	text	hey	f	\N	2025-08-05 15:33:50.2141+05	\N
b9fda0f3-0f3c-4557-80ed-5c7039d27461	3aa87729-f29c-4624-8493-da05462a3781	ed0dfec9-e977-4031-b805-7dafe6448547	text	see the coded above	f	\N	2025-08-05 15:34:46.644109+05	\N
becac2c9-b147-474a-ac81-3c75144fdd3b	3aa87729-f29c-4624-8493-da05462a3781	ed0dfec9-e977-4031-b805-7dafe6448547	temp_password	gAAAAABokd5fhqgN_V9boWpeQprat-jzD3LSYbgwMsGqCf7S5L2UhtoRYazwLgNpS-SB-br4RsjudQIIDAESrAjuPS-fZFEoDA==	t	\N	2025-08-05 15:35:10.634725+05	2025-08-06 10:35:11.074632+05
3ea04a04-25a1-4afc-8065-8af64ca0eb55	90014b0e-40b6-46cd-9a03-691ddb7a6195	\N	system	Chat session started. An admin will respond to your password reset request shortly.	f	\N	2025-08-05 15:45:40.840021+05	\N
eaf131bd-9f68-4c52-8630-64c66495f5da	90014b0e-40b6-46cd-9a03-691ddb7a6195	\N	system	Admin has joined the chat and will assist with your password reset request.	f	\N	2025-08-05 15:45:53.150102+05	\N
fc174d6d-9acb-4aac-8ad9-33acba36d254	90014b0e-40b6-46cd-9a03-691ddb7a6195	ed0dfec9-e977-4031-b805-7dafe6448547	temp_password	gAAAAABokeDreNl6dbOcpXyPAIlzwth5-ozxgFIF0jm1aQYt5e54Icnis7-GsWCcmh_MTj7IeMltmaJAXatK1CO5LzYO89ke9Q==	t	\N	2025-08-05 15:46:03.498314+05	2025-08-06 10:46:03.996194+05
a431dfa5-b6dd-4894-a810-e66a01f47294	f4d7b081-3674-4b60-af1b-54bfeb16996b	\N	system	Chat session started. An admin will respond to your password reset request shortly.	f	\N	2025-08-05 15:57:03.698406+05	\N
a4754557-cca4-455e-88e6-da69923bea8b	f4d7b081-3674-4b60-af1b-54bfeb16996b	ed0dfec9-e977-4031-b805-7dafe6448547	temp_password	gAAAAABokeOOXbnX3zZuHPuz_0iTsv3ewRqXBCLfJKme0AfxrO1Gb6-nO0WbrkL8UkAfqz6mftTLCudnUdp1pD0hVnfE24zdmw==	t	\N	2025-08-05 15:57:17.712001+05	2025-08-06 10:57:18.194411+05
c38e8829-687a-479e-9fbb-adcdfb6f8666	f4d7b081-3674-4b60-af1b-54bfeb16996b	\N	system	Admin has joined the chat and will assist with your password reset request.	f	\N	2025-08-05 15:57:27.886623+05	\N
9830d176-9fde-46fb-a24b-0b7cffb12578	f4d7b081-3674-4b60-af1b-54bfeb16996b	ed0dfec9-e977-4031-b805-7dafe6448547	text	hey	f	\N	2025-08-05 15:57:38.225906+05	\N
eb7b022f-79f9-4bb2-845f-5abcde339483	f4d7b081-3674-4b60-af1b-54bfeb16996b	ed0dfec9-e977-4031-b805-7dafe6448547	text	hey	f	\N	2025-08-05 15:57:57.347763+05	\N
c7c5389b-f073-4463-9bef-5c68ae09889e	90014b0e-40b6-46cd-9a03-691ddb7a6195	ed0dfec9-e977-4031-b805-7dafe6448547	temp_password	gAAAAABokePFFLa436qixYCnnHGEryUdrLWPmZOiZBPOXCWWjwDL-439gafifsrA8soJXV5PERX_EKetGOh4GgY1J0kQFuuYfA==	t	\N	2025-08-05 15:58:13.299675+05	2025-08-06 10:58:13.768904+05
3ad48ba8-ea07-40d7-8f8e-4ec8f8a603d7	2fb11564-0cbf-465a-8b2d-8ea24a3593a3	\N	system	Hello! How can we help you today? An admin will respond to your message shortly.	f	\N	2025-08-06 11:11:54.656428+05	\N
9fd8a6a9-19ac-47e0-8fd9-041a14836bf5	2fb11564-0cbf-465a-8b2d-8ea24a3593a3	\N	system	Admin has joined the chat and will assist with your password reset request.	f	\N	2025-08-06 11:18:57.101243+05	\N
8999a860-3916-47cf-a02a-5cf6f5d1e915	d7d6dc79-4188-452b-8e82-4dc0560bc8b8	\N	system	Hello! How can we help you today? An admin will respond to your message shortly.	f	\N	2025-08-06 11:23:22.942813+05	\N
ccd7e356-e728-4f36-9941-97f88ee2b26f	47a04222-0410-4b1e-81bb-4e6e5ec519a4	ed0dfec9-e977-4031-b805-7dafe6448547	text	yo	f	2025-08-06 06:36:45.875137+05	2025-08-05 15:59:16.905244+05	\N
95801b67-4471-401d-8a1e-2809a7c95eb8	d7d6dc79-4188-452b-8e82-4dc0560bc8b8	bfa58084-b9ee-4332-aeb9-69d7f913f3f5	text	hey i need some help	f	2025-08-06 06:37:14.260807+05	2025-08-06 11:35:06.648662+05	\N
c6f7660c-3529-48d5-80a0-7f49e4c4701b	d7d6dc79-4188-452b-8e82-4dc0560bc8b8	bfa58084-b9ee-4332-aeb9-69d7f913f3f5	text	hey i need some help	f	2025-08-06 06:37:14.260807+05	2025-08-06 11:35:07.352731+05	\N
9a637a20-955c-4ac0-8a22-18d7a4a15cba	d7d6dc79-4188-452b-8e82-4dc0560bc8b8	bfa58084-b9ee-4332-aeb9-69d7f913f3f5	text	no pass	f	2025-08-06 06:37:14.260807+05	2025-08-06 11:35:22.560847+05	\N
e2a6b2a2-d031-4b2d-90ee-60cf34a08685	d7d6dc79-4188-452b-8e82-4dc0560bc8b8	ed0dfec9-e977-4031-b805-7dafe6448547	text	what is the issue	f	2025-08-06 06:37:51.034378+05	2025-08-06 11:37:35.519361+05	\N
56cf7b41-df0d-4b09-b7eb-05198a2478a6	d7d6dc79-4188-452b-8e82-4dc0560bc8b8	bfa58084-b9ee-4332-aeb9-69d7f913f3f5	text	i cant reset my pass	f	2025-08-06 06:38:16.649296+05	2025-08-06 11:38:06.278769+05	\N
8bc52225-5e1e-449a-86a8-2ec74e4659cb	d7d6dc79-4188-452b-8e82-4dc0560bc8b8	ed0dfec9-e977-4031-b805-7dafe6448547	temp_password	gAAAAABokvheGkgdM4rF5nlWxlrUnm6PjGjjAUG2FQLY-sn5ijjMQmuOItL5abU-beQyKGrHZDClVvx_g5qDgwaMkuGLmCdbVA==	t	2025-08-06 06:38:38.946612+05	2025-08-06 11:38:22.576987+05	2025-08-07 06:38:22.867326+05
90b66f09-99bd-435a-b87e-ee1b086e9e4d	d7d6dc79-4188-452b-8e82-4dc0560bc8b8	ed0dfec9-e977-4031-b805-7dafe6448547	text	please see the pass above	f	2025-08-06 06:38:38.946612+05	2025-08-06 11:38:32.913602+05	\N
96b6888c-68a5-4842-aeb8-ee9174201441	c276f183-8df9-42c7-9e8d-b4650478b908	\N	system	Chat session started. An admin will respond to your password reset request shortly.	f	\N	2025-08-06 15:38:22.330962+05	\N
e42155cc-d6d6-43dc-9fc7-0253f664a999	c276f183-8df9-42c7-9e8d-b4650478b908	ed0dfec9-e977-4031-b805-7dafe6448547	text	ByPqvoT&w@mR	f	\N	2025-08-06 15:39:13.075539+05	\N
18d37d90-b1b0-4572-bf03-016b967b0ed4	c276f183-8df9-42c7-9e8d-b4650478b908	ed0dfec9-e977-4031-b805-7dafe6448547	text	this is your password that is temp change it asap	f	\N	2025-08-06 15:39:27.130172+05	\N
2b9b08eb-df58-4ea1-82dd-53619c6d871d	c276f183-8df9-42c7-9e8d-b4650478b908	ed0dfec9-e977-4031-b805-7dafe6448547	text	soon	f	\N	2025-08-06 15:40:00.158261+05	\N
c44687da-190e-4e47-94bc-16b7e23d6e34	6c64685e-339d-4e89-8afd-7282cf609ace	\N	system	Hello! How can we help you today? An admin will respond to your message shortly.	f	\N	2025-08-06 15:40:09.36444+05	\N
0e31554a-5116-43b1-880a-c9f97fa94f38	2fb11564-0cbf-465a-8b2d-8ea24a3593a3	ed0dfec9-e977-4031-b805-7dafe6448547	text	hey	f	2025-08-12 06:58:01.538188+05	2025-08-06 11:18:50.996429+05	\N
99f076b0-4494-47b5-9d26-025ccf2a9e3d	c276f183-8df9-42c7-9e8d-b4650478b908	\N	system	Admin has joined the chat and will assist with your password reset request.	f	\N	2025-08-06 15:40:47.356184+05	\N
4e829f23-5d73-4486-ab9d-9731b88212a5	c276f183-8df9-42c7-9e8d-b4650478b908	ed0dfec9-e977-4031-b805-7dafe6448547	text	ByPqvoT&w@mR	f	\N	2025-08-06 15:40:54.440999+05	\N
78d93d12-d096-444d-9151-e99ef963a3d0	6c64685e-339d-4e89-8afd-7282cf609ace	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	text	ByPqvoT&w@mR	f	2025-08-06 10:41:14.585861+05	2025-08-06 15:41:05.697296+05	\N
50152de8-a599-413f-97c1-2c7936b7e2c6	6c64685e-339d-4e89-8afd-7282cf609ace	ed0dfec9-e977-4031-b805-7dafe6448547	text	yes this is ur pass change is asap ByPqvoT&w@mR as it is temp	f	2025-08-06 10:41:35.425572+05	2025-08-06 15:41:27.186808+05	\N
c5227202-56c1-452d-b07f-21b0663b7253	6c64685e-339d-4e89-8afd-7282cf609ace	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	text	i did	f	2025-08-06 10:42:15.497991+05	2025-08-06 15:42:04.8576+05	\N
d18ef6e3-95ec-411e-8129-300e9618f505	6c64685e-339d-4e89-8afd-7282cf609ace	ed0dfec9-e977-4031-b805-7dafe6448547	temp_password	gAAAAABokzHoGPiZDvKxUOBCETP7A2jtkqzysJ9urvi5J4qGs8Gf1OAyf-xzhQKD3xG9kj8_sOppyPv1xjjvX0-tWK20sffRqw==	t	2025-08-06 10:43:58.906134+05	2025-08-06 15:43:52.749025+05	2025-08-07 10:43:52.757107+05
a23290fe-56db-4f1a-b1a4-c30200045d16	6c64685e-339d-4e89-8afd-7282cf609ace	ed0dfec9-e977-4031-b805-7dafe6448547	temp_password	gAAAAABokzR6g_KEReUWBE82ebK8PxjHhOlQGfa0QVfsiS4HOOYm1cziZZJCMXcAPJGL1msYRZuDdq4XmFbUm7-i_CcvgDj2ug==	t	2025-08-06 10:59:02.459694+05	2025-08-06 15:54:50.566822+05	2025-08-07 10:54:50.582708+05
7b923dc4-3dc8-4493-8aa0-75c05ad117cf	6c64685e-339d-4e89-8afd-7282cf609ace	ed0dfec9-e977-4031-b805-7dafe6448547	temp_password	gAAAAABokzSOR3J-8qiWNtxmJXJMFYUaAeuRfBtwrR7wPyfuk-_oNk1DhkWat6lWbV6EcpXBsSR-J2tw1H0U3yYaZrsuFa-zRQ==	t	2025-08-06 10:59:02.459694+05	2025-08-06 15:55:10.61304+05	2025-08-07 10:55:10.627489+05
856889b4-5d25-42f3-af96-fba96a45a856	6c64685e-339d-4e89-8afd-7282cf609ace	ed0dfec9-e977-4031-b805-7dafe6448547	temp_password	gAAAAABokzUfZJK4Ypr6hSWDEoPzjpbARfCbI4k-Iwlel7A0fTLjqoiqVQ8H4cR_5S8YXV8X8yoy-lirmJEukZmgGE9H5egCfw==	f	2025-08-06 10:59:02.459694+05	2025-08-06 15:57:35.616476+05	2025-08-07 10:57:35.632891+05
1252a25c-3530-4280-9bd3-fd199104ad04	6c64685e-339d-4e89-8afd-7282cf609ace	ed0dfec9-e977-4031-b805-7dafe6448547	temp_password	gAAAAABokzVfbhiPZ8p3XL9k18FwKYKBdD9w104IMPxq-yn3YbwEbbvKXzpaZvU2p7bI-YnK5XiJrm3MvUjj2K0bUroRTi5UTw==	f	2025-08-06 10:59:02.459694+05	2025-08-06 15:58:39.76908+05	2025-08-07 10:58:39.772959+05
3a61959b-2ab0-42fd-90ae-8f10ebdec463	61d91a5a-b089-4e8d-bdd3-7ea5a6503367	\N	system	Hello! How can we help you today? An admin will respond to your message shortly.	f	\N	2025-08-06 15:59:50.447993+05	\N
0f9cd79a-dd1a-4e35-8220-8cb37d97a8bc	9696b49f-0800-4b76-be17-75e35db20f4d	\N	system	Hello! How can we help you today? An admin will respond to your message shortly.	f	\N	2025-08-11 12:40:13.615663+05	\N
916d2b1b-8644-452b-a7f5-ad721e97f9b6	2fb11564-0cbf-465a-8b2d-8ea24a3593a3	ed0dfec9-e977-4031-b805-7dafe6448547	temp_password	gAAAAABokvPgP81O4oHYSxi46dvYJ7B4S-jw4pn19WSCo-91tndlV1JTnO1TEb9kBrdbpSUHX-HXzdsGsKM-87k8PVK7PlpTnA==	t	2025-08-12 06:58:01.538188+05	2025-08-06 11:19:12.053212+05	2025-08-07 06:19:12.851972+05
\.


--
-- Data for Name: chat_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_sessions (id, password_reset_request_id, employee_id, admin_id, status, created_at, closed_at, last_activity_at) FROM stdin;
2fb11564-0cbf-465a-8b2d-8ea24a3593a3	\N	da11c730-751f-458e-a351-bf2040173eab	ed0dfec9-e977-4031-b805-7dafe6448547	active	2025-08-06 11:11:54.395001+05	\N	2025-08-06 06:19:12.852161+05
568967bb-9915-4da3-a5f3-fd8d2da5a1df	de7b5b4f-fe77-4209-963a-bfce7ac29446	da11c730-751f-458e-a351-bf2040173eab	\N	closed	2025-08-05 11:40:27.445038+05	2025-08-05 09:48:43.097517+05	2025-08-05 14:48:41.854757+05
784daf3a-c697-40b8-8a43-35e96ea94e6a	417d0f64-64ec-4c56-964e-e185756c8745	da11c730-751f-458e-a351-bf2040173eab	\N	closed	2025-08-05 11:18:26.367202+05	2025-08-05 09:48:46.669643+05	2025-08-05 14:48:43.198654+05
e90f2f6a-4bab-414c-b251-aac944620c1b	08457742-73ad-4fbf-807c-a4ee171b9008	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	\N	closed	2025-08-05 14:34:51.963952+05	2025-08-05 09:48:49.081942+05	2025-08-05 14:48:47.834265+05
8e08d361-1152-484a-9a2a-65701db09b59	7adfc2a6-9b89-46f8-8349-4c165b22ac45	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	\N	closed	2025-08-05 12:47:09.955257+05	2025-08-05 09:48:52.427966+05	2025-08-05 14:48:51.640138+05
5ef47403-8e6e-4643-ba5a-64e02a4e45a7	997da7f4-272e-4181-a4fa-46dbbcb47ad7	da11c730-751f-458e-a351-bf2040173eab	\N	closed	2025-08-05 12:33:41.369606+05	2025-08-05 09:48:55.398279+05	2025-08-05 14:48:54.81832+05
7a0de7f7-daaf-4860-8259-d0754941ba46	53ee7db6-5754-4ed8-99d1-4872d953bdec	da11c730-751f-458e-a351-bf2040173eab	\N	closed	2025-08-05 12:20:49.089257+05	2025-08-05 09:48:57.850357+05	2025-08-05 14:48:57.2861+05
b82d9be8-8ec7-4c0c-8ebd-f5812863061e	6f428ded-a2ce-43a4-965a-ad09afe23988	da11c730-751f-458e-a351-bf2040173eab	\N	closed	2025-08-05 12:00:47.269093+05	2025-08-05 09:49:01.90334+05	2025-08-05 14:49:01.388932+05
5bda6dcd-b19d-414b-b9f6-c26c2e993e5c	c24e42fb-bc10-40e7-877a-538aa961d025	da11c730-751f-458e-a351-bf2040173eab	\N	closed	2025-08-05 11:53:41.171724+05	2025-08-05 09:49:54.795198+05	2025-08-05 14:49:53.90503+05
daa07699-7f29-45a8-9a9c-d1b16d946d35	4ec35482-f98e-402d-ad75-23e79efd0273	da11c730-751f-458e-a351-bf2040173eab	\N	closed	2025-08-05 11:47:03.457629+05	2025-08-05 09:49:57.019813+05	2025-08-05 14:49:55.938241+05
6a560766-5c11-4c85-8cd0-090b916605ac	7e4e053b-e7bd-492a-9001-06e2bb8b8879	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	ed0dfec9-e977-4031-b805-7dafe6448547	closed	2025-08-05 14:50:57.796156+05	2025-08-05 09:52:26.522755+05	2025-08-05 14:52:25.949429+05
d7d6dc79-4188-452b-8e82-4dc0560bc8b8	\N	bfa58084-b9ee-4332-aeb9-69d7f913f3f5	\N	active	2025-08-06 11:23:22.69741+05	\N	2025-08-06 06:38:33.525442+05
d26af5e9-f86f-4a46-b205-35f05df8c992	67452211-f2fd-4161-9883-e43a27ac920d	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	\N	closed	2025-08-05 15:25:03.543345+05	2025-08-05 10:32:05.753534+05	2025-08-05 15:32:05.302757+05
47a04222-0410-4b1e-81bb-4e6e5ec519a4	\N	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	\N	closed	2025-08-05 15:59:01.363641+05	2025-08-06 10:39:46.245198+05	2025-08-06 15:39:46.240731+05
3aa87729-f29c-4624-8493-da05462a3781	540831b6-1787-412b-9627-74c2cd877ad4	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	ed0dfec9-e977-4031-b805-7dafe6448547	closed	2025-08-05 15:32:27.623526+05	2025-08-05 10:35:15.239636+05	2025-08-05 15:35:14.616184+05
c276f183-8df9-42c7-9e8d-b4650478b908	7c361be7-4ad1-4152-8e1d-2e2e47e5dff8	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	ed0dfec9-e977-4031-b805-7dafe6448547	active	2025-08-06 15:38:22.310714+05	\N	2025-08-06 10:40:54.445246+05
6c64685e-339d-4e89-8afd-7282cf609ace	\N	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	\N	closed	2025-08-06 15:40:09.344644+05	2025-08-06 10:59:31.931364+05	2025-08-06 15:59:31.92789+05
f4d7b081-3674-4b60-af1b-54bfeb16996b	2d626032-967f-4500-acb1-d2ccc38c07de	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	ed0dfec9-e977-4031-b805-7dafe6448547	closed	2025-08-05 15:57:03.213455+05	2025-08-05 10:58:37.913975+05	2025-08-05 15:58:37.407058+05
90014b0e-40b6-46cd-9a03-691ddb7a6195	719f4731-6db6-4b60-b21b-d23735ce5693	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	ed0dfec9-e977-4031-b805-7dafe6448547	closed	2025-08-05 15:45:40.343116+05	2025-08-05 10:58:41.554118+05	2025-08-05 15:58:40.727052+05
61d91a5a-b089-4e8d-bdd3-7ea5a6503367	\N	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	\N	active	2025-08-06 15:59:50.425807+05	\N	2025-08-06 10:59:50.450938+05
9696b49f-0800-4b76-be17-75e35db20f4d	\N	ed0dfec9-e977-4031-b805-7dafe6448547	\N	active	2025-08-11 12:40:13.516568+05	\N	2025-08-11 07:40:13.645411+05
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (department_id, name, created_at, updated_at) FROM stdin;
876f952d-6922-4fa0-ae33-28c9dc0320fa	IT	2025-07-22 15:38:46.549594+05	\N
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employees (employee_id, user_id, employee_number, first_name, last_name, date_of_birth, phone, hire_date, job_title, department_id, employment_type, status, salary, created_at, middle_name, updated_at, manager_id) FROM stdin;
b54839a9-e34e-457f-8d71-8ce2fe2c33a4	054cbace-5bcf-4e8d-973b-caa852ebca65	EMP154	John	Doe	1990-07-23	+92-1234567890	2025-07-23	Software Engineer	876f952d-6922-4fa0-ae33-28c9dc0320fa	full_time	active	\N	2025-07-23 12:23:15.124368+05	\N	\N	\N
d55777da-3cf1-4e97-a996-22dbd8ca9916	3d824553-c3b1-47db-aee8-c5feeb9f44ab	string	string	string	2025-07-25	+923205622747	2025-07-25	string	876f952d-6922-4fa0-ae33-28c9dc0320fa	full_time	active	0.00	2025-07-25 10:16:59.100587+05	string	\N	b54839a9-e34e-457f-8d71-8ce2fe2c33a4
65d8e457-b424-4405-88d0-caf161825a85	4a4e4a14-8680-41d0-bb5a-e57b1f0c533f	wP99222305	dadada	fafasfsasfa	1990-05-15	+9900220	2025-07-25	Software Engineer	876f952d-6922-4fa0-ae33-28c9dc0320fa	full_time	active	80000.00	2025-07-25 12:01:19.218044+05	A	\N	b54839a9-e34e-457f-8d71-8ce2fe2c33a4
3cbbeb38-cf30-4926-a3b2-eb440c68b12e	da11c730-751f-458e-a351-bf2040173eab	EMP256	Talha	Niazi	2025-07-14	+923181982619	2025-07-22	SWE	876f952d-6922-4fa0-ae33-28c9dc0320fa	full_time	active	50000.00	2025-07-29 10:32:39.596083+05	Khan	\N	\N
c5dcc484-9e4c-4903-af66-3765b3a00a6c	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	EMP69	A	C	2025-07-15	123	2025-07-14	abc	876f952d-6922-4fa0-ae33-28c9dc0320fa	full_time	active	500000.00	2025-07-30 11:59:20.768451+05	B	\N	\N
ee9329af-759d-4ca9-a7c7-54a66637301a	bfa58084-b9ee-4332-aeb9-69d7f913f3f5	EMP007	James	Bond	2025-08-04	+9200707007	2025-08-04	Agent	876f952d-6922-4fa0-ae33-28c9dc0320fa	full_time	active	69000.00	2025-08-06 11:21:58.25548+05		\N	\N
\.


--
-- Data for Name: leaves; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leaves (leave_id, employee_id, leave_type, start_date, end_date, status, created_at, updated_at) FROM stdin;
6d0541d8-f76e-40a5-bafa-39c9606060ce	b54839a9-e34e-457f-8d71-8ce2fe2c33a4	vacation	2025-08-01	2025-08-05	approved	2025-07-23 12:28:08.327715+05	2025-07-23 12:29:04.48891+05
80ad4600-8afe-4c80-914d-b91db7998eec	b54839a9-e34e-457f-8d71-8ce2fe2c33a4	vacation	2025-07-17	2025-07-25	rejected	2025-07-23 15:08:27.441628+05	\N
9bb50b38-acd4-4f9d-9a5d-46b8a8e5dfd1	3cbbeb38-cf30-4926-a3b2-eb440c68b12e	sick	2025-07-08	2025-07-17	approved	2025-07-29 15:30:10.927545+05	2025-07-29 15:30:53.874252+05
24d74a46-61d2-4f55-a1b2-dd572c520191	65d8e457-b424-4405-88d0-caf161825a85	vacation	2025-07-30	2025-08-07	approved	2025-07-30 10:50:40.805333+05	2025-07-30 11:11:33.55901+05
0d4685e3-ca2c-42b4-896d-991a17b11016	d55777da-3cf1-4e97-a996-22dbd8ca9916	personal	2025-07-14	2025-07-31	rejected	2025-07-30 11:19:52.871635+05	2025-07-30 11:19:57.26494+05
286f31c4-0c88-454b-a654-ee98500fab23	c5dcc484-9e4c-4903-af66-3765b3a00a6c	sick	2025-08-01	2025-08-08	rejected	2025-07-31 12:15:43.114547+05	2025-07-31 12:16:12.537322+05
859e0884-eda6-4963-bc1b-d5344517ff35	c5dcc484-9e4c-4903-af66-3765b3a00a6c	sick	2025-07-25	2025-08-09	approved	2025-07-31 12:16:46.167942+05	2025-07-31 12:17:57.499622+05
f525eb94-8e6f-470d-bc6a-bf1ff106c17f	c5dcc484-9e4c-4903-af66-3765b3a00a6c	sick	2025-08-02	2025-08-16	approved	2025-08-01 10:16:24.129253+05	2025-08-01 10:16:54.98414+05
9ebc2979-6966-42c5-b337-6482e8b04bd8	c5dcc484-9e4c-4903-af66-3765b3a00a6c	sick	2025-08-06	2025-08-18	rejected	2025-08-01 10:17:15.042706+05	2025-08-01 10:17:36.958826+05
02910fd1-ab67-40c6-b0cd-2430474bcf8e	c5dcc484-9e4c-4903-af66-3765b3a00a6c	sick	2025-08-07	2025-08-21	rejected	2025-08-01 10:18:34.844865+05	2025-08-01 14:56:54.191785+05
\.


--
-- Data for Name: password_reset_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_requests (id, user_id, status, created_at, resolved_at, admin_id, request_reason) FROM stdin;
95cce731-6bd1-4f1d-b135-7c423ba7fd20	da11c730-751f-458e-a351-bf2040173eab	resolved	2025-08-01 14:49:50.892887+05	2025-08-01 14:57:53.483704+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
b64ec0e1-c759-4b3c-9222-07bcbeeb440b	da11c730-751f-458e-a351-bf2040173eab	resolved	2025-08-01 15:20:02.531677+05	2025-08-01 15:21:10.886418+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
6fdb8a5a-b522-4bb6-bff7-2bb6729c4400	da11c730-751f-458e-a351-bf2040173eab	resolved	2025-08-01 15:25:44.301141+05	2025-08-01 15:26:07.469311+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
db495544-776e-44df-a589-f7dbf38cd28a	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	rejected	2025-08-01 15:28:36.317376+05	2025-08-01 15:29:01.390003+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
f257a26c-fa6b-4dfe-875a-12d4fa56fca5	da11c730-751f-458e-a351-bf2040173eab	resolved	2025-08-01 15:28:38.265697+05	2025-08-01 15:29:04.820462+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
0611532b-2a93-4fc9-a565-a71085922100	da11c730-751f-458e-a351-bf2040173eab	resolved	2025-08-04 10:22:46.964221+05	2025-08-04 10:23:05.719817+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
46ee6f75-8221-43db-8130-011b7c0c2296	da11c730-751f-458e-a351-bf2040173eab	resolved	2025-08-04 10:24:46.040624+05	2025-08-04 10:24:51.827851+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
4261b936-3dd4-45d4-8b36-d2e96fc2b33d	da11c730-751f-458e-a351-bf2040173eab	resolved	2025-08-04 11:57:15.508744+05	2025-08-04 11:57:38.64043+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
337d6c32-2dd9-4deb-ad85-1a58a951617d	da11c730-751f-458e-a351-bf2040173eab	rejected	2025-08-04 14:47:26.664998+05	2025-08-04 14:47:42.233788+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
eb248b7c-1397-428a-9d5b-fef47dd4e96f	da11c730-751f-458e-a351-bf2040173eab	rejected	2025-08-04 14:47:47.83288+05	2025-08-04 14:47:53.125135+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
c69829fc-b250-47a6-a995-477ecf284f11	da11c730-751f-458e-a351-bf2040173eab	rejected	2025-08-04 14:47:56.139865+05	2025-08-04 14:48:30.184601+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
d61a2e74-6395-49c4-9ded-7b1740e82ec6	da11c730-751f-458e-a351-bf2040173eab	rejected	2025-08-04 14:48:51.208153+05	2025-08-04 14:52:49.645685+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
7537fa65-a5ea-4a46-a0bf-631b5184b84e	da11c730-751f-458e-a351-bf2040173eab	resolved	2025-08-04 14:53:01.792956+05	2025-08-04 14:53:19.221119+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
4f56897f-749f-4260-b759-a6aad61766f1	da11c730-751f-458e-a351-bf2040173eab	rejected	2025-08-04 14:55:04.647345+05	2025-08-04 15:00:15.443946+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
2fc9e308-cca1-4901-9d74-3d4186a751fe	da11c730-751f-458e-a351-bf2040173eab	rejected	2025-08-04 15:00:26.143396+05	2025-08-04 15:00:34.22493+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
55700ac4-3329-4765-9df1-c6bc0ea5c4ec	da11c730-751f-458e-a351-bf2040173eab	rejected	2025-08-04 15:00:39.569691+05	2025-08-04 15:04:09.066811+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
e458fc04-dc55-494f-be16-b2e1345cfd4e	da11c730-751f-458e-a351-bf2040173eab	rejected	2025-08-04 15:04:10.841107+05	2025-08-04 15:05:37.486578+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
4e2da30c-adaa-41f7-9bea-b332acd7ef6c	da11c730-751f-458e-a351-bf2040173eab	rejected	2025-08-04 15:05:54.844569+05	2025-08-04 15:06:15.217027+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
30d53832-0327-4053-8b53-ffd4f663452b	da11c730-751f-458e-a351-bf2040173eab	rejected	2025-08-04 15:06:27.506968+05	2025-08-04 15:12:44.800739+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
d71c5745-4249-4b47-b30c-47efc0018b39	da11c730-751f-458e-a351-bf2040173eab	resolved	2025-08-04 15:32:57.331742+05	2025-08-04 15:33:11.779997+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
622a65fa-8b6d-46c3-8fa7-44f2f69d0123	da11c730-751f-458e-a351-bf2040173eab	resolved	2025-08-05 10:23:21.919199+05	2025-08-05 10:23:45.892993+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
158b8977-b5c9-43d2-ab23-0b560636011e	da11c730-751f-458e-a351-bf2040173eab	resolved	2025-08-05 10:37:02.280962+05	2025-08-05 10:37:10.307968+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
4aec951f-57cf-4380-8ee8-13bafc791447	da11c730-751f-458e-a351-bf2040173eab	resolved	2025-08-05 10:40:33.720981+05	2025-08-05 10:40:46.90544+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
46d91ac6-bb5a-43e7-aab7-6514f6e6d049	da11c730-751f-458e-a351-bf2040173eab	resolved	2025-08-05 10:41:16.686733+05	2025-08-05 10:41:25.125512+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
53985393-5366-4751-afdc-51dbc77e4ee5	da11c730-751f-458e-a351-bf2040173eab	resolved	2025-08-05 10:51:14.355599+05	2025-08-05 10:51:24.240707+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
4304c893-0ae2-4a1f-8809-e012d549ce86	da11c730-751f-458e-a351-bf2040173eab	resolved	2025-08-05 10:57:36.881549+05	2025-08-05 10:57:45.408589+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
417d0f64-64ec-4c56-964e-e185756c8745	da11c730-751f-458e-a351-bf2040173eab	resolved	2025-08-05 11:18:11.077356+05	2025-08-05 11:18:26.343243+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
b2317c01-00a6-423b-9343-42e89a5876ee	da11c730-751f-458e-a351-bf2040173eab	resolved	2025-08-05 11:32:56.604801+05	2025-08-05 11:33:03.893381+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
de7b5b4f-fe77-4209-963a-bfce7ac29446	da11c730-751f-458e-a351-bf2040173eab	resolved	2025-08-05 11:40:19.099448+05	2025-08-05 11:40:27.416472+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
4ec35482-f98e-402d-ad75-23e79efd0273	da11c730-751f-458e-a351-bf2040173eab	resolved	2025-08-05 11:46:54.805303+05	2025-08-05 11:47:03.338631+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
c24e42fb-bc10-40e7-877a-538aa961d025	da11c730-751f-458e-a351-bf2040173eab	resolved	2025-08-05 11:53:00.596739+05	2025-08-05 11:53:41.132579+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
6f428ded-a2ce-43a4-965a-ad09afe23988	da11c730-751f-458e-a351-bf2040173eab	resolved	2025-08-05 12:00:35.376707+05	2025-08-05 12:00:47.232108+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
53ee7db6-5754-4ed8-99d1-4872d953bdec	da11c730-751f-458e-a351-bf2040173eab	resolved	2025-08-05 12:20:43.452013+05	2025-08-05 12:20:48.996615+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
18cd629d-86fc-46e0-9b04-f7be86c2250e	da11c730-751f-458e-a351-bf2040173eab	resolved	2025-08-05 12:21:11.426287+05	2025-08-05 12:21:18.029901+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
997da7f4-272e-4181-a4fa-46dbbcb47ad7	da11c730-751f-458e-a351-bf2040173eab	resolved	2025-08-05 12:21:55.527487+05	2025-08-05 12:33:41.341565+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
2d475287-ee8f-4726-9dc0-0176d28775a6	da11c730-751f-458e-a351-bf2040173eab	rejected	2025-08-05 12:34:02.246884+05	2025-08-05 12:34:15.79294+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
801ce5fd-1d0b-43da-abea-0a359fe0ad21	da11c730-751f-458e-a351-bf2040173eab	resolved	2025-08-05 12:34:22.58484+05	2025-08-05 12:34:30.633325+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
7adfc2a6-9b89-46f8-8349-4c165b22ac45	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	resolved	2025-08-05 12:47:03.423493+05	2025-08-05 12:47:09.930726+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
deb670e0-7af5-4fad-9d90-ec73c8e9c22b	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	resolved	2025-08-05 12:47:21.519068+05	2025-08-05 12:47:29.272508+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
08457742-73ad-4fbf-807c-a4ee171b9008	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	resolved	2025-08-05 14:34:44.84226+05	2025-08-05 14:34:51.93181+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
34d18120-67a9-4db1-90d6-9861f45a6e6b	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	resolved	2025-08-05 14:35:00.295679+05	2025-08-05 14:35:06.806262+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
7e4e053b-e7bd-492a-9001-06e2bb8b8879	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	resolved	2025-08-05 14:50:07.458288+05	2025-08-05 14:50:57.768258+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
8f36fa78-f6c1-4dfb-bbfb-b9256cf78a3f	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	resolved	2025-08-05 14:52:43.388113+05	2025-08-05 14:52:53.388813+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
67452211-f2fd-4161-9883-e43a27ac920d	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	resolved	2025-08-05 15:24:57.134829+05	2025-08-05 15:25:03.511253+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
540831b6-1787-412b-9627-74c2cd877ad4	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	resolved	2025-08-05 15:32:19.416662+05	2025-08-05 15:32:27.398342+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
f3031ebf-4626-4a63-81ba-bea4980d6145	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	resolved	2025-08-05 15:34:04.773565+05	2025-08-05 15:34:11.844242+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
719f4731-6db6-4b60-b21b-d23735ce5693	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	resolved	2025-08-05 15:45:13.908828+05	2025-08-05 15:45:40.089269+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
2d626032-967f-4500-acb1-d2ccc38c07de	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	resolved	2025-08-05 15:56:53.878468+05	2025-08-05 15:57:03.126549+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
c3b80dd4-67f0-430d-9748-f51d393491ae	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	resolved	2025-08-05 15:58:48.066669+05	2025-08-05 15:58:54.757596+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
7c361be7-4ad1-4152-8e1d-2e2e47e5dff8	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	resolved	2025-08-06 15:37:57.829814+05	2025-08-06 15:38:22.279784+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
4438ac80-de4b-42b3-9b29-3745068968b6	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	resolved	2025-08-06 15:38:49.128427+05	2025-08-06 15:38:56.355175+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
4b1ed958-73a7-49b5-ad40-4a38742226eb	b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	resolved	2025-08-06 16:00:07.422189+05	2025-08-06 16:00:12.959676+05	ed0dfec9-e977-4031-b805-7dafe6448547	\N
\.


--
-- Data for Name: payrolls; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payrolls (payroll_id, employee_id, period_start, period_end, base_salary, overtime_pay, deductions, net_pay, created_at, updated_at) FROM stdin;
de9d0c51-eeb8-4048-92e3-b9de6464a800	d55777da-3cf1-4e97-a996-22dbd8ca9916	2025-07-01	2025-07-11	300	100	50	400	2025-07-29 15:21:54.039307+05	2025-07-29 15:31:40.543149+05
dbd48041-906c-47be-83e0-81172fe13f5e	b54839a9-e34e-457f-8d71-8ce2fe2c33a4	2025-06-29	2025-07-29	1000	0	500	1500	2025-07-29 15:35:39.595534+05	2025-07-29 15:38:02.334237+05
ead5871c-e7d6-4d40-9d47-e164f684d55e	3cbbeb38-cf30-4926-a3b2-eb440c68b12e	2025-07-30	2025-08-30	50000	0	49000	1000	2025-07-30 10:48:18.218611+05	2025-08-04 10:20:19.721693+05
72359acd-e1be-4d0d-a576-01d59463f37c	65d8e457-b424-4405-88d0-caf161825a85	2025-08-01	2025-08-31	80000	0	0	80000	2025-08-04 09:25:32.290325+05	2025-08-04 10:20:35.295499+05
73ce0c53-fbdf-4caa-833c-1357521d4325	65d8e457-b424-4405-88d0-caf161825a85	2025-08-01	2025-08-31	80000	10000	0	90000	2025-08-11 15:31:44.366399+05	2025-08-11 15:32:18.383167+05
\.


--
-- Data for Name: registrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.registrations (registration_id, user_id, token, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: schema_change_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schema_change_requests (request_id, change_type, target_table, change_details, requested_by, approved_by, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, username, email, phone, password_hash, is_active, created_at, updated_at, last_login, must_change_password, profile_picture_key) FROM stdin;
862aa2f8-fcd2-44b4-b093-3732260c6fe9	nonadmin	nonadmin@example.com	0987654321	$2b$12$1nzvQaRyozJTan2BkCqndeS8P3oUxZCuc8bRXiorAjjstWFhjITfK	t	2025-07-22 15:08:57.096578+05	\N	\N	f	\N
8f4fcc52-1ba2-4481-9dff-450df1e76dc4	adminuser_b53b2a31	admin_b53b2a31@example.com	1234567890_b53b2a31	$2b$12$SmBv..cZxO3oEnbRYS3VhuBlY3Ueu34ssZr5uodWLbPHMTiCgak0m	t	2025-07-22 15:38:47.36261+05	\N	\N	f	\N
bcd6eff6-507e-41c3-a0d6-87bf092d6cab	string	user@example.com	string	$2b$12$K4TfUJ4sJSVxl42LVMS7Se3SrnfbT.8I8BRg9jQR3WgduWZQoc91a	t	2025-07-22 15:47:52.507261+05	2025-07-22 15:47:56.866239+05	2025-07-22 15:47:57.188005+05	f	\N
07552fb4-bccb-42be-8888-244e000fc7fe	emp666_20250725065437	emp666@hrsystem.local	+921237474774	$2b$12$X9yzU9n6CUHpNeFTJ7QlGuWVfiXsGcYFRyvSQluIeSzbMyFaRJ.7G	t	2025-07-25 11:54:38.124253+05	\N	\N	f	\N
305148a6-6995-4d70-807d-d9bdf2fde283	EMP12345_20250725065515	EMP12345@hrsystem.local	+1234567890	$2b$12$01YWE/eTOMSh6ac89rkknOh2vMu0bRDjMXXA4TWuHabQ57PKytPNW	t	2025-07-25 11:55:15.398692+05	\N	\N	f	\N
c769ed63-4350-4b3a-8a17-a5c9c7425940	EMP1233232232345_20250725065856	EMP1233232232345@hrsystem.local	+123456743443890	$2b$12$6GrfJJjciwgtR45uc0dLXu2bX/1AS2CCWKxKJeuSeTjstgPbWEo3W	t	2025-07-25 11:58:56.938395+05	\N	\N	f	\N
cd64e920-7174-4bd3-b4cc-9e138a92715d	adminuser_313884c6	admin_313884c6@example.com	1234567890_313884c6	$2b$12$Q9DgninnAlfmPO8H3AxbDu1xJpWY1wtXrTm2QAT9ofZXDRwwFaxsC	t	2025-07-22 15:08:14.897722+05	2025-07-23 10:56:26.933591+05	2025-07-23 10:56:27.301181+05	f	\N
03117659-25bc-430e-8071-82e4daa5a43a	EMP124_20250723055718	EMP124@hrsystem.local	123-456-7890	$2b$12$Ci2EZbamMermneNEJ.uBUuf7JIsmroyPnqom9RHJ98FTA.Gj8V40K	t	2025-07-23 10:57:18.484919+05	\N	\N	f	\N
cb6106e5-646c-4e58-a28c-450adc8bdb35	adminuser_6a332fed	admin_6a332fed@example.com	1234567890_6a332fed	$2b$12$ZPdL5eqkUXiNx2enRTxAvOvVraF4iRUYkvfVym2mn4e8esGhbbQyu	t	2025-07-22 15:08:15.726082+05	2025-07-23 12:21:15.369326+05	2025-07-23 12:21:15.726495+05	f	\N
054cbace-5bcf-4e8d-973b-caa852ebca65	EMP154_20250723072314	EMP154@hrsystem.local	+92-1234567890	$2b$12$oaxEB845FEa609fFuBs/nOl6XuPPOqjba7cB9u4Z0rvNaFC.a73nC	t	2025-07-23 12:23:15.109542+05	\N	\N	f	\N
4a4e4a14-8680-41d0-bb5a-e57b1f0c533f	wP99222305_20250725070118	wP99222305@hrsystem.local	+9900220	$2b$12$THMpyIEqBB.eh2yAK4OZ/.gPfzIYn0b/QfvydSM2mSahdSPajSCPW	t	2025-07-25 12:01:19.213172+05	\N	\N	f	\N
ea1269f7-0ed2-4279-a787-cee9a137ba27	newuser	newuser@example.com	1234567890	$2b$12$xnjiVRHdVA0x0F1n7qYtLexgPX0pEiPnrSe12bOajGf4lLwt8r2SW	t	2025-07-22 15:08:52.084739+05	2025-07-25 12:25:43.257779+05	2025-07-25 12:25:43.559065+05	f	\N
b5e3e7b2-fd6c-467c-88ec-7a732a7d5db9	adminuser_7e884973	admin_7e884973@example.com	1234567890_7e884973	$2b$12$D5PSsHZ.8vdZZrnfUVIHx.dUiiIkeIx.lqILAc6z7jE454hD2MKiu	t	2025-07-22 15:08:13.952007+05	2025-07-23 15:33:44.9159+05	2025-07-23 15:33:45.285783+05	f	\N
cc01ae26-559b-4470-9054-fffb2329c384	adminuser_aed9e156	admin_aed9e156@example.com	1234567890_aed9e156	$2b$12$AtsEXoonrEG4xjMMXGDSFOTiSB.yhXxOi99ekg8gX5AWnBhG94pT6	t	2025-07-22 15:08:16.549939+05	2025-07-25 10:12:34.9817+05	2025-07-25 10:12:35.352124+05	f	\N
3d824553-c3b1-47db-aee8-c5feeb9f44ab	string_20250725051658	string@hrsystem.local	+923205622747	$2b$12$SDh9NS0Jf4TPrEdzOHNTd.bYXkLv7ucvbo36PP7sQPlgmQKjsC5VG	t	2025-07-25 10:16:59.075313+05	\N	\N	f	\N
69d74987-cbad-4e92-9167-ccfafde71ab5	adminuser_ea87db1e	admin_ea87db1e@example.com	1234567890_ea87db1e	$2b$12$.wLVTTAR8pgFWNluYZvYquC.XVvvX4AYVmTtw8np0m1kUd8pQT/kO	t	2025-07-22 15:08:37.003657+05	2025-07-25 11:52:15.209239+05	2025-07-25 11:52:15.521882+05	f	\N
b4ac4d34-d77d-46dc-a233-c2d3eef8b7f1	EMP69_20250730065920	EMP69@hrsystem.local	123	$2b$12$elfT1KhQ6inekA.MXh15F.szMMFLmB9VeE.UhH5CKF9vk7o5pPLnG	t	2025-07-30 11:59:20.743231+05	2025-08-12 12:30:10.992327+05	2025-08-12 12:30:11.312826+05	f	85242afe-f871-4ce5-9ea5-8fd457b42eaf.jpg
77bd5dab-3eb9-4eda-9306-2b5ab1519042	adminuser_f4610fbd	admin_f4610fbd@example.com	1234567890_f4610fbd	$2b$12$.X4NeYcDalcxbMGtuCS8a.zlALATqIccp2URT0id5.MOrwG00ZhCe	t	2025-07-22 15:38:46.520397+05	2025-07-30 12:02:14.440843+05	2025-07-30 12:02:14.74588+05	f	\N
923c56e9-ed27-4128-bcd7-72b9fd0b7dfe	adminuser_b19e3f76	admin_b19e3f76@example.com	1234567890_b19e3f76	$2b$12$.03xRqjdjk/pfq8ZeGsqcunurhLxmU0L8JhlAIKStmq42CwYtonWi	t	2025-07-22 15:11:10.5191+05	2025-07-25 15:39:28.577376+05	2025-07-25 15:39:28.910894+05	f	\N
ec7c450f-b525-49fc-a9ff-2119af4f7b86	adminuser_2169bd5e	admin_2169bd5e@example.com	1234567890_2169bd5e	$2b$12$onEruumyvw49PMdrrSexPOoLGRdsg1yQIdgC05RYsyL8deIuTL.Uq	t	2025-07-22 15:11:11.420195+05	2025-07-25 16:00:31.630571+05	2025-07-25 16:00:31.983225+05	f	\N
c41866fb-4f89-45aa-97af-833ae1ec9627	adminuser_d87179cd	admin_d87179cd@example.com	1234567890_d87179cd	$2b$12$QgQu2dvyUbS9Xdyi1YSE0eufBQyLnSfXiOeIZNevZsy2XI7SxHTfu	t	2025-07-22 15:38:45.620977+05	2025-07-28 09:56:52.092527+05	2025-07-28 09:56:52.392529+05	f	\N
3a91696c-6095-4920-8639-0974a55867e1	adminuser_d89e48f7	admin_d89e48f7@example.com	1234567890_d89e48f7	$2b$12$7ac30wxUrGvAZcU8MeN0QuG3DgR8q82TLwpcDaDIzXa.pzoFRWDiW	t	2025-07-22 15:11:12.342505+05	2025-07-29 15:35:09.467813+05	2025-07-29 15:35:09.765978+05	f	\N
f2c243bd-3c59-4df7-a595-30a89344378f	adminuser_48844ab2	admin_48844ab2@example.com	1234567890_48844ab2	$2b$12$Mu2mzHwZYXu/5JsI16OR3ujHKMHs02J2faZR/J88g5ePmBkDh6gcO	t	2025-07-22 15:11:13.140427+05	2025-07-30 10:05:28.086624+05	2025-07-30 10:06:10.200122+05	f	\N
bfa58084-b9ee-4332-aeb9-69d7f913f3f5	EMP007_20250806062157	EMP007@hrsystem.local	+9200707007	$2b$12$G.JT7OGHNrI7AGyXK3pJVukcIthOGG/HISyfqIXnzdo.seXcErCU6	t	2025-08-06 11:21:58.242009+05	2025-08-13 12:43:53.065185+05	2025-08-13 12:43:53.524379+05	f	\N
3accd360-9f17-4002-a87a-a08ff98c249b	stringy	userzz@example.com	stringy	$2b$12$FpDz2zMGLcXsdsPo10saiulxy0a4jSx5R8uc1014yR9MOAapEPRZe	t	2025-07-30 11:57:56.382283+05	\N	\N	f	\N
197932db-d679-4c4f-bac0-720a480c801a	adminuser_c6316302	admin_c6316302@example.com	1234567890_c6316302	$2b$12$jzD0dcixZ97N3/qnQZqyC.UQGO3ZSKbgfkGN3L2ciqq0bqWgBpwPO	t	2025-07-22 15:38:44.640878+05	2025-07-28 14:18:23.819886+05	2025-07-28 14:18:24.174687+05	f	\N
5a405fde-38d6-4c24-90eb-6aa223442282	testuser	testuser@example.com	1234563890	$2b$12$HPIwjBHsElvZAt3oYYh3eexRpR.UjS5nYGFd9lyO7PTSWBOrdYMxa	t	2025-07-22 15:08:52.423515+05	2025-07-29 15:09:25.615561+05	2025-07-29 15:09:25.94614+05	f	\N
ed0dfec9-e977-4031-b805-7dafe6448547	adminuser_873d24d8	admin_873d24d8@example.com	1234567890_873d24d8	$2b$12$xSG3cl8909KorWwUNKzM9Of2UEylSNz3ofQS.imlkj1kP2u05T9a6	t	2025-07-22 15:08:37.906084+05	2025-08-13 12:48:11.76569+05	2025-08-13 12:48:12.125707+05	f	\N
da11c730-751f-458e-a351-bf2040173eab	EMP256_20250729053239	EMP256@hrsystem.local	+923181982619	$2b$12$SeluZ/H7SoqlmVRWSsuQ4uzt8Ahe/uhrzbsDphgVgFfDxjiyR./LS	t	2025-07-29 10:32:39.578489+05	2025-08-12 12:29:57.774053+05	2025-08-12 12:29:58.091408+05	t	\N
\.


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (admin_id);


--
-- Name: admins admins_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_user_id_key UNIQUE (user_id);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: attendances attendances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_pkey PRIMARY KEY (attendance_id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_sessions chat_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_pkey PRIMARY KEY (id);


--
-- Name: departments departments_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_name_key UNIQUE (name);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (department_id);


--
-- Name: employees employees_employee_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_employee_number_key UNIQUE (employee_number);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (employee_id);


--
-- Name: employees employees_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_user_id_key UNIQUE (user_id);


--
-- Name: leaves leaves_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leaves
    ADD CONSTRAINT leaves_pkey PRIMARY KEY (leave_id);


--
-- Name: password_reset_requests password_reset_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_requests
    ADD CONSTRAINT password_reset_requests_pkey PRIMARY KEY (id);


--
-- Name: payrolls payrolls_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payrolls
    ADD CONSTRAINT payrolls_pkey PRIMARY KEY (payroll_id);


--
-- Name: registrations registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_pkey PRIMARY KEY (registration_id);


--
-- Name: schema_change_requests schema_change_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_change_requests
    ADD CONSTRAINT schema_change_requests_pkey PRIMARY KEY (request_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_chat_messages_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_messages_created_at ON public.chat_messages USING btree (created_at);


--
-- Name: idx_chat_messages_session; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_messages_session ON public.chat_messages USING btree (chat_session_id);


--
-- Name: idx_chat_sessions_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_sessions_employee ON public.chat_sessions USING btree (employee_id);


--
-- Name: idx_chat_sessions_password_reset; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_sessions_password_reset ON public.chat_sessions USING btree (password_reset_request_id);


--
-- Name: idx_chat_sessions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_sessions_status ON public.chat_sessions USING btree (status);


--
-- Name: idx_password_reset_requests_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_reset_requests_created_at ON public.password_reset_requests USING btree (created_at);


--
-- Name: idx_password_reset_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_reset_requests_status ON public.password_reset_requests USING btree (status);


--
-- Name: idx_password_reset_requests_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_reset_requests_user_id ON public.password_reset_requests USING btree (user_id);


--
-- Name: admins admins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: employees employees_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id);


--
-- Name: employees employees_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.employees(employee_id) ON DELETE SET NULL;


--
-- Name: employees employees_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: attendances fk_attendances_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT fk_attendances_user_id FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: chat_messages fk_chat_messages_sender; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT fk_chat_messages_sender FOREIGN KEY (sender_id) REFERENCES public.users(user_id);


--
-- Name: chat_messages fk_chat_messages_session; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT fk_chat_messages_session FOREIGN KEY (chat_session_id) REFERENCES public.chat_sessions(id);


--
-- Name: chat_sessions fk_chat_sessions_admin; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT fk_chat_sessions_admin FOREIGN KEY (admin_id) REFERENCES public.users(user_id);


--
-- Name: chat_sessions fk_chat_sessions_employee; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT fk_chat_sessions_employee FOREIGN KEY (employee_id) REFERENCES public.users(user_id);


--
-- Name: chat_sessions fk_chat_sessions_password_reset_request; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT fk_chat_sessions_password_reset_request FOREIGN KEY (password_reset_request_id) REFERENCES public.password_reset_requests(id);


--
-- Name: leaves leaves_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leaves
    ADD CONSTRAINT leaves_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- Name: password_reset_requests password_reset_requests_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_requests
    ADD CONSTRAINT password_reset_requests_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(user_id);


--
-- Name: password_reset_requests password_reset_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_requests
    ADD CONSTRAINT password_reset_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: payrolls payrolls_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payrolls
    ADD CONSTRAINT payrolls_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- Name: registrations registrations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: schema_change_requests schema_change_requests_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_change_requests
    ADD CONSTRAINT schema_change_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(user_id);


--
-- Name: schema_change_requests schema_change_requests_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_change_requests
    ADD CONSTRAINT schema_change_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(user_id);


--
-- PostgreSQL database dump complete
--

\unrestrict v8O6RyX3fpgTJRqbISGgRCz3vUBDlkBjEfn7KSrbE7Ntg52dMtgzl3cuvOXAdvz

