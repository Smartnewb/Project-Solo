-- drop policy "Comments are viewable by everyone" on "public"."comments";

-- drop policy "Users can insert their own comments" on "public"."comments";

-- drop policy "Users can update own comments" on "public"."comments";

-- drop policy "Posts are viewable by everyone" on "public"."posts";

-- drop policy "Users can insert their own posts" on "public"."posts";

-- drop policy "Users can update own posts" on "public"."posts";

-- alter table "public"."comments" drop constraint "comments_author_id_fkey";

-- alter table "public"."posts" drop constraint "posts_author_id_fkey";

-- alter table "public"."reports" drop constraint "reports_reported_id_fkey";

-- alter table "public"."reports" drop constraint "reports_reporter_id_fkey";

-- alter table "public"."comments" drop column "studentid";
-- alter table "public"."comments" drop constraint "comments_post_id_fkey";
-- alter table "public"."posts" drop constraint "posts_pkey";

-- create table "public"."matches" (
--     "id" uuid not null default uuid_generate_v4(),
--     "user1_id" uuid,
--     "user2_id" uuid,
--     "match_date" date,
--     "match_time" text,
--     "status" text default 'pending'::text,
--     "created_at" timestamp with time zone default now(),
--     "updated_at" timestamp with time zone default now()
-- );


alter table "public"."matches" enable row level security;

-- create table "public"."matching_requests" (
--     "id" uuid not null default uuid_generate_v4(),
--     "user_id" uuid,
--     "status" text default 'pending'::text,
--     "preferred_date" date,
--     "preferred_time" text,
--     "created_at" timestamp with time zone default now(),
--     "updated_at" timestamp with time zone default now()
-- );


alter table "public"."matching_requests" enable row level security;

-- create table "public"."user_preferences" (
--     "id" uuid not null default uuid_generate_v4(),
--     "user_id" uuid,
--     "preferred_genres" text[],
--     "preferred_days" text[],
--     "preferred_times" text[],
--     "created_at" timestamp with time zone default now(),
--     "updated_at" timestamp with time zone default now()
-- );


alter table "public"."user_preferences" enable row level security;

-- alter table "public"."comments" drop column "emoji";

-- alter table "public"."comments" drop column "isdeleted";

-- alter table "public"."comments" drop column "isedited";

-- alter table "public"."comments" drop column "nickname";

-- alter table "public"."comments" drop column "reports";

alter table "public"."comments" disable row level security;

-- alter table "public"."posts" drop column "userid";

alter table "public"."posts" add column "isEdited" boolean default false;

alter table "public"."posts" add column "timestamp" timestamp with time zone default now();

alter table "public"."posts" add column "userId" uuid not null default uuid_generate_v4();

alter table "public"."posts" disable row level security;

alter table "public"."profiles" add column "is_admin" boolean default false;

alter table "public"."profiles" disable row level security;

alter table "public"."profiles" add column "university" TEXT;

alter table "public"."profiles" add column "department" TEXT;

alter table "public"."profiles" add column "student_id" TEXT;

alter table "public"."profiles" add column "grade" TEXT;

alter table "public"."profiles" add column "image" TEXT;

alter table "public"."profiles" add column "height" TEXT;

alter table "public"."profiles" add column "personalities" TEXT[];

alter table "public"."profiles" add column "dating_styles" TEXT[];

alter table "public"."profiles" add column "ideal_lifestyles" TEXT[];

alter table "public"."profiles" add column "interests" TEXT;

alter table "public"."profiles" add column "drinking" TEXT;

alter table "public"."profiles" add column "smoking" TEXT;

alter table "public"."profiles" add column "tattoo" TEXT;

alter table "public"."reports" disable row level security;

CREATE UNIQUE INDEX matches_pkey ON public.matches USING btree (id);

CREATE UNIQUE INDEX matching_requests_pkey ON public.matching_requests USING btree (id);

CREATE UNIQUE INDEX user_preferences_pkey ON public.user_preferences USING btree (id);

CREATE UNIQUE INDEX posts_pkey ON public.posts USING btree ("userId");

alter table "public"."matches" add constraint "matches_pkey" PRIMARY KEY using index "matches_pkey";

alter table "public"."matching_requests" add constraint "matching_requests_pkey" PRIMARY KEY using index "matching_requests_pkey";

alter table "public"."user_preferences" add constraint "user_preferences_pkey" PRIMARY KEY using index "user_preferences_pkey";

alter table "public"."posts" add constraint "posts_pkey" PRIMARY KEY using index "posts_pkey";

alter table "public"."matches" add constraint "matches_user1_id_fkey" FOREIGN KEY (user1_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."matches" validate constraint "matches_user1_id_fkey";

alter table "public"."matches" add constraint "matches_user2_id_fkey" FOREIGN KEY (user2_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."matches" validate constraint "matches_user2_id_fkey";

alter table "public"."matches" add constraint "valid_match_status" CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text, 'completed'::text]))) not valid;

alter table "public"."matches" validate constraint "valid_match_status";

alter table "public"."matching_requests" add constraint "matching_requests_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."matching_requests" validate constraint "matching_requests_user_id_fkey";

alter table "public"."matching_requests" add constraint "valid_status" CHECK ((status = ANY (ARRAY['pending'::text, 'matched'::text, 'cancelled'::text]))) not valid;

alter table "public"."matching_requests" validate constraint "valid_status";

alter table "public"."user_preferences" add constraint "user_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_preferences" validate constraint "user_preferences_user_id_fkey";

-- alter table "public"."comments" add constraint "comments_post_id_fkey" FOREIGN KEY (post_id) REFERENCES posts("userId") ON DELETE CASCADE not valid;

-- alter table "public"."comments" validate constraint "comments_post_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.alter_profiles_table()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- 기존 테이블 백업
    CREATE TABLE IF NOT EXISTS profiles_backup AS SELECT * FROM profiles;
    
    -- 의존성이 있는 테이블들을 먼저 삭제
    DROP TABLE IF EXISTS matches CASCADE;
    DROP TABLE IF EXISTS matching_requests CASCADE;
    DROP TABLE IF EXISTS user_preferences CASCADE;
    DROP TABLE IF EXISTS profiles CASCADE;
    
    -- 테이블 재생성
    CREATE TABLE profiles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT,
        age INTEGER,
        gender TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 데이터 복원
    INSERT INTO profiles (id, user_id, name, created_at, updated_at)
    SELECT id, user_id, name, created_at, updated_at
    FROM profiles_backup;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."matches" to "anon";

grant insert on table "public"."matches" to "anon";

grant references on table "public"."matches" to "anon";

grant select on table "public"."matches" to "anon";

grant trigger on table "public"."matches" to "anon";

grant truncate on table "public"."matches" to "anon";

grant update on table "public"."matches" to "anon";

grant delete on table "public"."matches" to "authenticated";

grant insert on table "public"."matches" to "authenticated";

grant references on table "public"."matches" to "authenticated";

grant select on table "public"."matches" to "authenticated";

grant trigger on table "public"."matches" to "authenticated";

grant truncate on table "public"."matches" to "authenticated";

grant update on table "public"."matches" to "authenticated";

grant delete on table "public"."matches" to "service_role";

grant insert on table "public"."matches" to "service_role";

grant references on table "public"."matches" to "service_role";

grant select on table "public"."matches" to "service_role";

grant trigger on table "public"."matches" to "service_role";

grant truncate on table "public"."matches" to "service_role";

grant update on table "public"."matches" to "service_role";

grant delete on table "public"."matching_requests" to "anon";

grant insert on table "public"."matching_requests" to "anon";

grant references on table "public"."matching_requests" to "anon";

grant select on table "public"."matching_requests" to "anon";

grant trigger on table "public"."matching_requests" to "anon";

grant truncate on table "public"."matching_requests" to "anon";

grant update on table "public"."matching_requests" to "anon";

grant delete on table "public"."matching_requests" to "authenticated";

grant insert on table "public"."matching_requests" to "authenticated";

grant references on table "public"."matching_requests" to "authenticated";

grant select on table "public"."matching_requests" to "authenticated";

grant trigger on table "public"."matching_requests" to "authenticated";

grant truncate on table "public"."matching_requests" to "authenticated";

grant update on table "public"."matching_requests" to "authenticated";

grant delete on table "public"."matching_requests" to "service_role";

grant insert on table "public"."matching_requests" to "service_role";

grant references on table "public"."matching_requests" to "service_role";

grant select on table "public"."matching_requests" to "service_role";

grant trigger on table "public"."matching_requests" to "service_role";

grant truncate on table "public"."matching_requests" to "service_role";

grant update on table "public"."matching_requests" to "service_role";

grant delete on table "public"."user_preferences" to "anon";

grant insert on table "public"."user_preferences" to "anon";

grant references on table "public"."user_preferences" to "anon";

grant select on table "public"."user_preferences" to "anon";

grant trigger on table "public"."user_preferences" to "anon";

grant truncate on table "public"."user_preferences" to "anon";

grant update on table "public"."user_preferences" to "anon";

grant delete on table "public"."user_preferences" to "authenticated";

grant insert on table "public"."user_preferences" to "authenticated";

grant references on table "public"."user_preferences" to "authenticated";

grant select on table "public"."user_preferences" to "authenticated";

grant trigger on table "public"."user_preferences" to "authenticated";

grant truncate on table "public"."user_preferences" to "authenticated";

grant update on table "public"."user_preferences" to "authenticated";

grant delete on table "public"."user_preferences" to "service_role";

grant insert on table "public"."user_preferences" to "service_role";

grant references on table "public"."user_preferences" to "service_role";

grant select on table "public"."user_preferences" to "service_role";

grant trigger on table "public"."user_preferences" to "service_role";

grant truncate on table "public"."user_preferences" to "service_role";

grant update on table "public"."user_preferences" to "service_role";

create policy "Users can view their own matches"
on "public"."matches"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND ((profiles.id = matches.user1_id) OR (profiles.id = matches.user2_id))))));


create policy "Users can insert own matching requests"
on "public"."matching_requests"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = matching_requests.user_id) AND (profiles.user_id = auth.uid())))));


create policy "Users can update own matching requests"
on "public"."matching_requests"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = matching_requests.user_id) AND (profiles.user_id = auth.uid())))));


create policy "Users can view own matching requests"
on "public"."matching_requests"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = matching_requests.user_id) AND (profiles.user_id = auth.uid())))));


create policy "Users can insert own preferences"
on "public"."user_preferences"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = user_preferences.user_id) AND (profiles.user_id = auth.uid())))));


create policy "Users can update own preferences"
on "public"."user_preferences"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = user_preferences.user_id) AND (profiles.user_id = auth.uid())))));


create policy "Users can view own preferences"
on "public"."user_preferences"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = user_preferences.user_id) AND (profiles.user_id = auth.uid())))));


CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matching_requests_updated_at BEFORE UPDATE ON public.matching_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


